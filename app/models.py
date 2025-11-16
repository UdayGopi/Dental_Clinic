from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

# Simple enums
class MessageStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"

class MessageType(str, enum.Enum):
    APPOINTMENT_REMINDER = "appointment_reminder"
    POST_VISIT = "post_visit"
    RECALL = "recall"
    BROADCAST = "broadcast"

class ReminderStage(str, enum.Enum):
    DAYS_BEFORE = "days_before"
    DAY_BEFORE = "day_before"
    HOURS_BEFORE = "hours_before"

# Models
class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False, index=True)  # Indexed for search
    last_name = Column(String(50), nullable=False, index=True)  # Indexed for search
    phone_number = Column(String(20), unique=True, nullable=False, index=True)  # Indexed for lookup
    email = Column(String(100), index=True)  # Indexed for lookup
    consent_sms = Column(Boolean, default=False, index=True)  # Indexed for filtering
    consent_date = Column(DateTime)
    consent_source = Column(String(50))  # web_form, paper, phone, etc.
    created_at = Column(DateTime, default=datetime.now, index=True)  # Indexed for sorting
    
    # Relationships
    appointments = relationship("Appointment", back_populates="patient")
    messages = relationship("Message", back_populates="patient")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)  # Indexed for filtering
    appointment_date = Column(DateTime, nullable=False, index=True)  # Indexed for sorting/filtering
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled
    followup_required = Column(Boolean, default=False)
    followup_interval_days = Column(Integer, default=180)  # 6 months by default
    doctor_name = Column(String(100), nullable=True)  # Doctor/Staff name assigned to appointment
    appointment_type = Column(String(100), nullable=True)  # Type of appointment (e.g., "Cleaning", "Checkup", "Root Canal")
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    reminders = relationship("Message", back_populates="appointment")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)  # Only for appointment reminders
    template_id = Column(Integer, ForeignKey("message_templates.id"), nullable=True)
    broadcast_id = Column(Integer, ForeignKey("broadcasts.id"), nullable=True)  # For broadcast messages
    message_type = Column(Enum(MessageType), nullable=False)
    reminder_stage = Column(Enum(ReminderStage), nullable=True)  # Only for appointment reminders
    content = Column(Text, nullable=False)
    status = Column(Enum(MessageStatus), default=MessageStatus.PENDING)
    provider_message_id = Column(String(100))  # Twilio message ID
    scheduled_for = Column(DateTime)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    error_message = Column(Text)  # Error details if failed
    retry_count = Column(Integer, default=0)  # Number of retry attempts
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    patient = relationship("Patient", back_populates="messages")
    appointment = relationship("Appointment", back_populates="reminders")
    template = relationship("MessageTemplate", back_populates="messages")
    broadcast = relationship("Broadcast", back_populates="messages")

class MessageTemplate(Base):
    __tablename__ = "message_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False)
    reminder_stage = Column(Enum(ReminderStage), nullable=True)  # Only for appointment reminders
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    messages = relationship("Message", back_populates="template")

class Broadcast(Base):
    __tablename__ = "broadcasts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    template_id = Column(Integer, ForeignKey("message_templates.id"), nullable=False)
    filter_criteria = Column(Text)  # JSON string for filter criteria
    scheduled_at = Column(DateTime)
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime)
    
    # Relationships
    template = relationship("MessageTemplate")
    messages = relationship("Message", back_populates="broadcast")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False)  # message_sent, opt_out, opt_in, etc.
    entity_type = Column(String(50))  # patient, message, broadcast, etc.
    entity_id = Column(Integer)
    details = Column(Text)  # JSON string for additional details
    created_at = Column(DateTime, default=datetime.now)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)  # Indexed for search
    password_hash = Column(String(255))  # In production, store hashed password
    role = Column(String(20), nullable=False, default="patient", index=True)  # Indexed for filtering
    last_login = Column(DateTime, index=True)  # Indexed for sorting
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now, index=True)  # Indexed for sorting
    
    # Additional fields for staff/admin
    employee_id = Column(String(50))  # For staff
    department = Column(String(100))  # For staff
    phone_number = Column(String(20))  # For staff
    shift_timing = Column(String(50))  # For staff
    admin_code = Column(String(50))  # For admin
    designation = Column(String(100))  # For admin
    access_level = Column(String(50))  # For admin