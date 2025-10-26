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
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone_number = Column(String(20), unique=True, nullable=False)
    email = Column(String(100))
    consent_sms = Column(Boolean, default=False)
    consent_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    appointments = relationship("Appointment", back_populates="patient")
    messages = relationship("Message", back_populates="patient")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled
    followup_required = Column(Boolean, default=False)
    followup_interval_days = Column(Integer, default=180)  # 6 months by default
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    reminders = relationship("Message", back_populates="appointment")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)  # Only for appointment reminders
    message_type = Column(Enum(MessageType), nullable=False)
    reminder_stage = Column(Enum(ReminderStage), nullable=True)  # Only for appointment reminders
    content = Column(Text, nullable=False)
    status = Column(Enum(MessageStatus), default=MessageStatus.PENDING)
    provider_message_id = Column(String(100))  # Twilio message ID
    scheduled_for = Column(DateTime)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    patient = relationship("Patient", back_populates="messages")
    appointment = relationship("Appointment", back_populates="reminders")

class MessageTemplate(Base):
    __tablename__ = "message_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False)
    reminder_stage = Column(Enum(ReminderStage), nullable=True)  # Only for appointment reminders
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)