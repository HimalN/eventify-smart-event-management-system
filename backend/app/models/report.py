"""Report model."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database.base import Base, generate_uuid
from datetime import datetime, timezone


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    period = Column(String(100), nullable=True)
    records_count = Column(Integer, nullable=True, default=0)
    report_type = Column(String(50), nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    file_path = Column(String(500), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
