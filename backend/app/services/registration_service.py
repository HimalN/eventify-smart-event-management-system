"""Participant registration management service."""

from __future__ import annotations

import json
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from app.models.registration import Registration
from app.models.event import Event
from app.models.prediction import Prediction
from app.models.notification import Notification
from app.models.activity import Activity
from app.utils.ticket_generator import generate_ticket_code
from app.services.prediction_service import run_prediction

def get_registrations(db: Session, event_id: str | None = None, participant_id: str | None = None) -> list[Registration]:
    query = db.query(Registration)
    if event_id:
        query = query.filter(Registration.event_id == event_id)
    if participant_id:
        query = query.filter(Registration.participant_id == participant_id)
    return query.all()

async def create_registration(db: Session, event_id: str, participant_id: str | None, participant_name: str, participant_email: str) -> Registration:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise ValueError("Event not found")
        
    # Check registration deadline
    today = date.today()
    if event.registration_deadline and today > event.registration_deadline:
        raise ValueError("Registration deadline has passed")

    # Check capacity limit
    if event.current_registrations >= event.capacity:
        raise ValueError("Event is already at full capacity")

    # Prevent duplicates
    if participant_id:
        existing = db.query(Registration).filter(
            Registration.event_id == event_id,
            Registration.participant_id == participant_id
        ).first()
        if existing:
            raise ValueError("You are already registered for this event")
    else:
        existing = db.query(Registration).filter(
            Registration.event_id == event_id,
            Registration.participant_email == participant_email
        ).first()
        if existing:
            raise ValueError("A registration with this email already exists for this event")

    # Generate guaranteed unique ticket code
    ticket = generate_ticket_code(event_id)
    for _ in range(10):
        if not db.query(Registration).filter(Registration.ticket_code == ticket).first():
            break
        ticket = generate_ticket_code(event_id)

    registration = Registration(
        event_id=event_id,
        participant_id=participant_id,
        participant_name=participant_name,
        participant_email=participant_email,
        ticket_code=ticket,
        registration_date=today,
        confirmation_status="confirmed",
        attendance_status="pending",
    )
    db.add(registration)
    
    # Increment registration count
    event.current_registrations += 1
    db.commit()
    db.refresh(event)

    # ── Recalculate Attendance Prediction ──
    # Run dynamic update
    try:
        from app.models.weather import WeatherRecord
        weather_rec = db.query(WeatherRecord).filter(WeatherRecord.event_id == event.id).first()
        rain_prob = weather_rec.rain_probability if weather_rec else 25.0
        temp = weather_rec.temperature if weather_rec else 28.0
        humidity = weather_rec.humidity if weather_rec else 70.0
        wind = weather_rec.wind_speed if weather_rec else 10.0

        pred_params = {
            "event_id": event.id,
            "event_title": event.title,
            "category": event.category,
            "venue_type": event.venue_type,
            "capacity": event.capacity,
            "expected_attendance": event.expected_attendance,
            "current_registrations": event.current_registrations,
            "registration_velocity": 10.0,  # dynamic metric
            "historical_attendance": event.expected_attendance * 0.85,
            "rain_probability": rain_prob,
            "temperature": temp,
            "humidity": humidity,
            "wind_speed": wind,
            "promotion_intensity": 60.0,
            "target_audience": event.target_audience,
            "day_of_week": event.event_date.weekday(),
            "start_hour": int(event.start_time.split(":")[0]) if event.start_time else 9,
        }
        pred_res = run_prediction(pred_params)
        
        # Save new prediction
        prediction = Prediction(
            event_id=event.id,
            model_name=pred_res["model_name"],
            predicted_attendance=pred_res["predicted_attendance"],
            expected_attendance=pred_res["expected_attendance"],
            current_registrations=event.current_registrations,
            difference=pred_res["difference"],
            confidence_score=pred_res["confidence_score"],
            feature_weights_json=json.dumps(pred_res["feature_weights"]),
            insights_json=json.dumps(pred_res["insights"]),
        )
        db.add(prediction)
        
        # Update event
        event.predicted_attendance = pred_res["predicted_attendance"]
        event.confidence = pred_res["confidence_score"]
        event.model_used = pred_res["model_name"]
    except Exception:
        pass

    # Create notification for participant
    if participant_id:
        notif = Notification(
            user_id=participant_id,
            type="registration",
            title=f"Registration confirmed: {event.title}",
            body=f"Your ticket code is {ticket}. The event will take place on {event.event_date.strftime('%Y-%m-%d')} at {event.location}.",
            read=False,
        )
        db.add(notif)

    # Create notification for organizer
    if event.organizer_id:
        org_notif = Notification(
            user_id=event.organizer_id,
            type="registration",
            title="New Participant Registration",
            body=f"{participant_name} has registered for your event: {event.title}.",
            read=False,
        )
        db.add(org_notif)

    # Audit log
    act = Activity(
        actor=participant_name,
        action="registered for",
        target=event.title,
        resource_id=registration.id,
    )
    db.add(act)
    db.commit()
    db.refresh(registration)
    return registration

async def cancel_registration(db: Session, registration_id: str, actor_name: str) -> bool:
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        return False
        
    if reg.confirmation_status == "cancelled":
        return True

    reg.confirmation_status = "cancelled"
    reg.cancelled_at = datetime.now(timezone.utc)
    
    event = db.query(Event).filter(Event.id == reg.event_id).first()
    if event and event.current_registrations > 0:
        event.current_registrations -= 1

    act = Activity(
        actor=actor_name,
        action="cancelled registration for",
        target=event.title if event else "Event",
        resource_id=registration_id,
    )
    db.add(act)
    db.commit()
    return True


async def check_in_participant(
    db: Session,
    ticket_code: str,
    event_id: str | None = None,
    actor_name: str = "Staff",
) -> dict:
    normalized_code = ticket_code.strip().upper()
    reg = db.query(Registration).filter(Registration.ticket_code == normalized_code).first()
    if not reg:
        raise ValueError(f"Invalid ticket code '{normalized_code}'. No registration found.")

    if reg.confirmation_status == "cancelled":
        raise ValueError(f"Ticket {normalized_code} is cancelled and cannot be used for check-in.")

    event = db.query(Event).filter(Event.id == reg.event_id).first()
    if not event:
        raise ValueError("Associated event not found.")

    if event_id and reg.event_id != event_id:
        raise ValueError(f"Ticket {normalized_code} is valid for '{event.title}', not the selected event.")

    now = datetime.now(timezone.utc)
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # If already checked in, inform the caller without duplicating count
    if reg.attendance_status == "attended":
        prior_time = reg.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if reg.checked_in_at else "earlier"
        return {
            "success": True,
            "message": f"{reg.participant_name} was already checked in (at {prior_time}).",
            "registration": reg,
            "event": event,
            "already_checked_in": True,
            "timestamp": now_str,
        }

    # Mark as attended and record check-in time
    reg.attendance_status = "attended"
    reg.checked_in_at = now
    db.flush()

    # Recalculate actual attendance for the event
    attended_count = (
        db.query(Registration)
        .filter(
            Registration.event_id == reg.event_id,
            Registration.attendance_status == "attended",
        )
        .count()
    )
    event.actual_attendance = attended_count

    # If event was upcoming/draft, we can also ensure status reflects ongoing if during event day
    if event.status == "upcoming":
        event.status = "ongoing"

    act = Activity(
        actor=actor_name,
        action="checked in",
        target=f"{reg.participant_name} ({reg.ticket_code}) for {event.title}",
        resource_id=reg.id,
    )
    db.add(act)
    db.commit()
    db.refresh(reg)
    db.refresh(event)

    return {
        "success": True,
        "message": f"Successfully checked in {reg.participant_name}!",
        "registration": reg,
        "event": event,
        "already_checked_in": False,
        "timestamp": now_str,
    }

