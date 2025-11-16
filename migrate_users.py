"""
Migration script to add User table to existing database
Run this once to add the users table to your existing database
"""
from app.database import engine, Base
from app.models import User

# Import all models to ensure they're registered
from app.models import Patient, Appointment, Message, MessageTemplate, Broadcast, AuditLog

if __name__ == "__main__":
    print("Creating User table...")
    # Create only the users table if it doesn't exist
    User.__table__.create(bind=engine, checkfirst=True)
    print("User table created successfully!")
    print("\nYou can now register new users and they will appear in Admin Management page.")

