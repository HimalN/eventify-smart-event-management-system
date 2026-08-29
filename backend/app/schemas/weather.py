"""Weather schemas."""

from __future__ import annotations
from typing import List, Optional
from app.schemas.base import CamelModel
from app.schemas.event import WeatherForecastSchema


class WeatherTimelineEntry(CamelModel):
    hour: str
    temperature: float
    rain: float


class CurrentWeather(CamelModel):
    location: str = "University Main Campus, Colombo"
    condition: str = "Partly Cloudy"
    temperature: float = 29.0
    feels_like: float = 33.0
    humidity: float = 74.0
    rain_probability: float = 35.0
    wind_speed: float = 12.0
    impact_score: float = 81.0
    advisory: str = "moderate"
    advisory_message: str = ""
    updated: str = ""


class WeatherDataResponse(CamelModel):
    current: CurrentWeather
    forecast: List[WeatherForecastSchema] = []
    timeline: List[WeatherTimelineEntry] = []
