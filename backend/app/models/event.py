"""Event model."""

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text, Time
from app.database.base import Base, TimestampMixin, generate_uuid


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    venue_type = Column(String(20), nullable=False, default="indoor")  # indoor | outdoor | hybrid
    category = Column(String(50), nullable=False, default="Workshop")
    event_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True)  # HH:MM format
    end_time = Column(String(10), nullable=True)
    capacity = Column(Integer, nullable=False, default=100)
    expected_attendance = Column(Integer, nullable=True)
    current_registrations = Column(Integer, nullable=False, default=0)
    predicted_attendance = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=True)
    actual_attendance = Column(Integer, nullable=True)
    organizer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    organizer_name = Column(String(150), nullable=True)
    target_audience = Column(String(255), nullable=True)
    registration_deadline = Column(Date, nullable=True)
    banner_hue = Column(Integer, nullable=True, default=0)
    model_used = Column(String(50), nullable=True, default="XGBoost")
    status = Column(String(30), nullable=False, default="upcoming")
    # Status lifecycle: draft | upcoming | ongoing | completed | cancelled
