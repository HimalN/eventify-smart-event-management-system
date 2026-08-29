"""Task model for organizer preparation activities."""

from sqlalchemy import Column, Date, DateTime, ForeignKey, String, Text
from app.database.base import Base, TimestampMixin, generate_uuid


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, default="medium")  # high | medium | low
    due_date = Column(Date, nullable=True)
    due_label = Column(String(50), nullable=True)  # "Today", "Tomorrow", "In 3 days"
    status = Column(String(20), nullable=False, default="pending")  # pending | in_progress | completed | cancelled
    event_id = Column(String(36), ForeignKey("events.id"), nullable=True, index=True)
    assigned_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
