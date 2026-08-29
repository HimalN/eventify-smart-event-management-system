"""Analytics schemas."""

from __future__ import annotations
from typing import Any, List, Optional
from app.schemas.base import CamelModel


class MonthlyEventStat(CamelModel):
    month: str
    events: int
    completed: int


class AttendanceTrendEntry(CamelModel):
    label: str
    predicted: int
    actual: Optional[int] = None
    expected: int


class RegistrationTrendEntry(CamelModel):
    day: str
    registrations: int
    cancellations: int


class WeatherImpactEntry(CamelModel):
    condition: str
    attendance: float
    events: int


class FeatureImportanceEntry(CamelModel):
    feature: str
    weight: float


class ModelEvaluationSchema(CamelModel):
    id: str
    name: str
    mae: float
    rmse: float
    r2_score: float
    training_time_ms: Optional[int] = None
    is_best_model: bool = False
    description: Optional[str] = None


class HistoricalEventSchema(CamelModel):
    id: str
    title: str
    category: str
    date: str
    venue: str
    venue_type: str
    capacity: int
    registrations: int
    predicted_attendance: int
    actual_attendance: int
    accuracy_rate: float
    weather_condition: str
    rain_probability: float


class AnalyticsResponse(CamelModel):
    monthly_events: List[MonthlyEventStat] = []
    attendance_trend: List[AttendanceTrendEntry] = []
    registration_trends: List[RegistrationTrendEntry] = []
    weather_impact: List[WeatherImpactEntry] = []
    feature_importance: List[FeatureImportanceEntry] = []
    model_evaluations: List[ModelEvaluationSchema] = []
    historical_events: List[HistoricalEventSchema] = []
