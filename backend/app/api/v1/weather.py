"""Weather API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.weather import WeatherRecord
from app.schemas.weather import WeatherDataResponse, CurrentWeather, WeatherTimelineEntry
from app.schemas.event import WeatherForecastSchema
from app.services import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("", response_model=WeatherDataResponse)
async def get_general_weather(current_user: User = Depends(get_current_user)):
    """Fetch current, forecast and timeline weather data."""
    data = await weather_service.get_current_and_forecast_weather()
    
    current_schema = CurrentWeather(
        location=data["current"]["location"],
        condition=data["current"]["condition"],
        temperature=data["current"]["temperature"],
        feels_like=data["current"]["feels_like"],
        humidity=data["current"]["humidity"],
        rain_probability=data["current"]["rain_probability"],
        wind_speed=data["current"]["wind_speed"],
        impact_score=data["current"]["impact_score"],
        advisory=data["current"]["advisory"],
        advisory_message=data["current"]["advisory_message"],
        updated=data["current"]["updated"],
    )
    
    forecast_list = [
        WeatherForecastSchema(
            date=f["date"],
            condition=f["condition"],
            temperature=f["temperature"],
            feels_like=f["feels_like"],
            humidity=f["humidity"],
            rain_probability=f["rain_probability"],
            wind_speed=f["wind_speed"],
            impact_score=f["impact_score"],
            advisory=f["advisory"],
            advisory_message=f["advisory_message"],
        )
        for f in data["forecast"]
    ]
    
    timeline_list = [
        WeatherTimelineEntry(
            hour=t["hour"],
            temperature=t["temperature"],
            rain=t["rain"],
        )
        for t in data["timeline"]
    ]
    
    return WeatherDataResponse(
        current=current_schema,
        forecast=forecast_list,
        timeline=timeline_list,
    )


@router.get("/{event_id}", response_model=WeatherForecastSchema)
async def get_event_weather(event_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    record = await weather_service.get_or_fetch_event_weather(db, event)
    return WeatherForecastSchema(
        date=record.forecast_date.strftime("%Y-%m-%d") if record.forecast_date else event.event_date.strftime("%Y-%m-%d"),
        condition=record.condition,
        temperature=record.temperature,
        feels_like=record.feels_like,
        humidity=record.humidity,
        rain_probability=record.rain_probability,
        wind_speed=record.wind_speed,
        impact_score=record.impact_score,
        advisory=record.advisory,
        advisory_message=record.advisory_message,
    )
