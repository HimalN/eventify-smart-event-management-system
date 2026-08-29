"""Registration model."""

from sqlalchemy import Column, Date, DateTime, ForeignKey, String, UniqueConstraint
from app.database.base import Base, generate_uuid


class Registration(Base):
    __tablename__ = "registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "participant_id", name="uq_event_participant"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False, index=True)
    participant_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    participant_name = Column(String(150), nullable=False)
    participant_email = Column(String(255), nullable=False)
    ticket_code = Column(String(20), unique=True, nullable=False)
    registration_date = Column(Date, nullable=False)
    confirmation_status = Column(String(20), nullable=False, default="confirmed")  # confirmed | waitlisted | cancelled
    attendance_status = Column(String(20), nullable=False, default="pending")  # attended | absent | pending
    cancelled_at = Column(DateTime, nullable=True)
