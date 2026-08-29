"""OpenWeatherMap API client.

Uses the free-tier endpoints:
  - Current weather: https://api.openweathermap.org/data/2.5/weather
  - 5-day forecast:  https://api.openweathermap.org/data/2.5/forecast

Falls back to mock data when no API key is configured.
"""

from __future__ import annotations

import json
import logging
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("sems.weather")

OWM_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
OWM_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"


def _map_condition(owm_main: str) -> str:
    """Map OWM condition main text to our frontend-compatible condition."""
    mapping = {
        "Clear": "Sunny",
        "Clouds": "Cloudy",
        "Rain": "Rain",
        "Drizzle": "Rain",
        "Thunderstorm": "Storm",
        "Snow": "Storm",
        "Mist": "Cloudy",
        "Fog": "Cloudy",
        "Haze": "Partly Cloudy",
    }
    return mapping.get(owm_main, "Partly Cloudy")


def _calc_advisory(rain_prob: float, condition: str) -> tuple[str, str]:
    """Calculate weather advisory from rain probability and condition."""
    if rain_prob > 65 or condition in ("Storm",):
        return "attention_required", (
            f"{rain_prob:.0f}% rain probability forecast. "
            "Heavy precipitation likely; activate indoor contingency protocol."
        )
    if rain_prob > 35:
        return "moderate", (
            f"Moderate weather risk ({rain_prob:.0f}% rain, {condition.lower()}). "
            "Monitor updates 24h prior."
        )
    return "favorable", "Favorable clear weather conditions. Optimal for scheduled event operations."


def _calc_impact_score(rain_prob: float, wind_speed: float) -> float:
    """Impact score: 100 = perfect conditions, lower = worse."""
    return max(5.0, 100.0 - rain_prob - min(wind_speed * 0.5, 15))


async def fetch_current_weather(
    lat: float = settings.WEATHER_DEFAULT_LAT,
    lon: float = settings.WEATHER_DEFAULT_LON,
) -> Dict[str, Any]:
    """Fetch current weather from OpenWeatherMap."""
    api_key = settings.OPENWEATHER_API_KEY
    if not api_key:
        logger.info("No OWM API key — returning mock current weather")
        return _mock_current()

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                OWM_CURRENT_URL,
                params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"},
            )
            resp.raise_for_status()
            data = resp.json()

        condition = _map_condition(data.get("weather", [{}])[0].get("main", "Clear"))
        temp = data.get("main", {}).get("temp", 28)
        feels_like = data.get("main", {}).get("feels_like", temp + 2)
        humidity = data.get("main", {}).get("humidity", 70)
        wind = data.get("wind", {}).get("speed", 10)
        rain_prob = data.get("rain", {}).get("1h", 0) / 5.0 * 100 if "rain" in data else (
            humidity * 0.4 if humidity > 70 else humidity * 0.2
        )
        rain_prob = min(rain_prob, 100)
        advisory, advisory_msg = _calc_advisory(rain_prob, condition)

        return {
            "location": "University Main Campus, Colombo",
            "condition": condition,
            "temperature": round(temp, 1),
            "feels_like": round(feels_like, 1),
            "humidity": round(humidity, 1),
            "rain_probability": round(rain_prob, 1),
            "wind_speed": round(wind, 1),
            "impact_score": round(_calc_impact_score(rain_prob, wind), 1),
            "advisory": advisory,
            "advisory_message": advisory_msg,
            "updated": f"Updated just now via OpenWeatherMap API",
            "raw_json": json.dumps(data),
        }
    except Exception as exc:
        logger.warning("OWM current weather API failed: %s — using mock", exc)
        return _mock_current()


async def fetch_forecast(
    lat: float = settings.WEATHER_DEFAULT_LAT,
    lon: float = settings.WEATHER_DEFAULT_LON,
    days: int = 7,
) -> List[Dict[str, Any]]:
    """Fetch multi-day forecast from OWM 5-day/3h endpoint, aggregated by day."""
    api_key = settings.OPENWEATHER_API_KEY
    if not api_key:
        logger.info("No OWM API key — returning mock forecast")
        return _mock_forecast(days)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                OWM_FORECAST_URL,
                params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"},
            )
            resp.raise_for_status()
            data = resp.json()

        # Aggregate by date
        daily: Dict[str, List[Dict]] = {}
        for entry in data.get("list", []):
            dt = datetime.fromtimestamp(entry["dt"], tz=timezone.utc)
            day_str = dt.strftime("%Y-%m-%d")
            daily.setdefault(day_str, []).append(entry)

        results = []
        for day_str in sorted(daily.keys())[:days]:
            entries = daily[day_str]
            avg_temp = sum(e["main"]["temp"] for e in entries) / len(entries)
            avg_hum = sum(e["main"]["humidity"] for e in entries) / len(entries)
            avg_wind = sum(e["wind"]["speed"] for e in entries) / len(entries)
            # Use the most common weather condition
            conditions = [e["weather"][0]["main"] for e in entries if e.get("weather")]
            main_cond = max(set(conditions), key=conditions.count) if conditions else "Clear"
            condition = _map_condition(main_cond)

            # Estimate rain probability from pop (probability of precipitation) field
            pops = [e.get("pop", 0) for e in entries]
            rain_prob = max(pops) * 100 if pops else 0

            advisory, advisory_msg = _calc_advisory(rain_prob, condition)
            feels_like = avg_temp + 3

            results.append({
                "date": day_str,
                "condition": condition,
                "temperature": round(avg_temp, 1),
                "feels_like": round(feels_like, 1),
                "humidity": round(avg_hum, 1),
                "rain_probability": round(rain_prob, 1),
                "wind_speed": round(avg_wind, 1),
                "impact_score": round(_calc_impact_score(rain_prob, avg_wind), 1),
                "advisory": advisory,
                "advisory_message": advisory_msg,
            })

        return results
    except Exception as exc:
        logger.warning("OWM forecast API failed: %s — using mock", exc)
        return _mock_forecast(days)


async def fetch_hourly_timeline(
    lat: float = settings.WEATHER_DEFAULT_LAT,
    lon: float = settings.WEATHER_DEFAULT_LON,
) -> List[Dict[str, Any]]:
    """Return hourly timeline for today (from forecast 3h entries)."""
    api_key = settings.OPENWEATHER_API_KEY
    if not api_key:
        return _mock_timeline()

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                OWM_FORECAST_URL,
                params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric", "cnt": 8},
            )
            resp.raise_for_status()
            data = resp.json()

        timeline = []
        for entry in data.get("list", [])[:8]:
            dt = datetime.fromtimestamp(entry["dt"], tz=timezone.utc)
            pop = entry.get("pop", 0) * 100
            timeline.append({
                "hour": dt.strftime("%H:%M"),
                "temperature": round(entry["main"]["temp"], 1),
                "rain": round(pop, 1),
            })
        return timeline
    except Exception as exc:
        logger.warning("OWM timeline API failed: %s — using mock", exc)
        return _mock_timeline()


# ── Mock fallbacks ────────────────────────────────────────────────────────────

def _mock_current() -> Dict[str, Any]:
    return {
        "location": "University Main Campus, Colombo",
        "condition": "Partly Cloudy",
        "temperature": 29,
        "feels_like": 33,
        "humidity": 74,
        "rain_probability": 35,
        "wind_speed": 12,
        "impact_score": 81,
        "advisory": "moderate",
        "advisory_message": "Moderate weather risk (35% rain, partly cloudy). Monitor outdoor venues.",
        "updated": "Mock data — no API key configured",
        "raw_json": None,
    }


def _mock_forecast(days: int = 7) -> List[Dict[str, Any]]:
    from datetime import timedelta
    base = datetime.now(timezone.utc)
    results = []
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Rain", "Sunny", "Partly Cloudy", "Storm"]
    for i in range(days):
        cond = conditions[i % len(conditions)]
        rain = random.randint(5, 30) if cond in ("Sunny", "Partly Cloudy") else random.randint(40, 90)
        advisory, msg = _calc_advisory(rain, cond)
        results.append({
            "date": (base + timedelta(days=i)).strftime("%Y-%m-%d"),
            "condition": cond,
            "temperature": round(25 + random.random() * 8, 1),
            "feels_like": round(28 + random.random() * 8, 1),
            "humidity": round(50 + random.random() * 40, 1),
            "rain_probability": rain,
            "wind_speed": round(4 + random.random() * 20, 1),
            "impact_score": round(_calc_impact_score(rain, 10), 1),
            "advisory": advisory,
            "advisory_message": msg,
        })
    return results


def _mock_timeline() -> List[Dict[str, Any]]:
    return [
        {"hour": f"{str(8 + i * 2).zfill(2)}:00", "temperature": round(23 + random.random() * 10, 1), "rain": round(5 + random.random() * 60, 1)}
        for i in range(8)
    ]
