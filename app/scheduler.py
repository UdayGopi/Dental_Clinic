from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Appointment, Message, MessageType, MessageStatus, MessageTemplate, ReminderStage, Broadcast
from app.services.messaging import MessagingService
from app.services.broadcast import broadcast_service
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
            CronTrigger(minute='*/1'),  # Run every 15 minutes
            id='process_pending_messages'
        )
        
        self.scheduler.add_job(
            self.create_recall_reminders,
            CronTrigger(hour=9, minute=0),  # Run daily at 9 AM
            id='create_recall_reminders'
        )
        
        self.scheduler.add_job(
            self.process_scheduled_broadcasts,
            CronTrigger(minute='*/30'),  # Run every 30 minutes
            id='process_scheduled_broadcasts'
        )
        
        # Start the scheduler
        self.scheduler.start()
        logger.info("Scheduler started")
    
    def process_pending_messages(self, force_immediate=False):
        """Process all pending messages
        
        Args:
            force_immediate: If True, process all pending messages regardless of scheduled_for date
        """
        db = SessionLocal()
        try:
            count = self.messaging_service.process_pending_messages(db, force_immediate=force_immediate)
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
            
            # Ensure patient relationship is loaded
            db.refresh(appointment, ['patient'])
            
            # Get patient details explicitly
            patient = appointment.patient
            if not patient:
                logger.error(f"Patient not found for appointment {appointment.id}")
                return
            
            # Log patient details for verification
            logger.info(f"Creating reminders for appointment {appointment.id} - Patient: {patient.id} ({patient.first_name} {patient.last_name}), Phone: {patient.phone_number}")
            
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
                
                # Create context for template using patient data
                context = {
                    "patient_first_name": patient.first_name,
                    "patient_last_name": patient.last_name,
                    "patient_phone": patient.phone_number,
                    "appointment_date": appointment.appointment_date.strftime("%B %d, %Y"),
                    "appointment_time": appointment.appointment_date.strftime("%I:%M %p"),
                    "doctor_name": appointment.doctor_name or "Dr. Smith",  # Default if not set
                    "appointment_type": appointment.appointment_type or "General Checkup"  # Default if not set
                }
                
                # Render message content
                message_content = self.messaging_service.render_template(
                    template.content,
                    context
                )
                
                # Create message with explicit patient_id
                message = Message(
                    patient_id=patient.id,  # Use explicit patient.id
                    appointment_id=appointment.id,
                    message_type=MessageType.APPOINTMENT_REMINDER,
                    reminder_stage=stage,
                    content=message_content,
                    status=MessageStatus.PENDING,
                    scheduled_for=scheduled_time
                )
                
                db.add(message)
                logger.debug(f"Created {stage} reminder for patient {patient.id} scheduled for {scheduled_time}")
            
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
                # Check if patient has consent
                if not appointment.patient.consent_sms:
                    continue
                
                # Check if patient already has a scheduled appointment in the next 30 days
                future_appointment = db.query(Appointment).filter(
                    Appointment.patient_id == appointment.patient_id,
                    Appointment.status == "scheduled",
                    Appointment.appointment_date >= today,
                    Appointment.appointment_date <= today + timedelta(days=30)
                ).first()
                
                if future_appointment:
                    logger.info(f"Patient {appointment.patient_id} already has upcoming appointment, skipping recall")
                    continue
                
                # Check if we already sent a recall for this appointment
                existing_reminder = db.query(Message).filter(
                    Message.appointment_id == appointment.id,
                    Message.message_type == MessageType.RECALL
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
                    appointment_id=appointment.id,
                    template_id=recall_template.id,
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
    
    def process_scheduled_broadcasts(self):
        """Process scheduled broadcasts that are due"""
        db = SessionLocal()
        try:
            # Find broadcasts that are scheduled and due
            now = datetime.now()
            pending_broadcasts = db.query(Broadcast).filter(
                Broadcast.status == "pending",
                Broadcast.scheduled_at <= now
            ).all()
            
            for broadcast in pending_broadcasts:
                logger.info(f"Processing scheduled broadcast {broadcast.id}")
                broadcast_service.process_broadcast(broadcast.id, db)
                
        except Exception as e:
            logger.error(f"Error processing scheduled broadcasts: {str(e)}")
        finally:
            db.close()
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler shut down")

# Create scheduler instance
scheduler = AppointmentScheduler()