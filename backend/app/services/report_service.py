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

def generate_report(db: Session, report_type: str, date_from: str | None, date_to: str | None, user_id: str | None) -> dict:
    """Query data, compile records, and return a summary metadata object."""
    from_date = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else date(2026, 1, 1)
    to_date = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else date(2026, 12, 31)

    # Simple count query depending on type
    records_count = 0
    if report_type == "Attendance Report":
        records_count = db.query(Event).filter(Event.event_date.between(from_date, to_date), Event.status == "completed").count()
    elif report_type == "Registration Report":
        records_count = db.query(Registration).filter(Registration.registration_date.between(from_date, to_date)).count()
    elif report_type == "Weather Report":
        records_count = db.query(WeatherRecord).count()
    elif report_type == "Prediction Report":
        records_count = db.query(Prediction).count()
    else:
        records_count = db.query(Event).filter(Event.event_date.between(from_date, to_date)).count()

    report_name = f"{report_type} - {from_date.strftime('%d %b')} to {to_date.strftime('%d %b')}"
    
    report = Report(
        name=report_name,
        period=f"{from_date.strftime('%B %Y')}",
        records_count=records_count,
        report_type=report_type,
        generated_at=datetime.now(timezone.utc),
        created_by=user_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Return standard response
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

    if report_type == "Attendance Report":
        writer.writerow(["Event ID", "Title", "Category", "Date", "Capacity", "Expected Attendance", "Predicted", "Actual", "Accuracy (%)"])
        events = db.query(Event).filter(Event.status == "completed").all()
        for e in events:
            accuracy = 0
            if e.actual_attendance and e.predicted_attendance:
                accuracy = (1 - abs(e.predicted_attendance - e.actual_attendance) / max(e.actual_attendance, 1)) * 100
            writer.writerow([e.id, e.title, e.category, e.event_date, e.capacity, e.expected_attendance, e.predicted_attendance, e.actual_attendance, round(accuracy, 1)])
            
    elif report_type == "Registration Report":
        writer.writerow(["Registration ID", "Event ID", "Participant Name", "Email", "Registered At", "Ticket Code", "Status"])
        regs = db.query(Registration).all()
        for r in regs:
            writer.writerow([r.id, r.event_id, r.participant_name, r.participant_email, r.registration_date, r.ticket_code, r.confirmation_status])
            
    else:
        # Default event summary
        writer.writerow(["Event ID", "Title", "Category", "Date", "Venue Type", "Registrations", "Predicted", "Status"])
        events = db.query(Event).all()
        for e in events:
            writer.writerow([e.id, e.title, e.category, e.event_date, e.venue_type, e.current_registrations, e.predicted_attendance, e.status])

    return output.getvalue()
