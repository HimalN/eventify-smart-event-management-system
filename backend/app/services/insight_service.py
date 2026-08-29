"""Planning insights generator.

Generates actionable insights from prediction results, weather data, and event parameters.
"""

from __future__ import annotations

import math
from typing import List, Dict, Any


def generate_planning_insights(
    predicted: int,
    registered: int,
    capacity: int,
    weather: Dict[str, Any],
    venue_type: str,
) -> List[Dict[str, Any]]:
    """Generate planning insights matching the frontend PlanningInsight interface."""
    insights: List[Dict[str, Any]] = []
    delta = predicted - registered
    fill_rate = predicted / max(capacity, 1)

    # ── Capacity insight ──
    if fill_rate > 0.9:
        insights.append({
            "id": "ins-cap",
            "category": "capacity",
            "priority": "high",
            "title": "Capacity Nearing Limit",
            "message": f"Predicted attendance ({predicted}) reaches {math.floor(fill_rate * 100)}% of venue capacity ({capacity}).",
            "recommendation": "Open overflow seating tier or schedule an overflow streaming room.",
        })
    elif delta > 30:
        insights.append({
            "id": "ins-cap-exp",
            "category": "capacity",
            "priority": "medium",
            "title": "Expected Walk-in Surplus",
            "message": f"Model predicts {predicted} attendees vs {registered} confirmed registrations (+{delta} walk-in turnout).",
            "recommendation": "Ensure 15-20% additional seating and registration desk lanes are prepared.",
        })

    # ── Catering insight ──
    catering_headcount = math.ceil(predicted * 1.05)
    insights.append({
        "id": "ins-cat",
        "category": "catering",
        "priority": "medium",
        "title": "Catering Headcount Recommendation",
        "message": f"Based on predicted {predicted} attendees, target refreshment quantity for {catering_headcount} portions.",
        "recommendation": f"Confirm catering order for ~{catering_headcount} pax to minimize waste while avoiding shortages.",
    })

    # ── Weather contingency ──
    rain_prob = weather.get("rain_probability", weather.get("rainProbability", 0))
    advisory = weather.get("advisory", "favorable")
    condition = weather.get("condition", "Partly Cloudy")

    if advisory == "attention_required" or (venue_type == "outdoor" and rain_prob > 40):
        insights.append({
            "id": "ins-wea",
            "category": "weather_contingency",
            "priority": "high",
            "title": "Weather Contingency Required",
            "message": f"{rain_prob:.0f}% rain forecasted on event day ({condition}). Outdoor/hybrid operations at high risk.",
            "recommendation": (
                "Switch event venue to indoor backup hall (Block C) immediately."
                if venue_type == "outdoor"
                else "Deploy entrance canopy shelter and alert building facilities for wet-weather flow."
            ),
        })
    else:
        insights.append({
            "id": "ins-wea-fav",
            "category": "weather_contingency",
            "priority": "low",
            "title": "Favorable Weather Forecast",
            "message": f"Expected {condition} with low rain risk ({rain_prob:.0f}%).",
            "recommendation": "No adverse weather mitigation necessary. Proceed with standard logistics.",
        })

    # ── Staffing insight ──
    staff_needed = max(3, math.ceil(predicted / 50))
    insights.append({
        "id": "ins-stf",
        "category": "staffing",
        "priority": "low",
        "title": "Support Staff & Volunteer Sizing",
        "message": f"Optimal ratio indicates {staff_needed} student volunteers/ushers required for {predicted} attendees.",
        "recommendation": f"Assign {math.ceil(staff_needed * 0.4)} volunteers to check-in desks and {math.ceil(staff_needed * 0.6)} to hall coordination.",
    })

    return insights
