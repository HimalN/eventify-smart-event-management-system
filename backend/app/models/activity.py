"""Activity / audit log model."""

from sqlalchemy import Column, DateTime, String, Text
from app.database.base import Base, generate_uuid
from datetime import datetime, timezone


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False)
    target = Column(String(255), nullable=True)
    resource_id = Column(String(36), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
