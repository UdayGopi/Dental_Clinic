from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
from pydantic import BaseModel

from app.database import get_db
from app.models import Patient, Appointment, Message, MessageTemplate, MessageType, MessageStatus
from app.services.messaging import MessagingService
from app.scheduler import AppointmentScheduler

# Create Pydantic models for request/response
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    email: Optional[str] = None
    consent_sms: bool = False

class PatientResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone_number: str
    email: Optional[str] = None
    consent_sms: bool

class AppointmentCreate(BaseModel):
    patient_id: int
    appointment_date: datetime
    followup_required: bool = True
    followup_interval_days: int = 180
    status: str = "scheduled"

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    appointment_date: datetime
    status: str

class TemplateCreate(BaseModel):
    name: str
    message_type: str
    content: str

class TemplateResponse(BaseModel):
    id: int
    name: str
    message_type: str
    content: str

class MessageSend(BaseModel):
    patient_id: int
    template_id: int
    custom_variables: Optional[dict] = None

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    status: Optional[str] = None
    followup_required: Optional[bool] = None
    followup_interval_days: Optional[int] = None

# Create router
router = APIRouter()

# Initialize messaging service
messaging_service = MessagingService()
scheduler = AppointmentScheduler()

# Patient endpoints
@router.post("/patients/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient"""
    try:
        db_patient = Patient(**patient.dict())
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        return db_patient
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/patients/", response_model=List[PatientResponse])
def get_patients(db: Session = Depends(get_db)):
    """Get all patients"""
    return db.query(Patient).all()

@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get a patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Appointment endpoints
@router.post("/appointments/", response_model=AppointmentResponse)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    """Create a new appointment"""
    # Get patient
    patient = db.query(Patient).filter(Patient.id == appointment.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create appointment
    db_appointment = Appointment(
        patient_id=appointment.patient_id,
        appointment_date=appointment.appointment_date,
        status="scheduled",
        followup_required=appointment.followup_required,
        followup_interval_days=appointment.followup_interval_days
    )
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    # Create staged reminders for the appointment
    scheduler.create_appointment_reminders(db_appointment, db)
    
    return db_appointment

@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment: AppointmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an appointment"""
    # Get existing appointment
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Update appointment fields
    for field, value in appointment.dict(exclude_unset=True).items():
        setattr(db_appointment, field, value)
    
    # If appointment date changed, delete existing reminders and create new ones
    if appointment.appointment_date and appointment.appointment_date != db_appointment.appointment_date:
        # Delete existing reminders
        db.query(Message).filter(
            Message.appointment_id == appointment_id,
            Message.message_type == MessageType.APPOINTMENT_REMINDER,
            Message.status == MessageStatus.PENDING
        ).delete()
        
        # Create new reminders
        scheduler.create_appointment_reminders(db_appointment, db)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.get("/appointments/", response_model=List[AppointmentResponse])
def get_appointments(patient_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all appointments, optionally filtered by patient_id"""
    query = db.query(Appointment)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    return query.all()

@router.put("/appointments/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int, 
    status_data: dict, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Update appointment status and trigger post-visit message if completed"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = status_data.get("status")
    db.commit()
    
    # If appointment is completed, send post-visit message
    if appointment.status == "completed" and appointment.followup_required:
        patient = db.query(Patient).filter(Patient.id == appointment.patient_id).first()
        template = db.query(MessageTemplate).filter(MessageTemplate.message_type == "post_visit").first()
        
        if patient and patient.consent_sms and template:
            # Create message
            message = Message(
                patient_id=patient.id,
                template_id=template.id,
                message_type=MessageType.post_visit,
                status=MessageStatus.pending,
                scheduled_time=datetime.now()
            )
            db.add(message)
            db.commit()
            
            # Process message in background
            background_tasks.add_task(
                messaging_service.process_message,
                message.id,
                {
                    "patient_first_name": patient.first_name,
                    "appointment_date": appointment.appointment_date.strftime("%B %d, %Y")
                }
            )
    
    return appointment

# Message template endpoints
@router.post("/templates/", response_model=dict)
def create_template(template_data: dict, db: Session = Depends(get_db)):
    """Create a new message template"""
    try:
        template = MessageTemplate(**template_data)
        db.add(template)
        db.commit()
        db.refresh(template)
        return {"success": True, "template_id": template.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/templates/", response_model=List[dict])
def get_templates(db: Session = Depends(get_db)):
    """Get all message templates"""
    templates = db.query(MessageTemplate).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "message_type": t.message_type,
            "template_content": t.template_content,
            "is_active": t.is_active
        }
        for t in templates
    ]

# Broadcast endpoints
@router.post("/broadcasts/", response_model=dict)
def create_broadcast(broadcast_data: dict, db: Session = Depends(get_db)):
    """Create a new broadcast campaign"""
    try:
        # Parse scheduled_at
        scheduled_at = datetime.fromisoformat(broadcast_data.get("scheduled_at"))
        
        broadcast = broadcast_service.create_broadcast(
            db,
            broadcast_data.get("name"),
            broadcast_data.get("template_id"),
            broadcast_data.get("filter_criteria", {}),
            scheduled_at
        )
        
        if not broadcast:
            raise HTTPException(status_code=400, detail="Failed to create broadcast")
        
        return {"success": True, "broadcast_id": broadcast.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/broadcasts/", response_model=dict)
def get_broadcasts(db: Session = Depends(get_db)):
    """Get all broadcasts"""
    return metrics_service.get_broadcast_stats(db)

@router.get("/broadcasts/{broadcast_id}", response_model=dict)
def get_broadcast(broadcast_id: int, db: Session = Depends(get_db)):
    """Get broadcast details"""
    stats = metrics_service.get_broadcast_stats(db, broadcast_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    return stats

# Webhook endpoints
@router.post("/webhooks/twilio", response_model=dict)
def twilio_webhook(webhook_data: dict, db: Session = Depends(get_db)):
    """Handle Twilio webhook for delivery status and replies"""
    # Extract data from webhook
    message_sid = webhook_data.get("MessageSid")
    message_status = webhook_data.get("MessageStatus")
    from_number = webhook_data.get("From")
    body = webhook_data.get("Body", "").strip().upper()
    
    # Update message status if we have the SID
    if message_sid:
        message = db.query(Message).filter(Message.provider_message_id == message_sid).first()
        if message:
            if message_status == "delivered":
                message.status = MessageStatus.DELIVERED
                message.delivered_at = datetime.now()
            elif message_status in ["failed", "undelivered"]:
                message.status = MessageStatus.FAILED
                message.error_message = webhook_data.get("ErrorMessage")
            
            db.commit()
    
    # Handle opt-out/opt-in keywords
    if from_number and body:
        if body in ["STOP", "UNSUBSCRIBE", "CANCEL"]:
            consent_service.process_opt_out(db, from_number)
            return {"success": True, "action": "opt_out"}
        elif body in ["START", "SUBSCRIBE", "YES"]:
            consent_service.process_opt_in(db, from_number)
            return {"success": True, "action": "opt_in"}
    
    return {"success": True}

# Metrics endpoints
@router.get("/metrics/messages", response_model=dict)
def get_message_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get message metrics for a date range"""
    query = db.query(Message)
    
    if start_date:
        query = query.filter(Message.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Message.created_at <= datetime.fromisoformat(end_date))
    
    total = query.count()
    sent = query.filter(Message.status == MessageStatus.SENT).count()
    delivered = query.filter(Message.status == MessageStatus.DELIVERED).count()
    failed = query.filter(Message.status == MessageStatus.FAILED).count()
    pending = query.filter(Message.status == MessageStatus.PENDING).count()
    
    return {
        "total": total,
        "pending": pending,
        "sent": sent,
        "delivered": delivered,
        "failed": failed
    }

@router.get("/metrics/opt-out-rate", response_model=dict)
def get_opt_out_rate(db: Session = Depends(get_db)):
    """Get current opt-out rate"""
    rate = metrics_service.get_opt_out_rate(db)
    return {"opt_out_rate": rate}

@router.get("/metrics/recall-effectiveness", response_model=dict)
def get_recall_effectiveness(
    days_window: Optional[int] = 30,
    db: Session = Depends(get_db)
):
    """Get recall reminder effectiveness metrics"""
    return metrics_service.get_recall_effectiveness(db, days_window)