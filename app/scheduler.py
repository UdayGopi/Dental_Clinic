from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Appointment, Message, MessageType, MessageStatus, MessageTemplate, ReminderStage
from app.services.messaging import MessagingService
from app.config import config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AppointmentScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.messaging_service = MessagingService()
        
    def start(self):
        """Start the scheduler"""
        # Schedule jobs
        self.scheduler.add_job(
            self.process_pending_messages,
            CronTrigger(minute='*/15'),  # Run every 15 minutes
            id='process_pending_messages'
        )
        
        self.scheduler.add_job(
            self.create_recall_reminders,
            CronTrigger(hour=9, minute=0),  # Run daily at 9 AM
            id='create_recall_reminders'
        )
        
        # Start the scheduler
        self.scheduler.start()
        logger.info("Scheduler started")
    
    def process_pending_messages(self):
        """Process all pending messages"""
        db = SessionLocal()
        try:
            count = self.messaging_service.process_pending_messages(db)
            logger.info(f"Processed {count} pending messages")
        except Exception as e:
            logger.error(f"Error processing pending messages: {str(e)}")
        finally:
            db.close()
    
    def create_appointment_reminders(self, appointment: Appointment, db: Session):
        """Create staged reminders for a new appointment"""
        try:
            # Get reminder templates
            templates = db.query(MessageTemplate).filter(
                MessageTemplate.message_type == MessageType.APPOINTMENT_REMINDER
            ).all()
            
            # Calculate reminder times
            reminder_times = {
                ReminderStage.DAYS_BEFORE: appointment.appointment_date - timedelta(days=config.REMINDER_DAYS_BEFORE),
                ReminderStage.DAY_BEFORE: appointment.appointment_date - timedelta(days=config.REMINDER_DAY_BEFORE),
                ReminderStage.HOURS_BEFORE: appointment.appointment_date - timedelta(hours=config.REMINDER_HOURS_BEFORE)
            }
            
            # Create reminders for each stage
            for stage, scheduled_time in reminder_times.items():
                # Find stage-specific template or use default
                template = next(
                    (t for t in templates if t.reminder_stage == stage),
                    next((t for t in templates if t.reminder_stage is None), None)
                )
                
                if not template:
                    logger.warning(f"No template found for {stage} reminder")
                    continue
                
                # Create context for template
                context = {
                    "patient_first_name": appointment.patient.first_name,
                    "patient_last_name": appointment.patient.last_name,
                    "appointment_date": appointment.appointment_date.strftime("%B %d, %Y"),
                    "appointment_time": appointment.appointment_date.strftime("%I:%M %p")
                }
                
                # Render message content
                message_content = self.messaging_service.render_template(
                    template.content,
                    context
                )
                
                # Create message
                message = Message(
                    patient_id=appointment.patient_id,
                    appointment_id=appointment.id,
                    message_type=MessageType.APPOINTMENT_REMINDER,
                    reminder_stage=stage,
                    content=message_content,
                    status=MessageStatus.PENDING,
                    scheduled_for=scheduled_time
                )
                
                db.add(message)
            
            db.commit()
            logger.info(f"Created staged reminders for appointment {appointment.id}")
            
        except Exception as e:
            logger.error(f"Error creating appointment reminders: {str(e)}")
            db.rollback()
    
    def create_recall_reminders(self):
        """Create recall reminders for patients due for follow-up"""
        db = SessionLocal()
        try:
            # Find appointments that need recall reminders
            today = datetime.now().date()
            
            # Get appointments that are due for recall
            due_appointments = db.query(Appointment).filter(
                Appointment.status == "completed",
                Appointment.followup_required == True,
                # Calculate the recall date based on appointment date + followup interval
                (Appointment.appointment_date + timedelta(days=Appointment.followup_interval_days)).between(
                    today - timedelta(days=7),  # Include appointments up to 7 days overdue
                    today
                )
            ).all()
            
            # Get recall template
            recall_template = db.query(MessageTemplate).filter(
                MessageTemplate.message_type == MessageType.RECALL
            ).first()
            
            if not recall_template:
                logger.error("No recall template found")
                return
            
            # Create reminder messages
            count = 0
            for appointment in due_appointments:
                # Check if we already sent a recall reminder for this appointment
                existing_reminder = db.query(Message).filter(
                    Message.patient_id == appointment.patient_id,
                    Message.message_type == MessageType.RECALL,
                    Message.created_at >= today - timedelta(days=30)  # No reminders in the last 30 days
                ).first()
                
                if existing_reminder:
                    continue
                
                # Create context for template
                context = {
                    "patient_first_name": appointment.patient.first_name,
                    "patient_last_name": appointment.patient.last_name,
                    "last_appointment_date": appointment.appointment_date.strftime("%B %d, %Y")
                }
                
                # Render message content
                message_content = self.messaging_service.render_template(
                    recall_template.content, 
                    context
                )
                
                # Create message
                message = Message(
                    patient_id=appointment.patient_id,
                    message_type=MessageType.RECALL,
                    content=message_content,
                    status=MessageStatus.PENDING,
                    scheduled_for=datetime.now()
                )
                
                db.add(message)
                count += 1
            
            db.commit()
            logger.info(f"Created {count} recall reminders")
            
        except Exception as e:
            logger.error(f"Error creating recall reminders: {str(e)}")
        finally:
            db.close()

# Create scheduler instance
scheduler = AppointmentScheduler()