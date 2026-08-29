"""Notification model."""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from app.database.base import Base, generate_uuid
from datetime import datetime, timezone


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    type = Column(String(30), nullable=False, default="system")  # reminder | registration | weather | prediction | system
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
