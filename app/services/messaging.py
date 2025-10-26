import logging
from datetime import datetime, time
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from sqlalchemy.orm import Session
import jinja2

from app.config import config
from app.models import Message, MessageStatus, Patient

logger = logging.getLogger(__name__)

class MessagingService:
    def __init__(self):
        self.client = Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
        self.from_number = config.TWILIO_PHONE_NUMBER
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
        
        # Check DND hours
        if self.is_dnd_hours(current_time):
            logger.info(f"Current time is within DND hours")
            return False
        
        return True
    
    def render_template(self, template_content, context):
        """Render a message template with the given context"""
        template = self.template_env.from_string(template_content)
        return template.render(**context)
    
    def send_sms(self, to_number: str, message_content: str, db_message: Message = None, db: Session = None):
        """Send SMS message via Twilio"""
        try:
            message = self.client.messages.create(
                body=message_content,
                from_=self.from_number,
                to=to_number
            )
            
            # Update database record if provided
            if db_message and db:
                db_message.provider_message_id = message.sid
                db_message.status = MessageStatus.SENT
                db_message.sent_at = datetime.now()
                db.commit()
                db.refresh(db_message)
            
            logger.info(f"Message sent successfully to {to_number}, SID: {message.sid}")
            return message.sid
            
        except TwilioRestException as e:
            logger.error(f"Failed to send message to {to_number}: {str(e)}")
            
            # Update database record if provided (simplified failure handling)
            if db_message and db:
                db_message.status = MessageStatus.FAILED
                db.commit()
                db.refresh(db_message)
            
            return None
    
    def process_message(self, message, db):
        """Process a message from the database"""
        # Check if patient has consent
        if not message.patient.consent_sms:
            message.status = MessageStatus.FAILED
            db.commit()
            logger.info(f"Message {message.id} not sent - no consent")
            return
        
        # Check DND hours
        if self.is_dnd_hours():
            logger.info(f"Message {message.id} not sent - within DND hours")
            return
        
        # Send the message
        message_sid = self.send_sms(message.patient.phone_number, message.content, message, db)
        
        if message_sid:
            logger.info(f"Message {message.id} sent successfully")
        else:
            logger.info(f"Message {message.id} failed to send")
    
    def process_pending_messages(self, db):
        """Process all pending messages that are due to be sent"""
        pending_messages = db.query(Message).filter(
            (Message.status == MessageStatus.PENDING) & 
            ((Message.scheduled_for == None) | (Message.scheduled_for <= datetime.now()))
        ).all()
        
        for message in pending_messages:
            self.process_message(message, db)
        
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