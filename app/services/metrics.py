import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, Dict

from app.models import (
    Message, MessageStatus, Patient, Appointment, 
    Broadcast, MessageType
)

logger = logging.getLogger(__name__)

class MetricsService:
    def get_broadcast_stats(self, db: Session, broadcast_id: Optional[int] = None) -> Dict:
        """Get broadcast statistics"""
        try:
            if broadcast_id:
                broadcast = db.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
                if not broadcast:
                    return None
                
                messages = db.query(Message).filter(Message.broadcast_id == broadcast_id).all()
                
                return {
                    "broadcast_id": broadcast.id,
                    "name": broadcast.name,
                    "status": broadcast.status,
                    "total_recipients": broadcast.total_recipients,
                    "sent_count": broadcast.sent_count,
                    "failed_count": broadcast.failed_count,
                    "delivered_count": len([m for m in messages if m.status == MessageStatus.DELIVERED]),
                    "created_at": broadcast.created_at.isoformat() if broadcast.created_at else None,
                    "completed_at": broadcast.completed_at.isoformat() if broadcast.completed_at else None
                }
            else:
                # Get all broadcasts
                broadcasts = db.query(Broadcast).all()
                return {
                    "broadcasts": [
                        {
                            "id": b.id,
                            "name": b.name,
                            "status": b.status,
                            "total_recipients": b.total_recipients,
                            "sent_count": b.sent_count,
                            "failed_count": b.failed_count,
                            "created_at": b.created_at.isoformat() if b.created_at else None
                        }
                        for b in broadcasts
                    ]
                }
        except Exception as e:
            logger.error(f"Error getting broadcast stats: {str(e)}")
            return {}
    
    def get_opt_out_rate(self, db: Session) -> float:
        """Calculate opt-out rate"""
        try:
            total_patients = db.query(Patient).count()
            if total_patients == 0:
                return 0.0
            
            opted_out = db.query(Patient).filter(Patient.consent_sms == False).count()
            return (opted_out / total_patients) * 100.0
        except Exception as e:
            logger.error(f"Error calculating opt-out rate: {str(e)}")
            return 0.0
    
    def get_recall_effectiveness(self, db: Session, days_window: int = 30) -> Dict:
        """Calculate recall reminder effectiveness"""
        try:
            # Get recall messages sent in the last days_window days
            cutoff_date = datetime.now() - timedelta(days=days_window)
            
            recall_messages = db.query(Message).filter(
                Message.message_type == MessageType.RECALL,
                Message.created_at >= cutoff_date,
                Message.status == MessageStatus.SENT
            ).all()
            
            total_recalls = len(recall_messages)
            
            if total_recalls == 0:
                return {
                    "total_recalls": 0,
                    "appointments_booked": 0,
                    "effectiveness_rate": 0.0
                }
            
            # Check how many led to appointments within days_window
            appointments_booked = 0
            for message in recall_messages:
                # Check if patient booked an appointment after the recall
                appointment = db.query(Appointment).filter(
                    Appointment.patient_id == message.patient_id,
                    Appointment.created_at >= message.sent_at or message.created_at,
                    Appointment.status.in_(["scheduled", "completed"])
                ).first()
                
                if appointment:
                    appointments_booked += 1
            
            effectiveness_rate = (appointments_booked / total_recalls) * 100.0 if total_recalls > 0 else 0.0
            
            return {
                "total_recalls": total_recalls,
                "appointments_booked": appointments_booked,
                "effectiveness_rate": effectiveness_rate,
                "days_window": days_window
            }
        except Exception as e:
            logger.error(f"Error calculating recall effectiveness: {str(e)}")
            return {
                "total_recalls": 0,
                "appointments_booked": 0,
                "effectiveness_rate": 0.0
            }
    
    def get_message_metrics(
        self,
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """Get comprehensive message metrics"""
        try:
            query = db.query(Message)
            
            if start_date:
                query = query.filter(Message.created_at >= start_date)
            if end_date:
                query = query.filter(Message.created_at <= end_date)
            
            total = query.count()
            sent = query.filter(Message.status == MessageStatus.SENT).count()
            delivered = query.filter(Message.status == MessageStatus.DELIVERED).count()
            failed = query.filter(Message.status == MessageStatus.FAILED).count()
            pending = query.filter(Message.status == MessageStatus.PENDING).count()
            
            # Calculate average time from appointment completion to post-visit SMS
            post_visit_messages = query.filter(
                Message.message_type == MessageType.POST_VISIT,
                Message.status == MessageStatus.SENT
            ).all()
            
            avg_time_to_send = None
            if post_visit_messages:
                times = []
                for msg in post_visit_messages:
                    if msg.appointment and msg.sent_at:
                        time_diff = (msg.sent_at - msg.appointment.appointment_date).total_seconds() / 60  # minutes
                        times.append(time_diff)
                
                if times:
                    avg_time_to_send = sum(times) / len(times)
            
            return {
                "total": total,
                "pending": pending,
                "sent": sent,
                "delivered": delivered,
                "failed": failed,
                "delivery_rate": (delivered / sent * 100.0) if sent > 0 else 0.0,
                "failure_rate": (failed / total * 100.0) if total > 0 else 0.0,
                "avg_time_to_send_minutes": avg_time_to_send
            }
        except Exception as e:
            logger.error(f"Error getting message metrics: {str(e)}")
            return {
                "total": 0,
                "pending": 0,
                "sent": 0,
                "delivered": 0,
                "failed": 0
            }

# Create singleton instance
metrics_service = MetricsService()

