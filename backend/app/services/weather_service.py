"""Weather service for querying and caching weather data."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.weather import WeatherRecord
from app.models.event import Event
from app.integrations.openweathermap import (
    fetch_current_weather,
    fetch_forecast,
    fetch_hourly_timeline,
)

async def get_current_and_forecast_weather() -> dict:
    """Retrieve campus current conditions, 7-day forecast, and timeline."""
    current = await fetch_current_weather()
    forecast = await fetch_forecast()
    timeline = await fetch_hourly_timeline()
    return {
        "current": current,
        "forecast": forecast,
        "timeline": timeline
    }

async def get_or_fetch_event_weather(db: Session, event: Event) -> WeatherRecord:
    """Check if weather is stored for an event. If not, fetch and store it."""
    # Check if there is an existing record updated within the last hour
    now = datetime.now(timezone.utc)
    record = (
        db.query(WeatherRecord)
        .filter(WeatherRecord.event_id == event.id)
        .order_by(WeatherRecord.recorded_at.desc())
        .first()
    )
    
    if record and (now - record.recorded_at.replace(tzinfo=timezone.utc)).total_seconds() < 3600:
        return record

    # Otherwise fetch forecast
    forecasts = await fetch_forecast()
    # Find matching date
    event_date_str = event.event_date.strftime("%Y-%m-%d")
    matched_forecast = None
    for f in forecasts:
        if f["date"] == event_date_str:
            matched_forecast = f
            break
            
    if not matched_forecast:
        # Fallback to current weather or general mock
        matched_forecast = await fetch_current_weather()
        matched_forecast["date"] = event_date_str

    # Create new weather record
    new_record = WeatherRecord(
        event_id=event.id,
        recorded_at=now,
        forecast_date=event.event_date,
        condition=matched_forecast.get("condition", "Partly Cloudy"),
        temperature=matched_forecast.get("temperature", 28.0),
        feels_like=matched_forecast.get("feels_like", 30.0),
        humidity=matched_forecast.get("humidity", 70.0),
        rain_probability=matched_forecast.get("rain_probability", 25.0),
        wind_speed=matched_forecast.get("wind_speed", 10.0),
        impact_score=matched_forecast.get("impact_score", 88.0),
        advisory=matched_forecast.get("advisory", "favorable"),
        advisory_message=matched_forecast.get("advisory_message", ""),
        raw_response_json=matched_forecast.get("raw_json", None),
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record
