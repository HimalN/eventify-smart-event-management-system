"""Event CRUD and lifecycle management service."""

from __future__ import annotations

import json
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from app.models.event import Event
from app.models.prediction import Prediction
from app.models.task import Task
from app.models.notification import Notification
from app.models.activity import Activity
from app.services.weather_service import get_or_fetch_event_weather
from app.services.prediction_service import run_prediction

async def get_events(db: Session, status: str | None = None) -> list[Event]:
    query = db.query(Event)
    if status:
        query = query.filter(Event.status == status)
    return query.all()

def get_event(db: Session, event_id: str) -> Event | None:
    return db.query(Event).filter(Event.id == event_id).first()

async def create_event(db: Session, data: dict, organizer_id: str, organizer_name: str) -> Event:
    event_date = datetime.strptime(data["date"], "%Y-%m-%d").date() if isinstance(data["date"], str) else data["date"]
    deadline = None
    if data.get("registration_deadline"):
        deadline = datetime.strptime(data["registration_deadline"], "%Y-%m-%d").date() if isinstance(data["registration_deadline"], str) else data["registration_deadline"]
    else:
        deadline = event_date

    capacity_val = data.get("capacity") or 200
    expected_val = data.get("expected_attendance")
    if expected_val is None:
        expected_val = int(capacity_val * 0.75)

    event = Event(
        title=data["title"],
        description=data.get("description", ""),
        location=data.get("location", "Main Auditorium"),
        venue_type=data.get("venue_type", "indoor"),
        category=data.get("category", "Workshop"),
        event_date=event_date,
        start_time=data.get("start_time", "09:00"),
        end_time=data.get("end_time", "17:00"),
        capacity=capacity_val,
        expected_attendance=expected_val,
        organizer_id=organizer_id,
        organizer_name=organizer_name,
        target_audience=data.get("target_audience", "Campus Community"),
        registration_deadline=deadline,
        banner_hue=hash(data["title"]) % 360,
        status="upcoming",
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # ── Fetch weather forecast and record ──
    weather_record = await get_or_fetch_event_weather(db, event)

    # ── Run ML Attendance Prediction ──
    pred_params = {
        "event_id": event.id,
        "event_title": event.title,
        "category": event.category,
        "venue_type": event.venue_type,
        "capacity": event.capacity,
        "expected_attendance": event.expected_attendance,
        "current_registrations": 0,
        "registration_velocity": 0.0,
        "historical_attendance": (event.expected_attendance or 100) * 0.85,
        "rain_probability": weather_record.rain_probability,
        "temperature": weather_record.temperature,
        "humidity": weather_record.humidity,
        "wind_speed": weather_record.wind_speed,
        "promotion_intensity": 50.0,
        "target_audience": event.target_audience,
        "day_of_week": event.event_date.weekday(),
        "start_hour": int(event.start_time.split(":")[0]) if event.start_time else 9,
    }

    pred_res = run_prediction(pred_params)

    # Save prediction
    prediction = Prediction(
        event_id=event.id,
        model_name=pred_res["model_name"],
        predicted_attendance=pred_res["predicted_attendance"],
        expected_attendance=pred_res["expected_attendance"],
        current_registrations=0,
        difference=pred_res["difference"],
        confidence_score=pred_res["confidence_score"],
        feature_weights_json=json.dumps(pred_res["feature_weights"]),
        insights_json=json.dumps(pred_res["insights"]),
    )
    db.add(prediction)

    # Update event details
    event.predicted_attendance = pred_res["predicted_attendance"]
    event.confidence = pred_res["confidence_score"]
    event.model_used = pred_res["model_name"]
    db.commit()
    db.refresh(event)

    # ── Generate default tasks for organizer based on insights ──
    for insight in pred_res["insights"]:
        task = Task(
            title=insight["title"],
            description=f"{insight['message']}\nRecommendation: {insight['recommendation']}",
            priority=insight["priority"],
            due_date=event.event_date,
            status="pending",
            event_id=event.id,
            assigned_user_id=organizer_id,
        )
        db.add(task)

    # Create notifications and audit logs
    notif = Notification(
        user_id=organizer_id,
        type="prediction",
        title=f"Initial prediction generated for: {event.title}",
        body=f"Predicted turnout: {event.predicted_attendance} (Model: {event.model_used}). Check your dashboard for planning recommendations.",
        read=False,
    )
    db.add(notif)

    act = Activity(
        actor=organizer_name,
        action="created event",
        target=event.title,
        resource_id=event.id,
    )
    db.add(act)
    db.commit()

    return event

async def update_event(db: Session, event_id: str, data: dict, actor_name: str) -> Event | None:
    event = get_event(db, event_id)
    if not event:
        return None

    # Handle update fields
    for field in ["title", "description", "location", "venue_type", "category", "capacity", "expected_attendance", "target_audience", "status"]:
        if field in data and data[field] is not None:
            setattr(event, field, data[field])

    if "date" in data and data["date"] is not None:
        event.event_date = datetime.strptime(data["date"], "%Y-%m-%d").date() if isinstance(data["date"], str) else data["date"]
    if "registration_deadline" in data and data["registration_deadline"] is not None:
        event.registration_deadline = datetime.strptime(data["registration_deadline"], "%Y-%m-%d").date() if isinstance(data["registration_deadline"], str) else data["registration_deadline"]
    if "actual_attendance" in data:
        event.actual_attendance = data["actual_attendance"]
        if event.actual_attendance is not None:
            event.status = "completed"

    db.commit()
    db.refresh(event)

    # Log action
    act = Activity(
        actor=actor_name,
        action="updated event",
        target=event.title,
        resource_id=event.id,
    )
    db.add(act)
    db.commit()

    return event

def delete_event(db: Session, event_id: str, actor_name: str) -> bool:
    event = get_event(db, event_id)
    if not event:
        return False

    title = event.title
    db.delete(event)
    
    act = Activity(
        actor=actor_name,
        action="deleted event",
        target=title,
        resource_id=event_id,
    )
    db.add(act)
    db.commit()
    return True
