import os
from dotenv import load_dotenv

# Load environment variables from .env file
# Use override=True to reload .env file if it changes
load_dotenv(override=True)

# Simple configuration class
class Config:
    # Database Configuration
    # For production with 1M+ users, use PostgreSQL:
    # DATABASE_URL=postgresql://user:password@localhost:5432/dental_clinic
    # For development, SQLite is fine:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dental_messaging.db")
    
    # Database Pool Settings (for PostgreSQL)
    DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "20"))
    DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "40"))
    DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    
    # Twilio SMS/WhatsApp Configuration
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
    TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "")  # WhatsApp-enabled number (format: whatsapp:+1234567890)
    
    # Message Channel Configuration
    MESSAGE_CHANNEL = os.getenv("MESSAGE_CHANNEL", "sms").lower()  # "sms" or "whatsapp" or "both"
    
    # Redis Configuration (for caching and Celery)
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_CACHE_TTL = int(os.getenv("REDIS_CACHE_TTL", "300"))  # 5 minutes default
    
    # Celery Configuration (for background tasks)
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
    
    # Application settings
    DND_START_HOUR = int(os.getenv("DND_START_HOUR", "21"))  # 9 PM
    DND_END_HOUR = int(os.getenv("DND_END_HOUR", "8"))  # 8 AM
    DND_ENABLED = os.getenv("DND_ENABLED", "false").lower() == "true"  # Disable DND by default
    
    # Reminder timing settings
    REMINDER_DAYS_BEFORE = int(os.getenv("REMINDER_DAYS_BEFORE", "3"))  # Send first reminder 3 days before
    REMINDER_DAY_BEFORE = 1  # Send reminder 1 day before
    REMINDER_HOURS_BEFORE = int(os.getenv("REMINDER_HOURS_BEFORE", "3"))  # Send final reminder 3 hours before
    
    # Pagination settings
    DEFAULT_PAGE_SIZE = int(os.getenv("DEFAULT_PAGE_SIZE", "50"))
    MAX_PAGE_SIZE = int(os.getenv("MAX_PAGE_SIZE", "1000"))
    
    # Rate limiting
    RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    # Performance settings
    ENABLE_CACHING = os.getenv("ENABLE_CACHING", "true").lower() == "true"
    QUERY_TIMEOUT = int(os.getenv("QUERY_TIMEOUT", "30"))  # seconds

# Create config instance
config = Config()