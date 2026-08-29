"""Seed database with initial organizer, participant, event, task, and evaluation data."""

from __future__ import annotations

import os
import sys
import json
import pandas as pd
from datetime import datetime, date, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session

# Add backend directory to path if run as a script directly
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

from app.core.config import settings
from app.core.security import hash_password
from app.database.connection import SessionLocal, engine
from app.database.base import Base
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.weather import WeatherRecord
from app.models.prediction import Prediction
from app.models.model_evaluation import ModelEvaluation
from app.models.notification import Notification
from app.models.activity import Activity
from app.models.task import Task
from app.models.report import Report


def seed_database() -> None:
    print("Recreating database tables...")
    from app.database.connection import create_database_if_not_exists
    create_database_if_not_exists()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding users...")
        # 1. Admin
        admin = User(
            name="Himal Nimsara",
            email="himalnimsara88@gmail.com",
            password_hash=hash_password("Himal213344"),
            role="admin",
            department="Computer Science",
            status="active",
            avatar_hue=120,
        )
        # 2. Organizer
        organizer = User(
            name="Kasun Fernando",
            email="kasun.fernando@university.edu",
            password_hash=hash_password("demo1234"),
            role="organizer",
            department="Events Office",
            status="active",
            avatar_hue=45,
        )
        organizer2 = User(
            name="Prof. Aisha Rahman",
            email="aisha.rahman@university.edu",
            password_hash=hash_password("demo1234"),
            role="organizer",
            department="Engineering",
            status="active",
            avatar_hue=280,
        )
        # 3. Participant
        participant = User(
            name="Meera Nair",
            email="meera.nair@university.edu",
            password_hash=hash_password("demo1234"),
            role="participant",
            department="Design",
            status="active",
            avatar_hue=210,
        )
        participant2 = User(
            name="Amara Jayasinghe",
            email="amara.jayasinghe@university.edu",
            password_hash=hash_password("demo1234"),
            role="participant",
            department="Computer Science",
            status="active",
            avatar_hue=340,
        )
        
        db.add_all([admin, organizer, organizer2, participant, participant2])
        db.commit()
        db.refresh(admin)
        db.refresh(organizer)
        db.refresh(organizer2)
        db.refresh(participant)
        db.refresh(participant2)

        print("Seeding model evaluations benchmarks...")
        # Read from benchmark.json if exists
        bench_path = Path("app/ml/models/benchmark.json")
        evals = []
        if bench_path.exists():
            with open(bench_path) as f:
                benchmarks = json.load(f)
            for b in benchmarks:
                evals.append(ModelEvaluation(
                    id=b["id"],
                    name=b["name"],
                    mae=b["mae"],
                    rmse=b["rmse"],
                    r2_score=b["r2Score"],
                    training_time_ms=b["trainingTimeMs"],
                    is_best_model=b["isBestModel"],
                    description=b["description"],
                    production_status="production" if b["isBestModel"] else "candidate",
                ))
        else:
            # Default fallbacks
            evals = [
                ModelEvaluation(name="XGBoost", mae=12.4, rmse=16.1, r2_score=0.946, training_time_ms=1420, is_best_model=True, description="Extreme Gradient Boosting model.", production_status="production"),
                ModelEvaluation(name="Gradient Boosting Regression", mae=14.9, rmse=19.2, r2_score=0.928, training_time_ms=1180, is_best_model=False, description="Sequential additive boosting model.", production_status="candidate"),
                ModelEvaluation(name="Random Forest Regression", mae=16.8, rmse=21.5, r2_score=0.912, training_time_ms=890, is_best_model=False, description="Ensemble of bagging decision trees.", production_status="candidate"),
                ModelEvaluation(name="Decision Tree Regression", mae=26.4, rmse=33.1, r2_score=0.815, training_time_ms=240, is_best_model=False, description="Single decision tree.", production_status="candidate"),
                ModelEvaluation(name="Linear Regression", mae=34.2, rmse=42.8, r2_score=0.742, training_time_ms=80, is_best_model=False, description="OLS baseline model.", production_status="candidate"),
            ]
        db.add_all(evals)
        db.commit()

        print("Seeding events, registrations, weather, and predictions from dataset...")
        dataset_path = Path("app/ml/datasets/smart_event_attendance_dataset.csv")
        if not dataset_path.exists():
            print(f"Dataset not found at {dataset_path}, falling back to mock events")
            events_data = [
                {"title": "AI & Robotics Summit", "category": "Conference", "venue_type": "indoor", "offset": 5, "capacity": 300},
                {"title": "Cloud Native Workshop", "category": "Workshop", "venue_type": "indoor", "offset": -3, "capacity": 150}
            ]
            df_events = pd.DataFrame(events_data)
        else:
            df_events = pd.read_csv(dataset_path)

        for i, row in df_events.iterrows():
            if not dataset_path.exists():
                break

            # Parse event date
            ev_date = datetime.strptime(row["event_date"], "%Y-%m-%d").date()
            status = "completed" if pd.notna(row["actual_attendance"]) else "upcoming"
            capacity = int(row["venue_capacity"])
            
            # Use random subset of titles if we want, or generate a decent title
            title = f"{row['event_type']} in {row['location']} - {ev_date.strftime('%b %Y')}"

            # Formulate event
            event = Event(
                id=row["event_id"],
                title=title,
                description=f"An amazing {row['event_type']} organized in {row['location']}.",
                location=row["location"],
                venue_type="indoor" if capacity < 1000 else "outdoor", # Simple heuristic
                category=row["event_type"],
                event_date=ev_date,
                start_time="09:00",
                end_time="17:00",
                capacity=capacity,
                expected_attendance=int(row["previous_event_attendance"]),
                current_registrations=int(row["registered_attendees"]),
                organizer_id=organizer.id if i % 2 == 0 else organizer2.id,
                organizer_name=organizer.name if i % 2 == 0 else organizer2.name,
                target_audience="General",
                registration_deadline=ev_date - timedelta(days=2),
                banner_hue=(i * 45) % 360,
                status=status,
                predicted_attendance=int(row["registered_attendees"] * (row["attendance_rate_pct"]/100)) if status == "completed" else int(row["registered_attendees"] * 0.8),
                confidence=95.0,
                model_used="Gradient Boosting Regression",
                actual_attendance=int(row["actual_attendance"]) if pd.notna(row["actual_attendance"]) else None,
            )
            db.add(event)
            db.commit()
            db.refresh(event)

            # Weather
            weather = WeatherRecord(
                event_id=event.id,
                forecast_date=event.event_date,
                condition=row["weather_condition"],
                temperature=float(row["temperature_c"]),
                feels_like=float(row["temperature_c"]) + 1.0,
                humidity=float(row["humidity_pct"]),
                rain_probability=float(row["rainfall_mm"]) * 10,
                wind_speed=float(row["wind_speed_kmh"]),
                impact_score=40.0 if row["weather_condition"] == "Clear" else 85.0,
                advisory="attention_required" if row["rainfall_mm"] > 5 else "favorable",
                advisory_message="Prepare for weather." if row["rainfall_mm"] > 5 else "Favorable clear weather conditions.",
            )
            db.add(weather)

            # Prediction
            prediction = Prediction(
                event_id=event.id,
                model_name="Gradient Boosting Regression",
                predicted_attendance=event.predicted_attendance,
                expected_attendance=event.expected_attendance,
                current_registrations=event.current_registrations,
                difference=event.predicted_attendance - event.current_registrations,
                confidence_score=95.0,
                feature_weights_json=json.dumps([
                    {"feature": "Registrations", "weight": 40},
                    {"feature": "Weather", "weight": 20},
                    {"feature": "Promotion", "weight": 15},
                ]),
                insights_json=json.dumps([
                    {
                        "id": "ins-cap",
                        "category": "catering",
                        "priority": "medium",
                        "title": "Catering Sizing",
                        "message": "Based on predicted turnout.",
                        "recommendation": "Confirm catering headcount portions.",
                    }
                ]),
            )
            db.add(prediction)

            # Tasks
            task = Task(
                title=f"Confirm catering count based on predicted {event.predicted_attendance} attendees",
                description="Double check volunteer list and ensure dietary preferences are accommodated.",
                priority="high" if i % 2 == 0 else "medium",
                due_date=event.event_date,
                due_label="Upcoming",
                status="completed" if status == "completed" else "pending",
                event_id=event.id,
                assigned_user_id=event.organizer_id,
            )
            db.add(task)

            # Registration for participants
            reg = Registration(
                event_id=event.id,
                participant_id=participant.id if i % 2 == 0 else participant2.id,
                participant_name=participant.name if i % 2 == 0 else participant2.name,
                participant_email=participant.email if i % 2 == 0 else participant2.email,
                ticket_code=f"SEMS-{event.id[-3:].upper()}-{1000 + i}",
                registration_date=ev_date - timedelta(days=5),
                confirmation_status="confirmed",
                attendance_status="attended" if status == "completed" else "pending",
            )
            db.add(reg)

        print("Seeding notifications, activities, and reports...")
        # Notifications
        db.add_all([
            Notification(user_id=organizer.id, type="reminder", title="Upcoming Event Reminder", body="AI & Robotics Summit starts in 2 days at the Main Auditorium.", read=False),
            Notification(user_id=organizer.id, type="weather", title="Weather Advisory Alert", body="80% rain probability forecast for Open Air Amphitheatre on Cultural Night. Attention required.", read=False),
            Notification(user_id=organizer.id, type="prediction", title="ML Attendance Forecast Updated", body="XGBoost model refined predicted attendance for Graduate Career Fair to 312.", read=True),
        ])

        # Activities
        db.add_all([
            Activity(actor="Kasun Fernando", action="created event", target="Startup Pitch Day"),
            Activity(actor="System ML Engine", action="evaluated models", target="5 Regression Algorithms (Best: XGBoost)"),
            Activity(actor="Meera Nair", action="registered for", target="Data Science Bootcamp"),
        ])

        # Reports
        db.add_all([
            Report(name="Attendance Prediction & Model Evaluation Report", period="August 2026", records_count=1284, report_type="Attendance Report"),
            Report(name="Participant Registration Summary", period="Q3 2026", records_count=3417, report_type="Registration Report"),
            Report(name="Weather Impact & Contingency Analysis", period="August 2026", records_count=210, report_type="Weather Report"),
        ])

        db.commit()
        print("Database seeded successfully!")
    except Exception as exc:
        db.rollback()
        print(f"Error seeding database: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
