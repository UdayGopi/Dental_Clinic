import logging
from datetime import datetime, time
from sqlalchemy.orm import Session
import jinja2

from app.config import config
from app.models import Message, MessageStatus, Patient

logger = logging.getLogger(__name__)

# Twilio SMS
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("twilio not installed. Install with: pip install twilio")

class MessagingService:
    def __init__(self):
        # Initialize Twilio client
        self.twilio_client = None
        if TWILIO_AVAILABLE:
            try:
                if config.TWILIO_ACCOUNT_SID and config.TWILIO_AUTH_TOKEN:
                    self.twilio_client = TwilioClient(
                        config.TWILIO_ACCOUNT_SID,
                        config.TWILIO_AUTH_TOKEN
                    )
                    logger.info("Twilio client initialized successfully")
                    # Log configuration for debugging
                    logger.info(f"Twilio Config - Account SID: {config.TWILIO_ACCOUNT_SID[:10]}..., Phone: {config.TWILIO_PHONE_NUMBER}, WhatsApp: {config.TWILIO_WHATSAPP_NUMBER}, Channel: {config.MESSAGE_CHANNEL}")
                else:
                    logger.warning("Twilio credentials not found in config. SMS sending will be disabled.")
            except Exception as e:
                logger.error(f"Twilio: Failed to initialize client: {str(e)}")
        else:
            logger.warning("Twilio: twilio library not installed. SMS sending will be disabled.")
        
        self.dnd_start = time(config.DND_START_HOUR)
        self.dnd_end = time(config.DND_END_HOUR)
        
        # Initialize template engine
        self.template_env = jinja2.Environment(
            autoescape=True
        )
    
    def is_dnd_hours(self, current_time=None):
        """Check if current time is within Do Not Disturb hours"""
        if current_time is None:
            current_time = datetime.now().time()
        
        if self.dnd_start < self.dnd_end:
            # Simple case: DND period is within the same day
            return self.dnd_start <= current_time <= self.dnd_end
        else:
            # DND period spans midnight
            return current_time >= self.dnd_start or current_time <= self.dnd_end
    
    def can_send_message(self, patient: Patient, current_time=None):
        """Check if a message can be sent to the patient"""
        # Check patient consent
        if not patient.consent_sms:
            logger.info(f"Patient {patient.id} has not consented to SMS messages")
            return False
        
        # Check DND hours (only if enabled)
        if config.DND_ENABLED and self.is_dnd_hours(current_time):
            logger.info(f"Current time is within DND hours")
            return False
        
        return True
    
    def render_template(self, template_content, context):
        """Render a message template with the given context"""
        template = self.template_env.from_string(template_content)
        return template.render(**context)
    
    def send_sms(self, to_number: str, message_content: str, db_message: Message = None, db: Session = None, use_whatsapp: bool = False):
        """Send SMS or WhatsApp message via Twilio with automatic fallback to SMS if WhatsApp fails"""
        if not self.twilio_client:
            logger.error("Twilio client not initialized. Cannot send message.")
            if db_message and db:
                db_message.status = MessageStatus.FAILED
                db_message.error_message = "Twilio not configured"
                db.commit()
            return None
        
        # Determine preferred channel
        prefer_whatsapp = use_whatsapp or config.MESSAGE_CHANNEL in ["whatsapp", "both"]
        whatsapp_failed_with_channel_error = False
        
        # Try WhatsApp first if preferred
        if prefer_whatsapp and config.TWILIO_WHATSAPP_NUMBER:
            try:
                # Format numbers for WhatsApp (whatsapp:+1234567890)
                from_number = config.TWILIO_WHATSAPP_NUMBER
                if not from_number.startswith("whatsapp:"):
                    from_number = f"whatsapp:{from_number}"
                
                to_number_formatted = to_number
                if not to_number_formatted.startswith("whatsapp:"):
                    to_number_formatted = f"whatsapp:{to_number_formatted}"
                
                # Log the phone numbers being used (for debugging)
                logger.info(f"Twilio: Attempting to send WhatsApp message")
                logger.info(f"  From (Twilio Number): {from_number}")
                logger.info(f"  To (Patient Number): {to_number_formatted}")
                
                # Send message via Twilio WhatsApp
                message = self.twilio_client.messages.create(
                    body=message_content,
                    from_=from_number,
                    to=to_number_formatted
                )
                
                message_sid = message.sid
                
                # Update database record if provided
                if db_message and db:
                    db_message.provider_message_id = message_sid
                    db_message.status = MessageStatus.SENT
                    db_message.sent_at = datetime.now()
                    db.commit()
                    db.refresh(db_message)
                
                logger.info(f"Twilio: WhatsApp message sent successfully to {to_number}, SID: {message_sid}")
                return message_sid
                
            except Exception as e:
                error_message = str(e)
                
                # Extract error code if available
                if "63007" in error_message or "Channel" in error_message:
                    whatsapp_failed_with_channel_error = True
                    logger.warning(f"WhatsApp channel error (63007): {error_message}")
                    logger.warning(f"Falling back to SMS instead...")
                else:
                    logger.error(f"Twilio WhatsApp failed: {error_message}")
                    # Other WhatsApp errors - don't fallback, just fail
                    if db_message and db:
                        db_message.status = MessageStatus.FAILED
                        db_message.error_message = f"WhatsApp error: {error_message}"
                        db.commit()
                        db.refresh(db_message)
                    return None
        
        # SMS messaging (either preferred or fallback from WhatsApp)
        if not prefer_whatsapp or whatsapp_failed_with_channel_error or not config.TWILIO_WHATSAPP_NUMBER:
            try:
                from_number = config.TWILIO_PHONE_NUMBER
                if not from_number:
                    logger.error(f"TWILIO_PHONE_NUMBER is not set in config. Current value: '{from_number}'")
                    if db_message and db:
                        db_message.status = MessageStatus.FAILED
                        db_message.error_message = "Twilio phone number not configured"
                        db.commit()
                    return None
                
                to_number_formatted = to_number
                
                # Log the phone numbers being used (for debugging)
                logger.info(f"Twilio: Sending SMS message")
                logger.info(f"  From (Twilio Number): {from_number}")
                logger.info(f"  To (Patient Number): {to_number_formatted}")
                
                # Send message via Twilio SMS
                message = self.twilio_client.messages.create(
                    body=message_content,
                    from_=from_number,
                    to=to_number_formatted
                )
                
                message_sid = message.sid
                
                # Update database record if provided
                if db_message and db:
                    db_message.provider_message_id = message_sid
                    db_message.status = MessageStatus.SENT
                    db_message.sent_at = datetime.now()
                    db.commit()
                    db.refresh(db_message)
                
                logger.info(f"Twilio: SMS message sent successfully to {to_number}, SID: {message_sid}")
                return message_sid
                
            except Exception as e:
                error_message = str(e)
                logger.error(f"Twilio SMS failed to send to {to_number}: {error_message}")
                
                # Update database record if provided
                if db_message and db:
                    db_message.status = MessageStatus.FAILED
                    db_message.error_message = f"SMS error: {error_message}"
                    db.commit()
                    db.refresh(db_message)
                
                return None
        
        # If we reach here, neither WhatsApp nor SMS worked
        logger.error("Failed to send message via both WhatsApp and SMS")
        if db_message and db:
            db_message.status = MessageStatus.FAILED
            db_message.error_message = "Both WhatsApp and SMS failed"
            db.commit()
            db.refresh(db_message)
        return None
    
    def send_whatsapp(self, to_number: str, message_content: str, db_message: Message = None, db: Session = None):
        """Send WhatsApp message via Twilio (wrapper for send_sms with WhatsApp flag)"""
        return self.send_sms(to_number, message_content, db_message, db, use_whatsapp=True)
    
    def process_message(self, message_id: int, custom_variables: dict = None, db: Session = None):
        """Process a message from the database by ID"""
        if db is None:
            from app.database import SessionLocal
            db = SessionLocal()
            should_close = True
        else:
            should_close = False
        
        try:
            # Query message with explicit patient join to ensure fresh data
            message = db.query(Message).filter(Message.id == message_id).first()
            if not message:
                logger.error(f"Message {message_id} not found")
                return
            
            # Explicitly reload patient from database to avoid cached data
            db.refresh(message, ['patient'])
            
            # Double-check: Query patient directly to ensure we have latest data
            patient = db.query(Patient).filter(Patient.id == message.patient_id).first()
            if not patient:
                logger.error(f"Patient {message.patient_id} not found for message {message_id}")
                message.status = MessageStatus.FAILED
                message.error_message = f"Patient {message.patient_id} not found"
                db.commit()
                return
            
            # Update message.patient reference to use fresh patient data
            message.patient = patient
            
            # Log patient details to verify correct patient
            logger.info(f"Processing message {message_id} for patient ID {patient.id}: {patient.first_name} {patient.last_name}, Phone: {patient.phone_number}")
            
            # Check if patient has consent
            if not message.patient.consent_sms:
                message.status = MessageStatus.FAILED
                message.error_message = "Patient has not consented to SMS"
                db.commit()
                logger.info(f"Message {message.id} not sent - no consent")
                return
            
            # Check DND hours (only if enabled)
            if config.DND_ENABLED and self.is_dnd_hours():
                logger.info(f"Message {message.id} not sent - within DND hours, will retry later")
                return
            
            # If message doesn't have content yet, render from template
            if not message.content and message.template:
                db.refresh(message, ['template'])
                # Use patient data directly (already loaded fresh above)
                context = {
                    "patient_first_name": patient.first_name,
                    "patient_last_name": patient.last_name,
                    "patient_phone": patient.phone_number
                }
                
                # If message has appointment_id, load appointment details
                if message.appointment_id:
                    from app.models import Appointment
                    appointment = db.query(Appointment).filter(Appointment.id == message.appointment_id).first()
                    if appointment:
                        context.update({
                            "appointment_date": appointment.appointment_date.strftime("%B %d, %Y") if appointment.appointment_date else "",
                            "appointment_time": appointment.appointment_date.strftime("%I:%M %p") if appointment.appointment_date else "",
                            "doctor_name": appointment.doctor_name or "Dr. Smith",
                            "appointment_type": appointment.appointment_type or "General Checkup"
                        })
                
                if custom_variables:
                    context.update(custom_variables)
                message.content = self.render_template(message.template.content, context)
                db.commit()
            
            # Get patient phone number - use fresh patient data
            patient_phone = patient.phone_number
            if not patient_phone:
                logger.error(f"Message {message.id}: Patient {message.patient_id} has no phone number")
                message.status = MessageStatus.FAILED
                message.error_message = "Patient phone number not found"
                db.commit()
                return
            
            # Log patient details for debugging (use fresh patient data)
            logger.info(f"Message {message.id}: Sending to patient ID {patient.id} - Name: {patient.first_name} {patient.last_name}, Phone: {patient_phone}, Email: {patient.email}")
            
            # Determine if we should use WhatsApp based on config
            use_whatsapp = config.MESSAGE_CHANNEL in ["whatsapp", "both"]
            
            # Send the message with retry logic
            max_retries = 3
            message_sid = None
            
            for attempt in range(max_retries):
                message_sid = self.send_sms(
                    patient_phone, 
                    message.content, 
                    message, 
                    db,
                    use_whatsapp=use_whatsapp
                )
                
                if message_sid:
                    message.retry_count = attempt
                    logger.info(f"Message {message.id} sent successfully on attempt {attempt + 1}")
                    break
                else:
                    message.retry_count = attempt + 1
                    if attempt < max_retries - 1:
                        logger.warning(f"Message {message.id} failed on attempt {attempt + 1}, will retry")
                        import time
                        time.sleep(2 ** attempt)  # Exponential backoff
                    else:
                        message.status = MessageStatus.FAILED
                        message.error_message = "Failed after max retries"
                        db.commit()
                        logger.error(f"Message {message.id} failed after {max_retries} attempts")
            
        except Exception as e:
            logger.error(f"Error processing message {message_id}: {str(e)}")
            if message:
                message.status = MessageStatus.FAILED
                message.error_message = str(e)
                db.commit()
        finally:
            if should_close:
                db.close()
    
    def process_pending_messages(self, db, force_immediate=False):
        """Process all pending messages that are due to be sent
        
        Args:
            db: Database session
            force_immediate: If True, process all pending messages regardless of scheduled_for date
        """
        now = datetime.now()
        
        # First, get all pending messages for logging
        all_pending = db.query(Message).filter(
            Message.status == MessageStatus.PENDING
        ).all()
        
        if all_pending:
            logger.info(f"Found {len(all_pending)} total pending messages")
            for msg in all_pending:
                if msg.scheduled_for:
                    time_diff = msg.scheduled_for - now
                    if time_diff.total_seconds() > 0:
                        logger.info(f"  Message {msg.id}: Scheduled for {msg.scheduled_for} (in {time_diff}) - NOT DUE YET")
                    else:
                        logger.info(f"  Message {msg.id}: Scheduled for {msg.scheduled_for} (OVERDUE by {abs(time_diff)}) - WILL PROCESS")
                else:
                    logger.info(f"  Message {msg.id}: No scheduled_for date - WILL PROCESS")
        
        # Get messages that are due to be sent
        if force_immediate:
            pending_messages = all_pending
            logger.info(f"FORCE IMMEDIATE MODE: Processing all {len(pending_messages)} pending messages")
        else:
            pending_messages = db.query(Message).filter(
                (Message.status == MessageStatus.PENDING) & 
                ((Message.scheduled_for == None) | (Message.scheduled_for <= now))
            ).all()
            logger.info(f"Found {len(pending_messages)} messages due to be sent now (out of {len(all_pending)} total pending)")
        
        for message in pending_messages:
            logger.info(f"Processing message {message.id} for patient {message.patient_id}")
            self.process_message(message.id, None, db)
        
        return len(pending_messages)
    
    def handle_opt_out(self, phone_number: str, db: Session):
        """Handle STOP message from patient"""
        try:
            # Find patient by phone number
            patient = db.query(Patient).filter(Patient.phone_number == phone_number).first()
            
            if patient:
                # Update consent status
                patient.consent_sms = False
                patient.consent_date = datetime.now()
                db.commit()
                
                logger.info(f"Patient {patient.id} has opted out of SMS messages")
                return True
            else:
                logger.warning(f"Received opt-out from unknown number: {phone_number}")
                return False
                
        except Exception as e:
            logger.error(f"Error handling opt-out for {phone_number}: {str(e)}")
            return False

# Create singleton instance
messaging_service = MessagingService()