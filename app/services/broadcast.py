import logging
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Optional

from app.models import Broadcast, Patient, Message, MessageTemplate, MessageType, MessageStatus, AuditLog
from app.services.messaging import MessagingService

logger = logging.getLogger(__name__)

class BroadcastService:
    def __init__(self):
        self.messaging_service = MessagingService()
        self.max_retries = 3
        self.batch_size = 50  # Send messages in batches to respect rate limits
    
    def create_broadcast(
        self,
        db: Session,
        name: str,
        template_id: int,
        filter_criteria: Dict,
        scheduled_at: Optional[datetime] = None
    ) -> Optional[Broadcast]:
        """Create a new broadcast campaign"""
        try:
            # Validate template exists
            template = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
            if not template:
                logger.error(f"Template {template_id} not found")
                return None
            
            # Create broadcast
            broadcast = Broadcast(
                name=name,
                template_id=template_id,
                filter_criteria=json.dumps(filter_criteria),
                scheduled_at=scheduled_at or datetime.now(),
                status="pending"
            )
            db.add(broadcast)
            db.commit()
            db.refresh(broadcast)
            
            # Log audit
            self._log_audit(db, "broadcast_created", "broadcast", broadcast.id, {"name": name})
            
            logger.info(f"Broadcast {broadcast.id} created: {name}")
            return broadcast
            
        except Exception as e:
            logger.error(f"Error creating broadcast: {str(e)}")
            db.rollback()
            return None
    
    def process_broadcast(self, broadcast_id: int, db: Session = None):
        """Process a broadcast campaign by sending messages to all matching patients"""
        if db is None:
            from app.database import SessionLocal
            db = SessionLocal()
            should_close = True
        else:
            should_close = False
        
        try:
            broadcast = db.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
            if not broadcast:
                logger.error(f"Broadcast {broadcast_id} not found")
                return
            
            if broadcast.status != "pending":
                logger.warning(f"Broadcast {broadcast_id} is not in pending status")
                return
            
            # Update status to processing
            broadcast.status = "processing"
            db.commit()
            
            # Get template
            template = db.query(MessageTemplate).filter(MessageTemplate.id == broadcast.template_id).first()
            if not template:
                logger.error(f"Template {broadcast.template_id} not found")
                broadcast.status = "failed"
                db.commit()
                return
            
            # Parse filter criteria
            filter_criteria = json.loads(broadcast.filter_criteria) if broadcast.filter_criteria else {}
            
            # Get matching patients
            patients = self._get_filtered_patients(db, filter_criteria)
            broadcast.total_recipients = len(patients)
            db.commit()
            
            logger.info(f"Processing broadcast {broadcast_id} for {len(patients)} patients")
            
            # Send messages in batches
            sent_count = 0
            failed_count = 0
            
            for i in range(0, len(patients), self.batch_size):
                batch = patients[i:i + self.batch_size]
                
                for patient in batch:
                    if not patient.consent_sms:
                        failed_count += 1
                        continue
                    
                    # Create context for template
                    context = {
                        "patient_first_name": patient.first_name,
                        "patient_last_name": patient.last_name,
                        "patient_phone": patient.phone_number
                    }
                    
                    # Render message content
                    message_content = self.messaging_service.render_template(template.content, context)
                    
                    # Create message
                    message = Message(
                        patient_id=patient.id,
                        template_id=template.id,
                        broadcast_id=broadcast.id,
                        message_type=MessageType.BROADCAST,
                        content=message_content,
                        status=MessageStatus.PENDING,
                        scheduled_for=broadcast.scheduled_at
                    )
                    db.add(message)
                
                db.commit()
                
                # Process messages in this batch
                for patient in batch:
                    if patient.consent_sms:
                        # Refresh patient data to ensure we have latest
                        db.refresh(patient)
                        
                        # Log patient details for verification
                        logger.debug(f"Broadcast {broadcast_id}: Processing message for patient {patient.id} - {patient.first_name} {patient.last_name}, Phone: {patient.phone_number}")
                        
                        message = db.query(Message).filter(
                            Message.patient_id == patient.id,  # Explicit patient ID match
                            Message.broadcast_id == broadcast.id,
                            Message.status == MessageStatus.PENDING
                        ).first()
                        
                        if message:
                            try:
                                # Process message - it will use patient's own details
                                self.messaging_service.process_message(message.id, None, db)
                                # Refresh message to get updated status
                                db.refresh(message)
                                if message.status == MessageStatus.SENT:
                                    sent_count += 1
                                    logger.info(f"Broadcast {broadcast_id}: Message sent to patient {patient.id} ({patient.first_name} {patient.last_name})")
                                else:
                                    failed_count += 1
                                    logger.warning(f"Broadcast {broadcast_id}: Message failed for patient {patient.id} ({patient.first_name} {patient.last_name})")
                            except Exception as e:
                                logger.error(f"Error processing message for patient {patient.id} ({patient.first_name} {patient.last_name}): {str(e)}")
                                failed_count += 1
                
                # Small delay between batches to respect rate limits
                import time
                time.sleep(1)
            
            # Update broadcast status
            broadcast.sent_count = sent_count
            broadcast.failed_count = failed_count
            broadcast.status = "completed"
            broadcast.completed_at = datetime.now()
            db.commit()
            
            logger.info(f"Broadcast {broadcast_id} completed: {sent_count} sent, {failed_count} failed")
            
        except Exception as e:
            logger.error(f"Error processing broadcast {broadcast_id}: {str(e)}")
            if broadcast:
                broadcast.status = "failed"
                db.commit()
        finally:
            if should_close:
                db.close()
    
    def _get_filtered_patients(self, db: Session, filter_criteria: Dict):
        """Get patients matching the filter criteria"""
        query = db.query(Patient)
        
        # Filter by consent
        if filter_criteria.get("only_opted_in", False):
            query = query.filter(Patient.consent_sms == True)
        
        # Filter by last visit date
        if filter_criteria.get("last_visit_after"):
            from app.models import Appointment
            last_visit_date = datetime.fromisoformat(filter_criteria["last_visit_after"])
            subquery = db.query(Appointment.patient_id).filter(
                Appointment.status == "completed",
                Appointment.appointment_date >= last_visit_date
            ).subquery()
            query = query.filter(Patient.id.in_(subquery))
        
        # Filter by last visit before (for inactive patients)
        if filter_criteria.get("last_visit_before"):
            from app.models import Appointment
            last_visit_date = datetime.fromisoformat(filter_criteria["last_visit_before"])
            subquery = db.query(Appointment.patient_id).filter(
                Appointment.status == "completed",
                Appointment.appointment_date <= last_visit_date
            ).subquery()
            query = query.filter(Patient.id.in_(subquery))
        
        return query.all()
    
    def _log_audit(self, db: Session, action: str, entity_type: str, entity_id: int, details: Dict):
        """Log an audit event"""
        try:
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
broadcast_service = BroadcastService()

