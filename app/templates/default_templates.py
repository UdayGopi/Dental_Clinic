"""Default message templates for different reminder stages"""

from app.models import MessageTemplate, MessageType, ReminderStage

DEFAULT_TEMPLATES = [
    {
        "name": "Appointment Reminder - Days Before",
        "message_type": MessageType.APPOINTMENT_REMINDER,
        "reminder_stage": ReminderStage.DAYS_BEFORE,
        "content": "Hi {patient_first_name}, this is a reminder about your dental appointment on {appointment_date} at {appointment_time}. Please let us know if you need to reschedule."
    },
    {
        "name": "Appointment Reminder - Day Before",
        "message_type": MessageType.APPOINTMENT_REMINDER,
        "reminder_stage": ReminderStage.DAY_BEFORE,
        "content": "Hi {patient_first_name}, just a reminder that your dental appointment is tomorrow at {appointment_time}. See you then!"
    },
    {
        "name": "Appointment Reminder - Hours Before",
        "message_type": MessageType.APPOINTMENT_REMINDER,
        "reminder_stage": ReminderStage.HOURS_BEFORE,
        "content": "Hi {patient_first_name}, your dental appointment is in a few hours at {appointment_time}. We look forward to seeing you soon!"
    }
]

def create_default_templates(db):
    """Create default templates if they don't exist"""
    for template_data in DEFAULT_TEMPLATES:
        # Check if template already exists
        existing = db.query(MessageTemplate).filter(
            MessageTemplate.message_type == template_data["message_type"],
            MessageTemplate.reminder_stage == template_data["reminder_stage"]
        ).first()
        
        if not existing:
            template = MessageTemplate(**template_data)
            db.add(template)
    
    db.commit()