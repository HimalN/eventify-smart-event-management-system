"""Unit tests for the planning insights generator logic."""

from __future__ import annotations

from app.services.insight_service import generate_planning_insights


def test_capacity_warning():
    # Predicted attendance is close to capacity -> high priority capacity risk
    insights = generate_planning_insights(
        predicted=290,
        registered=250,
        capacity=300,
        weather={"rain_probability": 10.0, "condition": "Sunny", "advisory": "favorable"},
        venue_type="indoor",
    )
    
    cap_warnings = [i for i in insights if i["category"] == "capacity"]
    assert len(cap_warnings) > 0
    assert cap_warnings[0]["priority"] == "high"


def test_weather_contingency_outdoor():
    # Outdoor event + high rain probability -> weather warning
    insights = generate_planning_insights(
        predicted=150,
        registered=120,
        capacity=200,
        weather={"rain_probability": 75.0, "condition": "Rain", "advisory": "attention_required"},
        venue_type="outdoor",
    )
    
    weather_warnings = [i for i in insights if i["category"] == "weather_contingency"]
    assert len(weather_warnings) > 0
    assert weather_warnings[0]["priority"] == "high"
    assert "indoor" in weather_warnings[0]["recommendation"].lower()
