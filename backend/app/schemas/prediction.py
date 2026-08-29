"""Prediction schemas."""

from __future__ import annotations
from typing import List, Optional
from app.schemas.base import CamelModel
from app.schemas.event import PlanningInsightSchema


class FeatureWeight(CamelModel):
    feature: str
    weight: float


class PredictionRequest(CamelModel):
    event_id: Optional[str] = None
    event_type: str = "Workshop"
    location: str = "Colombo"
    venue_capacity: int = 500
    ticket_price_lkr: float = 1000.0
    promotion_days: int = 30
    registered_attendees: Optional[int] = None
    social_media_reach: Optional[int] = None
    previous_event_attendance: Optional[int] = None
    temperature_c: Optional[float] = 28.0
    humidity_pct: Optional[float] = 75.0
    rainfall_mm: float = 0.0
    wind_speed_kmh: Optional[float] = 10.0
    weather_condition: str = "Clear"
    day_of_week: Optional[int] = None
    is_weekend: int = 0
    is_public_holiday: int = 0
    duration_hours: float = 4.0
    model_name: Optional[str] = None


class PredictionResponse(CamelModel):
    event_id: str
    event_title: str
    model_name: str
    predicted_attendance: int
    expected_attendance: int
    current_registrations: int
    difference: int
    confidence_score: float
    generated_at: str
    feature_weights: List[FeatureWeight] = []
    insights: List[PlanningInsightSchema] = []
