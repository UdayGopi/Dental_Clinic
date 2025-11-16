"""
Migration script to add doctor_name and appointment_type columns to appointments table
Run this once to add the new columns to your existing database
"""
from sqlalchemy import text
from app.database import engine
import logging

logger = logging.getLogger(__name__)

def migrate_appointments():
    """Add doctor_name and appointment_type columns to appointments table"""
    try:
        with engine.connect() as conn:
            # Check if columns already exist
            if engine.url.drivername == 'sqlite':
                # SQLite: Check if columns exist
                result = conn.execute(text("PRAGMA table_info(appointments)"))
                columns = [row[1] for row in result]
                
                # Add doctor_name column if it doesn't exist
                if 'doctor_name' not in columns:
                    logger.info("Adding doctor_name column to appointments table...")
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN doctor_name VARCHAR(100)"))
                    conn.commit()
                    logger.info("✓ doctor_name column added successfully")
                else:
                    logger.info("doctor_name column already exists")
                
                # Add appointment_type column if it doesn't exist
                if 'appointment_type' not in columns:
                    logger.info("Adding appointment_type column to appointments table...")
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN appointment_type VARCHAR(100)"))
                    conn.commit()
                    logger.info("✓ appointment_type column added successfully")
                else:
                    logger.info("appointment_type column already exists")
                    
            else:
                # PostgreSQL/MySQL: Check if columns exist
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'appointments' 
                    AND column_name IN ('doctor_name', 'appointment_type')
                """))
                existing_columns = [row[0] for row in result]
                
                # Add doctor_name column if it doesn't exist
                if 'doctor_name' not in existing_columns:
                    logger.info("Adding doctor_name column to appointments table...")
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN doctor_name VARCHAR(100)"))
                    conn.commit()
                    logger.info("✓ doctor_name column added successfully")
                else:
                    logger.info("doctor_name column already exists")
                
                # Add appointment_type column if it doesn't exist
                if 'appointment_type' not in existing_columns:
                    logger.info("Adding appointment_type column to appointments table...")
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN appointment_type VARCHAR(100)"))
                    conn.commit()
                    logger.info("✓ appointment_type column added successfully")
                else:
                    logger.info("appointment_type column already exists")
        
        print("\n" + "="*50)
        print("Migration completed successfully!")
        print("="*50)
        print("\nYou can now use doctor_name and appointment_type in appointments.")
        print("Restart the server to apply changes.\n")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        print(f"\n❌ Error: {str(e)}")
        print("\nIf columns already exist, this is normal. The server should work now.")
        raise

if __name__ == "__main__":
    print("="*50)
    print("Appointments Table Migration")
    print("Adding doctor_name and appointment_type columns")
    print("="*50)
    print()
    migrate_appointments()

