"""Default message templates for different reminder stages"""

from app.models import MessageTemplate, MessageType, ReminderStage

DEFAULT_TEMPLATES = [
    {
        "name": "Appointment Reminder - Days Before",
        "message_type": MessageType.APPOINTMENT_REMINDER,
        "reminder_stage": ReminderStage.DAYS_BEFORE,
        "content": "Hi {{patient_first_name}}, this is a reminder about your dental appointment:\n📅 Date: {{appointment_date}}\n🕐 Time: {{appointment_time}}\n👨‍⚕️ Doctor: {{doctor_name}}\n🦷 Type: {{appointment_type}}\n\nPlease let us know if you need to reschedule.",
        "is_active": True
    },
    {
        "name": "Appointment Reminder - Day Before",
        "message_type": MessageType.APPOINTMENT_REMINDER,
        "reminder_stage": ReminderStage.DAY_BEFORE,
        "content": "Hi {{patient_first_name}}, just a reminder that your dental appointment is tomorrow:\n🕐 Time: {{appointment_time}}\n👨‍⚕️ Doctor: {{doctor_name}}\n🦷 Type: {{appointment_type}}\n\nSee you then!",
        "is_active": True
    },
    {
        "name": "Appointment Reminder - Hours Before",
        "message_type": MessageType.APPOINTMENT_REMINDER,
        "reminder_stage": ReminderStage.HOURS_BEFORE,
        "content": "Hi {{patient_first_name}}, your dental appointment is in a few hours:\n🕐 Time: {{appointment_time}}\n👨‍⚕️ Doctor: {{doctor_name}}\n🦷 Type: {{appointment_type}}\n\nWe look forward to seeing you soon!",
        "is_active": True
    },
    {
        "name": "Post Visit Thank You",
        "message_type": MessageType.POST_VISIT,
        "reminder_stage": None,
        "content": "Hi {{patient_first_name}}, thank you for visiting our dental clinic on {{appointment_date}}. We hope you had a great experience! If you have any questions, please call us.",
        "is_active": True
    },
    {
        "name": "Recall Reminder",
        "message_type": MessageType.RECALL,
        "reminder_stage": None,
        "content": "Hi {{patient_first_name}}, it's been a while since your last visit on {{last_appointment_date}}. Please call us to schedule your next appointment. We'd love to see you again!",
        "is_active": True
    },
    {
        "name": "Appointment Details Confirmation",
        "message_type": MessageType.BROADCAST,
        "reminder_stage": None,
        "content": "Hi {{patient_first_name}}, your appointment is confirmed:\n📅 Date: {{appointment_date}}\n🕐 Time: {{appointment_time}}\n👨‍⚕️ Doctor: {{doctor_name}}\n🦷 Type: {{appointment_type}}\n\nWe look forward to seeing you! If you need to reschedule, please contact us.",
        "is_active": True
    }
]

def create_default_templates(db):
    """Create default templates if they don't exist"""
    import logging
    logger = logging.getLogger(__name__)
    
    for template_data in DEFAULT_TEMPLATES:
        try:
            # Check if template already exists by name (name is unique)
            existing = db.query(MessageTemplate).filter(
                MessageTemplate.name == template_data["name"]
            ).first()
            
            if existing:
                logger.debug(f"Template '{template_data['name']}' already exists, skipping")
                continue
            
            # If not exists, create new template
            template = MessageTemplate(**template_data)
            db.add(template)
            logger.debug(f"Created default template: '{template_data['name']}'")
            
        except Exception as e:
            # Handle any errors gracefully (e.g., IntegrityError)
            logger.warning(f"Error creating template '{template_data.get('name', 'unknown')}': {str(e)}")
            db.rollback()
            continue
    
    try:
        db.commit()
        logger.info("Default templates check completed")
    except Exception as e:
        logger.error(f"Error committing default templates: {str(e)}")
        db.rollback()