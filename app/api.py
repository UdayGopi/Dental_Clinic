from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request as FastAPIRequest, Query
from fastapi import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
import json
from pydantic import BaseModel

from app.database import get_db
from app.models import Patient, Appointment, Message, MessageTemplate, MessageType, MessageStatus, User
from app.services.messaging import MessagingService
from app.services.broadcast import broadcast_service
from app.services.metrics import metrics_service
from app.services.consent import consent_service
from app.scheduler import AppointmentScheduler, scheduler

security = HTTPBearer(auto_error=False)

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

# Simple authentication (for demo - use proper JWT in production)
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify authentication token"""
    # For demo purposes, accept any token or no token
    # In production, implement proper JWT verification
    return True

# Auth endpoints
@router.post("/auth/register", response_model=dict)
def register(user_data: dict, db: Session = Depends(get_db)):
    """Register a new user and create patient profile if patient role"""
    role = user_data.get("role", "patient")
    email = user_data.get("email")
    name = user_data.get("name", "")
    password = user_data.get("password", "")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user in database
    new_user = User(
        email=email,
        name=name,
        password_hash=password,  # In production, hash this password
        role=role,
        employee_id=user_data.get("employee_id"),
        department=user_data.get("department"),
        phone_number=user_data.get("phone_number"),
        shift_timing=user_data.get("shift_timing"),
        admin_code=user_data.get("admin_code"),
        designation=user_data.get("designation"),
        access_level=user_data.get("access_level"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If patient role, create or link patient profile
    patient_id = None
    if role == "patient" and email:
        # Check if patient already exists by email
        existing_patient = db.query(Patient).filter(Patient.email == email).first()
        if not existing_patient:
            # Create new patient profile
            name_parts = name.split(" ", 1) if name else ["", ""]
            
            # Generate a valid phone number
            # Try to get phone from user_data, or generate one from email
            base_phone = user_data.get("phone_number")
            if not base_phone:
                # Create a phone number from email (remove @ and .)
                phone_base = email.replace('@', '').replace('.', '')[:10]
                # Ensure it's numeric
                phone_base = ''.join(filter(str.isdigit, phone_base))
                if len(phone_base) < 10:
                    import random
                    phone_base = str(random.randint(1000000000, 9999999999))
                base_phone = f"+1{phone_base}"
            
            # Ensure phone number is unique
            phone_number = base_phone
            counter = 1
            while db.query(Patient).filter(Patient.phone_number == phone_number).first():
                import random
                phone_number = f"+1{random.randint(1000000000, 9999999999)}"
                counter += 1
                if counter > 10:  # Safety limit
                    break
            
            try:
                new_patient = Patient(
                    first_name=name_parts[0] or email.split("@")[0],
                    last_name=name_parts[1] if len(name_parts) > 1 else "",
                    email=email,
                    phone_number=phone_number,
                    consent_sms=True,  # Default to True for online registration
                    consent_date=datetime.now(),
                    consent_source="web_form"
                )
                db.add(new_patient)
                db.commit()
                db.refresh(new_patient)
                patient_id = new_patient.id
            except Exception as e:
                # If patient creation fails, log but don't fail registration
                # Patient profile can be created later when booking appointment
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to create patient profile during registration: {str(e)}")
                patient_id = None
        else:
            patient_id = existing_patient.id
    
    return {
        "token": "mock-token",
        "user": {
            "id": str(new_user.id),
            "email": email,
            "name": name,
            "role": role,
            "patient_id": patient_id
        }
    }

@router.post("/auth/login", response_model=dict)
def login(credentials: dict, db: Session = Depends(get_db)):
    """Login user"""
    email = credentials.get("email")
    password = credentials.get("password")
    role = credentials.get("role", "patient")
    
    # Find user by email and role
    user = db.query(User).filter(User.email == email, User.role == role).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # In production, verify password hash here
    # For now, just check if password matches (mock)
    if password and user.password_hash != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login and login count
    user.last_login = datetime.now()
    user.login_count = (user.login_count or 0) + 1
    db.commit()
    
    # Get patient_id if patient role
    patient_id = None
    if role == "patient":
        patient = db.query(Patient).filter(Patient.email == email).first()
        if patient:
            patient_id = patient.id
    
    return {
        "token": "mock-token",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "patient_id": patient_id
        }
    }

# User management endpoints
@router.get("/users/", response_model=dict)
def get_users(
    role: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db)
):
    """Get users with pagination and filtering"""
    from app.config import config
    
    try:
        # Optimize page_size
        page_size = min(page_size, config.MAX_PAGE_SIZE)
        offset = (page - 1) * page_size
        
        query = db.query(User)
        
        # Apply filters
        if role:
            query = query.filter(User.role == role)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (User.name.ilike(search_term)) |
                (User.email.ilike(search_term))
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        users = query.order_by(desc(User.created_at)).offset(offset).limit(page_size).all()
        
        return {
            "items": [
                {
                    "id": str(u.id),
                    "name": str(u.name) if u.name else "",
                    "email": str(u.email) if u.email else "",
                    "role": str(u.role) if u.role else "patient",
                    "last_login": u.last_login.isoformat() if u.last_login else None,
                    "login_count": int(u.login_count) if u.login_count else 0,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                    "employee_id": str(u.employee_id) if u.employee_id else None,
                    "department": str(u.department) if u.department else None,
                    "phone_number": str(u.phone_number) if u.phone_number else None,
                    "shift_timing": str(u.shift_timing) if u.shift_timing else None,
                    "designation": str(u.designation) if u.designation else None,
                    "access_level": str(u.access_level) if u.access_level else None,
                }
                for u in users
            ],
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size
        }
    except Exception as e:
        # If User table doesn't exist yet, return empty response
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Error fetching users (table may not exist): {str(e)}")
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0
        }

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

@router.get("/patients/", response_model=dict)
def get_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db)
):
    """Get patients with appointment and activity information (paginated)"""
    from app.config import config
    
    # Optimize page_size
    page_size = min(page_size, config.MAX_PAGE_SIZE)
    offset = (page - 1) * page_size
    
    # Base query with optimized joins to avoid N+1 problem
    query = db.query(
        Patient,
        func.count(Appointment.id).label('appointment_count'),
        func.max(Appointment.appointment_date).label('last_appointment_date'),
        func.count(Message.id).label('message_count')
    ).outerjoin(
        Appointment, Patient.id == Appointment.patient_id
    ).outerjoin(
        Message, Patient.id == Message.patient_id
    )
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Patient.first_name.ilike(search_term)) |
            (Patient.last_name.ilike(search_term)) |
            (Patient.email.ilike(search_term))
        )
    
    # Group by patient to aggregate counts
    query = query.group_by(Patient.id)
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    patients_data = query.order_by(desc(Patient.created_at)).offset(offset).limit(page_size).all()
    
    # Get last appointment status for each patient (optimized)
    patient_ids = [p[0].id for p in patients_data]
    last_appointments = {}
    if patient_ids:
        last_appts = db.query(
            Appointment.patient_id,
            Appointment.status,
            Appointment.appointment_date
        ).filter(
            Appointment.patient_id.in_(patient_ids)
        ).order_by(
            desc(Appointment.appointment_date)
        ).distinct(Appointment.patient_id).all()
        
        for appt in last_appts:
            if appt.patient_id not in last_appointments:
                last_appointments[appt.patient_id] = {
                    'status': appt.status,
                    'date': appt.appointment_date
                }
    
    # Build response
    result = []
    for patient, appointment_count, last_appointment_date, message_count in patients_data:
        last_appt_info = last_appointments.get(patient.id, {})
        result.append({
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone_number": patient.phone_number,
            "email": patient.email,
            "consent_sms": patient.consent_sms,
            "appointment_count": appointment_count or 0,
            "last_appointment_date": last_appointment_date.isoformat() if last_appointment_date else None,
            "last_appointment_status": last_appt_info.get('status'),
            "message_count": message_count or 0,
            "created_at": patient.created_at.isoformat() if patient.created_at else None,
        })
    
    return {
        "items": result,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get a patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Appointment endpoints
@router.post("/appointments/", response_model=dict)
async def create_appointment(
    request: FastAPIRequest,
    db: Session = Depends(get_db)
):
    """Create a new appointment"""
    try:
        # Get request body as dict to avoid Pydantic validation errors
        appointment_data = await request.json()
        
        # Get patient_email from query parameters
        patient_email = request.query_params.get("patient_email")
        
        # Extract appointment data
        patient_id = appointment_data.get("patient_id")
        appointment_date_str = appointment_data.get("appointment_date")
        followup_required = appointment_data.get("followup_required", True)
        followup_interval_days = appointment_data.get("followup_interval_days", 180)
        doctor_name = appointment_data.get("doctor_name")
        appointment_type = appointment_data.get("appointment_type") or appointment_data.get("serviceType") or appointment_data.get("service_type")
        
        # Validate required fields
        if not appointment_date_str:
            raise HTTPException(status_code=400, detail="appointment_date is required")
        
        # Parse appointment date
        if isinstance(appointment_date_str, str):
            try:
                # Handle ISO format with or without timezone
                if appointment_date_str.endswith('Z'):
                    appointment_date_str = appointment_date_str.replace('Z', '+00:00')
                appointment_date = datetime.fromisoformat(appointment_date_str)
            except ValueError:
                try:
                    # Try alternative parsing
                    from dateutil import parser
                    appointment_date = parser.parse(appointment_date_str)
                except ImportError:
                    raise HTTPException(status_code=400, detail="Invalid appointment_date format. Please use ISO format (YYYY-MM-DDTHH:MM:SS)")
        elif isinstance(appointment_date_str, datetime):
            appointment_date = appointment_date_str
        else:
            raise HTTPException(status_code=400, detail="Invalid appointment_date format")
        
        # Get phone number from appointment form (priority)
        phone_number_from_form = appointment_data.get("phone_number")
        import logging
        logger = logging.getLogger(__name__)
        if phone_number_from_form:
            logger.info(f"Appointment booking: Phone number from form: {phone_number_from_form}")
        
        # Get patient - either by ID or email
        patient = None
        if patient_id:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
        elif patient_email:
            patient = db.query(Patient).filter(Patient.email == patient_email).first()
        
        # If patient exists, update phone number if provided in form
        if patient and phone_number_from_form:
            if patient.phone_number != phone_number_from_form:
                logger.info(f"Updating existing patient {patient.id} phone from {patient.phone_number} to {phone_number_from_form}")
                patient.phone_number = phone_number_from_form
                db.commit()
                db.refresh(patient)
                logger.info(f"Patient {patient.id} phone updated successfully to {patient.phone_number}")
        
        # If patient not found, try to create one from user account
        if not patient and patient_email:
            # Find user by email
            user = db.query(User).filter(User.email == patient_email, User.role == "patient").first()
            if user:
                # Create patient profile from user data
                name_parts = user.name.split(" ", 1) if user.name else ["", ""]
                # Get phone number from appointment data (from booking form) - PRIORITY
                phone_number = phone_number_from_form
                if not phone_number:
                    # Try to get from user record
                    phone_number = user.phone_number
                if not phone_number:
                    # Last resort: generate from email (but log warning)
                    logger.warning(f"Patient {patient_email} has no phone number. Generating placeholder.")
                    phone_number = f"+1{patient_email.replace('@', '').replace('.', '')[:15]}"
                
                # Ensure phone number is unique
                existing_phone = db.query(Patient).filter(Patient.phone_number == phone_number).first()
                if existing_phone:
                    # If phone exists, use a variation
                    phone_number = f"{phone_number}1"
                
                try:
                    # Log phone number being used
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.info(f"Creating patient for {patient_email} with phone number: {phone_number}")
                    
                    patient = Patient(
                        first_name=name_parts[0] or patient_email.split("@")[0],
                        last_name=name_parts[1] if len(name_parts) > 1 else "",
                        email=patient_email,
                        phone_number=phone_number,
                        consent_sms=True,
                        consent_date=datetime.now(),
                        consent_source="web_form"
                    )
                    db.add(patient)
                    db.commit()
                    db.refresh(patient)
                    logger.info(f"Patient created successfully: ID={patient.id}, Phone={patient.phone_number}")
                except Exception as e:
                    # If patient creation fails (e.g., duplicate phone), try to find existing patient
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Failed to create patient with phone {phone_number}: {str(e)}")
                    
                    # Try to find existing patient by email
                    existing_patient = db.query(Patient).filter(Patient.email == patient_email).first()
                    if existing_patient:
                        logger.info(f"Found existing patient {existing_patient.id} for {patient_email}")
                        patient = existing_patient
                        # Update phone number if provided in appointment
                        if phone_number and phone_number != existing_patient.phone_number:
                            existing_patient.phone_number = phone_number
                            db.commit()
                            logger.info(f"Updated patient {existing_patient.id} phone to {phone_number}")
                    else:
                        # Last resort: generate random phone
                        import random
                        phone_number = f"+1{random.randint(1000000000, 9999999999)}"
                        logger.warning(f"Creating patient with generated phone: {phone_number}")
                        patient = Patient(
                            first_name=name_parts[0] or patient_email.split("@")[0],
                            last_name=name_parts[1] if len(name_parts) > 1 else "",
                            email=patient_email,
                            phone_number=phone_number,
                            consent_sms=True,
                            consent_date=datetime.now(),
                            consent_source="web_form"
                        )
                        db.add(patient)
                        db.commit()
                        db.refresh(patient)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found. Please ensure you have a patient profile or contact the clinic.")
        
        # Final verification: Log patient details being used
        logger.info(f"Creating appointment for patient ID {patient.id}: {patient.first_name} {patient.last_name}, Phone: {patient.phone_number}, Email: {patient.email}")
        
        # Create appointment
        db_appointment = Appointment(
            patient_id=patient.id,
            appointment_date=appointment_date,
            status="scheduled",
            followup_required=followup_required,
            followup_interval_days=followup_interval_days,
            doctor_name=doctor_name,
            appointment_type=appointment_type
        )
        
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        # Create staged reminders for the appointment
        scheduler.create_appointment_reminders(db_appointment, db)
        
        # Log final patient phone number for verification
        db.refresh(patient)
        logger.info(f"Appointment {db_appointment.id} created. Patient {patient.id} final phone number: {patient.phone_number}")
        
        # Return appointment as dictionary for proper serialization
        return {
            "id": db_appointment.id,
            "patient_id": db_appointment.patient_id,
            "appointment_date": db_appointment.appointment_date.isoformat() if db_appointment.appointment_date else None,
            "status": db_appointment.status,
            "followup_required": db_appointment.followup_required,
            "followup_interval_days": db_appointment.followup_interval_days,
            "doctor_name": db_appointment.doctor_name,
            "appointment_type": db_appointment.appointment_type,
            "created_at": db_appointment.created_at.isoformat() if db_appointment.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create appointment: {str(e)}")

@router.put("/appointments/{appointment_id}", response_model=dict)
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
    # Return appointment as dictionary for proper serialization
    return {
        "id": db_appointment.id,
        "patient_id": db_appointment.patient_id,
        "appointment_date": db_appointment.appointment_date.isoformat() if db_appointment.appointment_date else None,
        "status": db_appointment.status,
        "followup_required": db_appointment.followup_required,
        "followup_interval_days": db_appointment.followup_interval_days,
        "doctor_name": db_appointment.doctor_name,
        "appointment_type": db_appointment.appointment_type,
        "created_at": db_appointment.created_at.isoformat() if db_appointment.created_at else None,
    }

@router.get("/appointments/", response_model=dict)
def get_appointments(
    patient_id: Optional[int] = None, 
    patient_email: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[str] = Query(None, description="Filter by start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (ISO format)"),
    db: Session = Depends(get_db)
):
    """Get appointments with pagination and filtering"""
    from app.config import config
    
    # Optimize page_size
    page_size = min(page_size, config.MAX_PAGE_SIZE)
    offset = (page - 1) * page_size
    
    query = db.query(Appointment)
    
    # Apply filters
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    elif patient_email:
        # Find patient by email and filter appointments
        patient = db.query(Patient).filter(Patient.email == patient_email).first()
        if patient:
            query = query.filter(Appointment.patient_id == patient.id)
        else:
            return {
                "items": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0
            }
    
    if status:
        query = query.filter(Appointment.status == status)
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Appointment.appointment_date >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Appointment.appointment_date <= end_dt)
        except ValueError:
            pass
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination and ordering
    appointments = query.order_by(desc(Appointment.appointment_date)).offset(offset).limit(page_size).all()
    
    # Convert SQLAlchemy models to dictionaries for serialization
    appointments_list = [
        {
            "id": apt.id,
            "patient_id": apt.patient_id,
            "appointment_date": apt.appointment_date.isoformat() if apt.appointment_date else None,
            "status": apt.status,
            "followup_required": apt.followup_required,
            "followup_interval_days": apt.followup_interval_days,
            "doctor_name": apt.doctor_name,
            "appointment_type": apt.appointment_type,
            "created_at": apt.created_at.isoformat() if apt.created_at else None,
        }
        for apt in appointments
    ]
    
    return {
        "items": appointments_list,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

@router.put("/appointments/{appointment_id}/status", response_model=dict)
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
    if appointment.status == "completed":
        patient = db.query(Patient).filter(Patient.id == appointment.patient_id).first()
        template = db.query(MessageTemplate).filter(MessageTemplate.message_type == MessageType.POST_VISIT).first()
        
        if patient and patient.consent_sms and template:
            # Create context for template
            context = {
                "patient_first_name": patient.first_name,
                "appointment_date": appointment.appointment_date.strftime("%B %d, %Y")
            }
            
            # Render message content
            message_content = messaging_service.render_template(template.content, context)
            
            # Create message
            message = Message(
                patient_id=patient.id,
                appointment_id=appointment.id,
                template_id=template.id,
                message_type=MessageType.POST_VISIT,
                content=message_content,
                status=MessageStatus.PENDING,
                scheduled_for=datetime.now()
            )
            db.add(message)
            db.commit()
            db.refresh(message)
            
            # Process message in background
            background_tasks.add_task(
                messaging_service.process_message,
                message.id,
                context
            )
    
    # Return appointment as dictionary for proper serialization
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
        "status": appointment.status,
        "followup_required": appointment.followup_required,
        "followup_interval_days": appointment.followup_interval_days,
        "doctor_name": appointment.doctor_name,
        "appointment_type": appointment.appointment_type,
        "created_at": appointment.created_at.isoformat() if appointment.created_at else None,
    }

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
            "content": t.content,
            "reminder_stage": t.reminder_stage.value if t.reminder_stage else None,
            "is_active": t.is_active,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in templates
    ]

# Broadcast endpoints
@router.post("/broadcasts/", response_model=dict)
def create_broadcast(broadcast_data: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Create a new broadcast campaign"""
    try:
        # Parse scheduled_at
        scheduled_at_str = broadcast_data.get("scheduled_at")
        scheduled_at = datetime.fromisoformat(scheduled_at_str) if scheduled_at_str else datetime.now()
        
        broadcast = broadcast_service.create_broadcast(
            db,
            broadcast_data.get("name"),
            broadcast_data.get("template_id"),
            broadcast_data.get("filter_criteria", {}),
            scheduled_at
        )
        
        if not broadcast:
            raise HTTPException(status_code=400, detail="Failed to create broadcast")
        
        # Process broadcast in background
        background_tasks.add_task(broadcast_service.process_broadcast, broadcast.id, db)
        
        return {"success": True, "broadcast_id": broadcast.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/broadcasts/", response_model=List[dict])
def get_broadcasts(db: Session = Depends(get_db)):
    """Get all broadcasts"""
    from app.models import Broadcast, MessageTemplate
    broadcasts = db.query(Broadcast).all()
    result = []
    for b in broadcasts:
        template = db.query(MessageTemplate).filter(MessageTemplate.id == b.template_id).first() if b.template_id else None
        result.append({
            "id": b.id,
            "name": b.name,
            "template_id": b.template_id,
            "template_name": template.name if template else None,
            "filter_criteria": b.filter_criteria,
            "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else None,
            "status": b.status,
            "total_recipients": b.total_recipients if hasattr(b, 'total_recipients') else 0,
            "sent_count": b.sent_count if hasattr(b, 'sent_count') else 0,
            "failed_count": b.failed_count if hasattr(b, 'failed_count') else 0,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })
    return result

@router.get("/broadcasts/{broadcast_id}", response_model=dict)
def get_broadcast(broadcast_id: int, db: Session = Depends(get_db)):
    """Get broadcast details"""
    stats = metrics_service.get_broadcast_stats(db, broadcast_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    return stats

# Webhook endpoints
@router.post("/webhooks/twilio")
async def twilio_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Twilio webhook for delivery status and replies"""
    from fastapi import Form
    
    # Twilio sends form-encoded data, so we need to handle it properly
    form_data = await request.form()
    
    # Extract data from webhook
    message_sid = form_data.get("MessageSid") or form_data.get("SmsSid")
    message_status = form_data.get("MessageStatus") or form_data.get("SmsStatus")
    from_number = form_data.get("From")
    body = form_data.get("Body", "")
    if body:
        body = body.strip().upper()
    
    # Update message status if we have the SID
    if message_sid:
        message = db.query(Message).filter(Message.provider_message_id == message_sid).first()
        if message:
            if message_status == "delivered":
                message.status = MessageStatus.DELIVERED
                message.delivered_at = datetime.now()
            elif message_status in ["failed", "undelivered"]:
                message.status = MessageStatus.FAILED
                error_msg = form_data.get("ErrorMessage", "Unknown error")
                message.error_message = error_msg
            
            db.commit()
    
    # Handle opt-out/opt-in keywords (for incoming SMS replies)
    if from_number and body:
        if body in ["STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"]:
            consent_service.process_opt_out(db, from_number)
            return {"success": True, "action": "opt_out"}
        elif body in ["START", "SUBSCRIBE", "YES", "UNSTOP"]:
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
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    return metrics_service.get_message_metrics(db, start_dt, end_dt)

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

# Message endpoints
@router.post("/messages/send", response_model=dict)
def send_message(message_data: MessageSend, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Send a message to a patient"""
    try:
        # Get patient and template
        patient = db.query(Patient).filter(Patient.id == message_data.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        template = db.query(MessageTemplate).filter(MessageTemplate.id == message_data.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check consent
        if not patient.consent_sms:
            raise HTTPException(status_code=400, detail="Patient has not consented to SMS")
        
        # Create context
        context = {
            "patient_first_name": patient.first_name,
            "patient_last_name": patient.last_name,
            "patient_phone": patient.phone_number
        }
        
        # If appointment_id is provided in custom_variables, load appointment details
        appointment_id = message_data.custom_variables.get("appointment_id") if message_data.custom_variables else None
        if appointment_id:
            appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
            if appointment:
                context.update({
                    "appointment_date": appointment.appointment_date.strftime("%B %d, %Y") if appointment.appointment_date else "",
                    "appointment_time": appointment.appointment_date.strftime("%I:%M %p") if appointment.appointment_date else "",
                    "doctor_name": appointment.doctor_name or "Dr. Smith",
                    "appointment_type": appointment.appointment_type or "General Checkup"
                })
        
        if message_data.custom_variables:
            context.update(message_data.custom_variables)
        
        # Render message
        message_content = messaging_service.render_template(template.content, context)
        
        # Create message
        message = Message(
            patient_id=patient.id,
            template_id=template.id,
            message_type=template.message_type,
            content=message_content,
            status=MessageStatus.PENDING,
            scheduled_for=datetime.now()
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Process in background
        background_tasks.add_task(
            messaging_service.process_message,
            message.id,
            context
        )
        
        return {"success": True, "message_id": message.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/messages/", response_model=dict)
def get_messages(
    patient_id: Optional[int] = None, 
    patient_email: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    message_type: Optional[str] = Query(None, description="Filter by message type"),
    db: Session = Depends(get_db)
):
    """Get messages with pagination and filtering"""
    from app.config import config
    
    # Optimize page_size
    page_size = min(page_size, config.MAX_PAGE_SIZE)
    offset = (page - 1) * page_size
    
    query = db.query(Message)
    
    # Apply filters
    if patient_id:
        query = query.filter(Message.patient_id == patient_id)
    elif patient_email:
        # Find patient by email and filter messages
        patient = db.query(Patient).filter(Patient.email == patient_email).first()
        if patient:
            query = query.filter(Message.patient_id == patient.id)
        else:
            return {
                "items": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0
            }
    
    if status:
        query = query.filter(Message.status == status)
    
    if message_type:
        query = query.filter(Message.message_type == message_type)
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination and ordering
    messages = query.order_by(desc(Message.created_at)).offset(offset).limit(page_size).all()
    
    return {
        "items": [
            {
                "id": m.id,
                "patient_id": m.patient_id,
                "message_type": m.message_type.value if hasattr(m.message_type, 'value') else str(m.message_type),
                "status": m.status.value if hasattr(m.status, 'value') else str(m.status),
                "content": m.content,
                "sent_at": m.sent_at.isoformat() if m.sent_at else None,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

# Audit logs endpoint
@router.get("/audit-logs/", response_model=dict)
def get_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page"),
    action: Optional[str] = Query(None, description="Filter by action"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    db: Session = Depends(get_db)
):
    """Get audit logs with pagination"""
    from app.models import AuditLog
    from app.config import config
    
    # Optimize page_size
    page_size = min(page_size, config.MAX_PAGE_SIZE)
    offset = (page - 1) * page_size
    
    query = db.query(AuditLog)
    
    # Apply filters
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination and ordering
    logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size).all()
    
    return {
        "items": [
            {
                "id": log.id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

# Manual message processing endpoint (for testing/admin)
@router.post("/messages/process-pending")
def process_pending_messages(
    force_immediate: bool = Query(False, description="Process all pending messages immediately, ignoring scheduled_for dates"),
    db: Session = Depends(get_db)
):
    """Manually trigger processing of pending messages
    
    Args:
        force_immediate: If True, process all pending messages regardless of scheduled_for date.
                        If False, only process messages that are due (scheduled_for <= now).
    """
    from app.scheduler import scheduler
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        count = scheduler.messaging_service.process_pending_messages(db, force_immediate=force_immediate)
        return {
            "success": True,
            "message": f"Processed {count} pending messages",
            "processed_count": count,
            "force_immediate": force_immediate
        }
    except Exception as e:
        logger.error(f"Error processing pending messages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process messages: {str(e)}")