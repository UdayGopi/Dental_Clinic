import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Simple configuration class
class Config:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dental_messaging.db")
    
    # Twilio
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Application settings
    DND_START_HOUR = int(os.getenv("DND_START_HOUR", "21"))  # 9 PM
    DND_END_HOUR = int(os.getenv("DND_END_HOUR", "8"))  # 8 AM
    
    # Reminder timing settings
    REMINDER_DAYS_BEFORE = int(os.getenv("REMINDER_DAYS_BEFORE", "3"))  # Send first reminder 3 days before
    REMINDER_DAY_BEFORE = 1  # Send reminder 1 day before
    REMINDER_HOURS_BEFORE = int(os.getenv("REMINDER_HOURS_BEFORE", "3"))  # Send final reminder 3 hours before

# Create config instance
config = Config()