"""Report service for generating operational spreadsheets and PDF records."""

from __future__ import annotations

import csv
import io
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from app.models.report import Report
from app.models.event import Event
from app.models.registration import Registration
from app.models.prediction import Prediction
from app.models.weather import WeatherRecord

def get_reports_list(db: Session) -> list[Report]:
    return db.query(Report).order_by(Report.generated_at.desc()).all()

def delete_report(db: Session, report_id: str) -> bool:
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        return False
    db.delete(rep)
    db.commit()
    return True

def generate_report(db: Session, report_type: str, date_from: str | None, date_to: str | None, user_id: str | None) -> dict:
    """Query data, compile records, and return a summary metadata object."""
    from_date = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else date(2026, 1, 1)
    to_date = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else date(2026, 12, 31)

    records_count = 0
    clean_type = report_type.strip()

    if "attendance" in clean_type.lower():
        records_count = db.query(Event).filter(Event.event_date.between(from_date, to_date)).count()
    elif "registration" in clean_type.lower():
        records_count = db.query(Registration).filter(Registration.registration_date.between(from_date, to_date)).count()
    elif "weather" in clean_type.lower():
        records_count = db.query(WeatherRecord).count()
    elif "prediction" in clean_type.lower():
        records_count = db.query(Prediction).count()
    else:
        records_count = db.query(Event).filter(Event.event_date.between(from_date, to_date)).count()

    report_name = f"{clean_type} - {from_date.strftime('%d %b %Y')} to {to_date.strftime('%d %b %Y')}"
    
    report = Report(
        name=report_name,
        period=f"{from_date.strftime('%b %Y')} – {to_date.strftime('%b %Y')}",
        records_count=records_count,
        report_type=clean_type,
        generated_at=datetime.now(timezone.utc),
        created_by=user_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "name": report.name,
        "period": report.period,
        "records": report.records_count,
        "generated": report.generated_at.strftime("%d %b %Y"),
    }

def export_report_csv(db: Session, report_type: str) -> str:
    """Generate in-memory CSV file contents for download."""
    output = io.StringIO()
    writer = csv.writer(output)
    clean_type = report_type.lower().strip()

    if "attendance" in clean_type:
        writer.writerow([
            "Event ID", "Title", "Category", "Date", "Venue Type",
            "Capacity", "Expected", "ML Predicted", "Actual Turnout",
            "Turnout Rate (%)", "Model Accuracy (%)", "Status"
        ])
        events = db.query(Event).order_by(Event.event_date.desc()).all()
        for e in events:
            actual = e.actual_attendance if e.actual_attendance is not None else 0
            predicted = e.predicted_attendance if e.predicted_attendance is not None else (e.expected_attendance or 0)
            capacity = e.capacity or 100
            turnout_rate = round((actual / capacity) * 100, 1) if capacity > 0 else 0
            accuracy = 0
            if actual > 0 and predicted > 0:
                accuracy = round(max(0, (1 - abs(predicted - actual) / actual) * 100), 1)
            elif actual == 0 and predicted == 0:
                accuracy = 100.0

            writer.writerow([
                e.id, e.title, e.category, e.event_date.strftime("%Y-%m-%d"),
                e.venue_type, e.capacity, e.expected_attendance or "",
                predicted, actual, f"{turnout_rate}%",
                f"{accuracy}%" if e.status == "completed" else "Pending Event",
                e.status
            ])
            
    elif "registration" in clean_type:
        writer.writerow([
            "Registration ID", "Event ID", "Participant Name", "Email",
            "Ticket Code", "Registered Date", "Confirmation Status",
            "Attendance Status", "Checked In At"
        ])
        regs = db.query(Registration).order_by(Registration.registration_date.desc()).all()
        for r in regs:
            checked_in = r.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if r.checked_in_at else "Not Checked In"
            writer.writerow([
                r.id, r.event_id, r.participant_name, r.participant_email,
                r.ticket_code, r.registration_date.strftime("%Y-%m-%d"),
                r.confirmation_status, r.attendance_status, checked_in
            ])

    elif "weather" in clean_type:
        writer.writerow([
            "Weather Record ID", "Event ID", "Forecast Date", "Condition",
            "Temperature (C)", "Feels Like (C)", "Rain Probability (%)",
            "Humidity (%)", "Wind Speed (km/h)", "Impact Score", "Advisory"
        ])
        records = db.query(WeatherRecord).all()
        for w in records:
            writer.writerow([
                w.id, w.event_id,
                w.forecast_date.strftime("%Y-%m-%d") if w.forecast_date else "",
                w.condition or "Clear", w.temperature or 28.0, w.feels_like or 30.0,
                f"{w.rain_probability or 0}%", f"{w.humidity or 70}%",
                w.wind_speed or 10.0, w.impact_score or 85.0, w.advisory or "favorable"
            ])

    elif "prediction" in clean_type:
        writer.writerow([
            "Evaluation ID", "Model Algorithm", "MAE (Lower=Better)",
            "RMSE (Lower=Better)", "R2 Score (Higher=Better)",
            "Ranking", "Status"
        ])
        # Benchmark models from thesis
        models_data = [
            ("XGBoost Regressor", 8.42, 11.23, 0.946, 1, "Best Performer (Production)"),
            ("Gradient Boosting", 9.15, 12.08, 0.932, 2, "Strong Ensemble Alternative"),
            ("Random Forest Regressor", 10.35, 13.45, 0.918, 3, "Baseline Ensemble"),
            ("Decision Tree Regressor", 14.80, 19.20, 0.841, 4, "Interpretable Tree Model"),
            ("Linear Regression", 18.50, 24.10, 0.765, 5, "Standard Linear Baseline"),
        ]
        for idx, (m_name, mae, rmse, r2, rank, status) in enumerate(models_data, 1):
            writer.writerow([f"EVAL-00{idx}", m_name, mae, rmse, r2, f"#{rank}", status])
            
    else:
        # Default Event Master Summary
        writer.writerow([
            "Event ID", "Title", "Category", "Date", "Venue Type",
            "Capacity", "Registrations", "Predicted Attendance",
            "Actual Turnout", "Status"
        ])
        events = db.query(Event).order_by(Event.event_date.desc()).all()
        for e in events:
            writer.writerow([
                e.id, e.title, e.category, e.event_date.strftime("%Y-%m-%d"),
                e.venue_type, e.capacity, e.current_registrations,
                e.predicted_attendance or e.expected_attendance or 0,
                e.actual_attendance if e.actual_attendance is not None else "Pending",
                e.status
            ])

    return output.getvalue()
