"""Weather record model."""

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from app.database.base import Base, generate_uuid
from datetime import datetime, timezone


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=True, index=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    forecast_date = Column(Date, nullable=True)
    condition = Column(String(50), nullable=True)  # Sunny | Cloudy | Rain | Storm | Partly Cloudy
    temperature = Column(Float, nullable=True)
    feels_like = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rain_probability = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    impact_score = Column(Float, nullable=True)
    advisory = Column(String(30), nullable=True)  # favorable | moderate | attention_required
    advisory_message = Column(String(500), nullable=True)
    raw_response_json = Column(Text, nullable=True)
