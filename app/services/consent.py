import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import Patient, AuditLog

logger = logging.getLogger(__name__)

class ConsentService:
    def process_opt_out(self, db: Session, phone_number: str) -> bool:
        """Process opt-out request from a patient"""
        try:
            # Find patient by phone number
            patient = db.query(Patient).filter(Patient.phone_number == phone_number).first()
            
            if not patient:
                logger.warning(f"Opt-out request from unknown number: {phone_number}")
                return False
            
            # Update consent status
            patient.consent_sms = False
            patient.consent_date = datetime.now()
            patient.consent_source = "sms_opt_out"
            db.commit()
            
            # Log audit
            self._log_audit(db, "opt_out", "patient", patient.id, {
                "phone_number": phone_number,
                "method": "sms"
            })
            
            logger.info(f"Patient {patient.id} opted out of SMS messages")
            return True
            
        except Exception as e:
            logger.error(f"Error processing opt-out for {phone_number}: {str(e)}")
            db.rollback()
            return False
    
    def process_opt_in(self, db: Session, phone_number: str) -> bool:
        """Process opt-in request from a patient"""
        try:
            # Find patient by phone number
            patient = db.query(Patient).filter(Patient.phone_number == phone_number).first()
            
            if not patient:
                logger.warning(f"Opt-in request from unknown number: {phone_number}")
                return False
            
            # Update consent status
            patient.consent_sms = True
            patient.consent_date = datetime.now()
            patient.consent_source = "sms_opt_in"
            db.commit()
            
            # Log audit
            self._log_audit(db, "opt_in", "patient", patient.id, {
                "phone_number": phone_number,
                "method": "sms"
            })
            
            logger.info(f"Patient {patient.id} opted in to SMS messages")
            return True
            
        except Exception as e:
            logger.error(f"Error processing opt-in for {phone_number}: {str(e)}")
            db.rollback()
            return False
    
    def _log_audit(self, db: Session, action: str, entity_type: str, entity_id: int, details: dict):
        """Log an audit event"""
        try:
            import json
            audit_log = AuditLog(
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=json.dumps(details)
            )
            db.add(audit_log)
            db.commit()
        except Exception as e:
            logger.error(f"Error logging audit: {str(e)}")

# Create singleton instance
consent_service = ConsentService()

