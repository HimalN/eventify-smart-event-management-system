"""Event schemas."""

from __future__ import annotations
from typing import List, Optional
from app.schemas.base import CamelModel


class WeatherForecastSchema(CamelModel):
    date: str
    condition: str = "Partly Cloudy"
    temperature: float = 28.0
    feels_like: Optional[float] = None
    humidity: float = 70.0
    rain_probability: float = 25.0
    wind_speed: float = 10.0
    impact_score: float = 88.0
    advisory: str = "favorable"
    advisory_message: str = "Favorable weather predicted for event day."


class PlanningInsightSchema(CamelModel):
    id: str
    category: str  # capacity | catering | staffing | weather_contingency | logistics
    priority: str  # high | medium | low
    title: str
    message: str
    recommendation: str


class EventResponse(CamelModel):
    id: str
    title: str
    description: Optional[str] = ""
    location: Optional[str] = ""
    venue_type: str = "indoor"
    category: str = "Workshop"
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "17:00"
    capacity: int = 200
    expected_attendance: Optional[int] = 150
    current_registrations: int = 0
    predicted_attendance: Optional[int] = None
    confidence: Optional[float] = None
    actual_attendance: Optional[int] = None
    status: str = "upcoming"
    organizer: Optional[str] = None
    target_audience: Optional[str] = None
    registration_deadline: Optional[str] = None
    banner_hue: int = 0
    weather: Optional[WeatherForecastSchema] = None
    model_used: Optional[str] = "XGBoost"
    planning_insights: List[PlanningInsightSchema] = []


class EventCreate(CamelModel):
    title: str
    description: Optional[str] = ""
    location: Optional[str] = "Main Auditorium"
    venue_type: str = "indoor"
    category: str = "Workshop"
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "17:00"
    capacity: int = 200
    expected_attendance: Optional[int] = None
    target_audience: Optional[str] = "Campus Community"
    registration_deadline: Optional[str] = None
    organizer: Optional[str] = None
    status: str = "upcoming"


class EventUpdate(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    venue_type: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    capacity: Optional[int] = None
    expected_attendance: Optional[int] = None
    target_audience: Optional[str] = None
    registration_deadline: Optional[str] = None
    status: Optional[str] = None
    actual_attendance: Optional[int] = None
