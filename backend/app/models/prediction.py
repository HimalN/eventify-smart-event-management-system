"""Prediction model."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.database.base import Base, generate_uuid
from datetime import datetime, timezone


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=True, index=True)
    model_name = Column(String(50), nullable=False)
    predicted_attendance = Column(Integer, nullable=False)
    expected_attendance = Column(Integer, nullable=True)
    current_registrations = Column(Integer, nullable=True)
    difference = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=True)
    feature_weights_json = Column(Text, nullable=True)
    insights_json = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
