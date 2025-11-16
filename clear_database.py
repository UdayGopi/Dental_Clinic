"""
Script to clear all data from the database
This will delete all appointments, patients, messages, users, and other data
USE WITH CAUTION - This cannot be undone!
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import (
    Patient, Appointment, Message, MessageTemplate, Broadcast, 
    AuditLog, User
)
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clear_all_data():
    """Clear all data from database tables"""
    db = SessionLocal()
    try:
        logger.warning("=" * 60)
        logger.warning("WARNING: This will delete ALL data from the database!")
        logger.warning("=" * 60)
        
        # Get counts before deletion
        patient_count = db.query(Patient).count()
        appointment_count = db.query(Appointment).count()
        message_count = db.query(Message).count()
        user_count = db.query(User).count()
        broadcast_count = db.query(Broadcast).count()
        audit_log_count = db.query(AuditLog).count()
        
        logger.info(f"Current data counts:")
        logger.info(f"  Patients: {patient_count}")
        logger.info(f"  Appointments: {appointment_count}")
        logger.info(f"  Messages: {message_count}")
        logger.info(f"  Users: {user_count}")
        logger.info(f"  Broadcasts: {broadcast_count}")
        logger.info(f"  Audit Logs: {audit_log_count}")
        logger.info("")
        
        # Delete in correct order (respecting foreign keys)
        logger.info("Deleting data...")
        
        # Delete messages first (has foreign keys)
        deleted_messages = db.query(Message).delete()
        logger.info(f"Deleted {deleted_messages} messages")
        
        # Delete appointments
        deleted_appointments = db.query(Appointment).delete()
        logger.info(f"Deleted {deleted_appointments} appointments")
        
        # Delete broadcasts
        deleted_broadcasts = db.query(Broadcast).delete()
        logger.info(f"Deleted {deleted_broadcasts} broadcasts")
        
        # Delete patients
        deleted_patients = db.query(Patient).delete()
        logger.info(f"Deleted {deleted_patients} patients")
        
        # Delete users (except keep message templates)
        deleted_users = db.query(User).delete()
        logger.info(f"Deleted {deleted_users} users")
        
        # Delete audit logs
        deleted_audit_logs = db.query(AuditLog).delete()
        logger.info(f"Deleted {deleted_audit_logs} audit logs")
        
        # Commit all deletions
        db.commit()
        
        logger.info("")
        logger.info("=" * 60)
        logger.info("SUCCESS: All data cleared!")
        logger.info("=" * 60)
        logger.info("Note: Message templates are preserved.")
        logger.info("You can now start fresh with new patients and appointments.")
        
    except Exception as e:
        logger.error(f"Error clearing database: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def clear_appointments_only():
    """Clear only appointments (keep patients and other data)"""
    db = SessionLocal()
    try:
        # Delete messages related to appointments
        deleted_messages = db.query(Message).filter(Message.appointment_id != None).delete()
        logger.info(f"Deleted {deleted_messages} appointment-related messages")
        
        # Delete appointments
        deleted_appointments = db.query(Appointment).delete()
        logger.info(f"Deleted {deleted_appointments} appointments")
        
        db.commit()
        logger.info("Appointments cleared successfully!")
        
    except Exception as e:
        logger.error(f"Error clearing appointments: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def clear_patients_only():
    """Clear only patients and their related data"""
    db = SessionLocal()
    try:
        # Delete messages
        deleted_messages = db.query(Message).delete()
        logger.info(f"Deleted {deleted_messages} messages")
        
        # Delete appointments
        deleted_appointments = db.query(Appointment).delete()
        logger.info(f"Deleted {deleted_appointments} appointments")
        
        # Delete patients
        deleted_patients = db.query(Patient).delete()
        logger.info(f"Deleted {deleted_patients} patients")
        
        db.commit()
        logger.info("Patients and related data cleared successfully!")
        
    except Exception as e:
        logger.error(f"Error clearing patients: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Clear database data")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Clear ALL data (patients, appointments, messages, users, etc.)"
    )
    parser.add_argument(
        "--appointments",
        action="store_true",
        help="Clear only appointments (keep patients)"
    )
    parser.add_argument(
        "--patients",
        action="store_true",
        help="Clear patients and related data (keep users and templates)"
    )
    
    args = parser.parse_args()
    
    if args.all:
        clear_all_data()
    elif args.appointments:
        clear_appointments_only()
    elif args.patients:
        clear_patients_only()
    else:
        # Default: clear all
        print("No option specified. Clearing ALL data...")
        print("Use --help for options")
        clear_all_data()

