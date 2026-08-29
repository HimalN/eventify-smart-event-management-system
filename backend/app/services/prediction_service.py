"""Prediction service — loads ML models and runs predictions."""

from __future__ import annotations

import json
import logging
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd

from app.core.config import settings
from app.services.insight_service import generate_planning_insights

logger = logging.getLogger("sems.prediction")

# Cache loaded model and preprocessor in memory
_model_cache: Dict[str, Any] = {}
_preprocessor_cache: Any = None
_benchmark_cache: Optional[List[Dict[str, Any]]] = None

MODEL_DISPLAY_NAMES = {
    "linear_regression": "Linear Regression",
    "decision_tree": "Decision Tree Regression",
    "random_forest": "Random Forest Regression",
    "gradient_boosting": "Gradient Boosting Regression",
    "xgboost": "XGBoost",
}

FEATURE_COLUMNS = [
    "venue_capacity", "ticket_price_lkr", "promotion_days", 
    "registered_attendees", "social_media_reach", "previous_event_attendance", 
    "temperature_c", "humidity_pct", "rainfall_mm", "wind_speed_kmh", 
    "duration_hours", "is_weekend", "is_public_holiday",
    "event_type_encoded", "location_encoded", "weather_condition_encoded", "day_of_week_encoded"
]

FEATURE_IMPORTANCE_LABELS = [
    "Historical Attendance Trend",
    "Weather Severity (Rain, Temp, Wind)",
    "Registration & Social Media Reach",
    "Event Category & Logistics",
    "Time & Scheduling (Duration, Holidays)",
    "Financial (Ticket Price & Promotions)"
]


def _get_model_dir() -> Path:
    return Path(settings.MODEL_PATH)


def _load_model(model_name: str) -> Any:
    """Load a trained model from disk, with caching."""
    if model_name in _model_cache:
        return _model_cache[model_name]

    model_dir = _get_model_dir()
    # Try exact filename first, then normalise
    fname = model_name.lower().replace(" ", "_").replace("regression", "").strip("_")
    # Map display names to file names
    name_to_file = {
        "linear regression": "linear_regression",
        "decision tree regression": "decision_tree",
        "random forest regression": "random_forest",
        "gradient boosting regression": "gradient_boosting",
        "xgboost": "xgboost",
    }
    file_key = name_to_file.get(model_name.lower(), fname)
    path = model_dir / f"{file_key}.joblib"

    if not path.exists():
        logger.warning("Model file not found: %s", path)
        return None

    try:
        model = joblib.load(path)
        _model_cache[model_name] = model
        logger.info("Loaded model: %s", path)
        return model
    except Exception as exc:
        logger.warning("Failed to load model file %s: %s. Using heuristic/fallback predictions.", path, exc)
        return None


def _load_preprocessor() -> Any:
    global _preprocessor_cache
    if _preprocessor_cache is not None:
        return _preprocessor_cache

    path = _get_model_dir() / "preprocessor.joblib"
    if path.exists():
        try:
            _preprocessor_cache = joblib.load(path)
            return _preprocessor_cache
        except Exception as exc:
            logger.warning("Failed to load preprocessor: %s", exc)
            return None
    return None


def load_benchmark() -> List[Dict[str, Any]]:
    """Load model benchmark results from benchmark.json."""
    global _benchmark_cache
    if _benchmark_cache is not None:
        return _benchmark_cache

    path = _get_model_dir() / "benchmark.json"
    if path.exists():
        with open(path) as f:
            _benchmark_cache = json.load(f)
        return _benchmark_cache

    # Return empty if no benchmark file exists
    return []


def clear_caches() -> None:
    """Clear all loaded model caches (used after retraining)."""
    global _model_cache, _preprocessor_cache, _benchmark_cache
    _model_cache = {}
    _preprocessor_cache = None
    _benchmark_cache = None


def get_best_model_name() -> str:
    """Return the name of the best model from benchmark results."""
    benchmarks = load_benchmark()
    for b in benchmarks:
        if b.get("is_best_model"):
            return b["name"]
    return "XGBoost"


def prepare_features(params: Dict[str, Any]) -> np.ndarray:
    """Prepare feature vector from prediction request parameters."""
    df_params = {
        "venue_capacity": params.get("venue_capacity", 500),
        "ticket_price_lkr": params.get("ticket_price_lkr", 1000.0),
        "promotion_days": params.get("promotion_days", 30),
        "registered_attendees": params.get("registered_attendees", 0),
        "social_media_reach": params.get("social_media_reach", 1000),
        "previous_event_attendance": params.get("previous_event_attendance", 0),
        "temperature_c": params.get("temperature_c", 28.0),
        "humidity_pct": params.get("humidity_pct", 75.0),
        "rainfall_mm": params.get("rainfall_mm", 0.0),
        "wind_speed_kmh": params.get("wind_speed_kmh", 10.0),
        "duration_hours": params.get("duration_hours", 4.0),
        "is_weekend": params.get("is_weekend", 0),
        "is_public_holiday": params.get("is_public_holiday", 0),
        "event_type": params.get("event_type", "Workshop"),
        "location": params.get("location", "Colombo"),
        "weather_condition": params.get("weather_condition", "Clear"),
        "day_of_week": params.get("day_of_week", 2),
    }

    df = pd.DataFrame([df_params])
    features = None

    preprocessor = _load_preprocessor()
    if preprocessor is not None:
        try:
            features = preprocessor.transform(df)
        except Exception as e:
            logger.warning("Preprocessor transform failed: %s", e)
    
    if features is None:
        # Fallback raw features if preprocessor fails (not recommended)
        features = np.zeros((1, len(FEATURE_COLUMNS)))

    return features


def run_prediction(params: Dict[str, Any]) -> Dict[str, Any]:
    """Run ML prediction and generate insights.

    Returns a dict matching the PredictionResponse schema.
    """
    model_name = params.get("model_name") or get_best_model_name()
    model = _load_model(model_name)

    features = prepare_features(params)

    if model is not None:
        try:
            raw_pred = model.predict(features)[0]
            predicted = max(0, int(round(raw_pred)))
        except Exception as e:
            logger.error("Model prediction failed: %s", e)
            predicted = _fallback_prediction(params)
    else:
        predicted = _fallback_prediction(params)

    expected = params.get("previous_event_attendance", 0) or params.get("venue_capacity", 500)
    current_reg = params.get("registered_attendees", 0)
    capacity = params.get("venue_capacity", 500)
    difference = predicted - current_reg

    # Confidence: use model R² from benchmark if available, else heuristic
    confidence = _get_model_confidence(model_name)

    # Feature weights
    feature_weights = _get_feature_weights(model, model_name)

    weather_dict = {
        "rain_probability": params.get("rainfall_mm", 0) * 10,
        "condition": params.get("weather_condition", "Clear"),
        "advisory": _rain_to_advisory(params.get("rainfall_mm", 0) * 10),
    }

    insights = generate_planning_insights(
        predicted, current_reg, capacity, weather_dict,
        "indoor" if capacity < 1000 else "outdoor",
    )

    return {
        "event_id": params.get("event_id", "custom"),
        "event_title": params.get("event_title", "Custom Scenario"),
        "model_name": model_name,
        "predicted_attendance": predicted,
        "expected_attendance": expected,
        "current_registrations": current_reg,
        "difference": difference,
        "confidence_score": confidence,
        "generated_at": datetime.now(timezone.utc).strftime("%H:%M"),
        "feature_weights": feature_weights,
        "insights": insights,
    }


def _fallback_prediction(params: Dict[str, Any]) -> int:
    """Simple heuristic prediction when no ML model is available."""
    baseline = params.get("previous_event_attendance", 200) or params.get("venue_capacity", 500) * 0.75
    rain_penalty = min(params.get("rainfall_mm", 0.0) * 0.02, 0.25)
    promo_boost = (params.get("promotion_days", 30) / 100) * 0.2
    venue_type = "indoor" if params.get("venue_capacity", 500) < 1000 else "outdoor"
    venue_factor = 1 - rain_penalty * 1.5 if venue_type == "outdoor" else 1 - rain_penalty * 0.6
    predicted = int(round(baseline * venue_factor * (1 + promo_boost) * 0.92))
    return max(10, predicted)


def _get_model_confidence(model_name: str) -> float:
    """Get confidence score from benchmark R² value."""
    benchmarks = load_benchmark()
    for b in benchmarks:
        if b["name"] == model_name:
            return round(b.get("r2_score", 0.85) * 100, 1)

    # Heuristic fallbacks
    confidence_map = {
        "XGBoost": 95, "Gradient Boosting Regression": 93,
        "Random Forest Regression": 90, "Decision Tree Regression": 82,
        "Linear Regression": 75,
    }
    return confidence_map.get(model_name, 85)


def _get_feature_weights(model: Any, model_name: str) -> List[Dict[str, Any]]:
    """Extract feature importance from the model."""
    if model is not None and hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        # Group into the 6 high-level categories
        grouped = _group_feature_importances(importances)
        return [{"feature": k, "weight": round(v, 1)} for k, v in grouped.items()]
    elif model is not None and hasattr(model, "coef_"):
        coefs = np.abs(model.coef_)
        grouped = _group_feature_importances(coefs / max(coefs.sum(), 1e-10) * 100)
        return [{"feature": k, "weight": round(v, 1)} for k, v in grouped.items()]

    # Default weights matching frontend
    return [
        {"feature": "Historical Attendance Trend", "weight": 32},
        {"feature": "Rain Probability & Weather Severity", "weight": 26},
        {"feature": "Registration Velocity & Cumulative Sign-ups", "weight": 19},
        {"feature": "Event Category & Target Audience", "weight": 11},
        {"feature": "Day of Week & Time Slot", "weight": 8},
        {"feature": "Venue Type (Indoor vs Outdoor)", "weight": 4},
    ]


def _group_feature_importances(importances: np.ndarray) -> Dict[str, float]:
    total = max(importances.sum(), 1e-10)
    pct = (importances / total) * 100
    
    n = min(len(pct), 17)
    p = np.zeros(17)
    p[:n] = pct[:n]

    return {
        "Historical Attendance Trend": round(float(p[5]), 1),
        "Weather Severity (Rain, Temp, Wind)": round(float(p[6] + p[7] + p[8] + p[9] + p[15]), 1),
        "Registration & Social Media Reach": round(float(p[3] + p[4]), 1),
        "Event Category & Logistics": round(float(p[0] + p[13] + p[14]), 1),
        "Time & Scheduling (Duration, Holidays)": round(float(p[10] + p[11] + p[12] + p[16]), 1),
        "Financial (Ticket Price & Promotions)": round(float(p[1] + p[2]), 1),
    }


def _rain_to_condition(rain_prob: float) -> str:
    if rain_prob > 60:
        return "Rain"
    if rain_prob > 30:
        return "Partly Cloudy"
    return "Sunny"


def _rain_to_advisory(rain_prob: float) -> str:
    if rain_prob > 65:
        return "attention_required"
    if rain_prob > 35:
        return "moderate"
    return "favorable"
