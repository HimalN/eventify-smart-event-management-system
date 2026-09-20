"""Reports API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db, require_organizer
from app.models.user import User
from app.schemas.base import CamelModel
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportResponse(CamelModel):
    id: str
    name: str
    period: str
    records: int
    generated: str


class ReportGenerateRequest(CamelModel):
    report_type: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None


@router.get("", response_model=List[ReportResponse])
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Fetch all generated reports metadata."""
    reports = report_service.get_reports_list(db)
    return [
        ReportResponse(
            id=r.id,
            name=r.name,
            period=r.period or "August 2026",
            records=r.records_count or 0,
            generated=r.generated_at.strftime("%d %b %Y") if r.generated_at else "Just now",
        )
        for r in reports
    ]


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(request: ReportGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Generate database records analysis report."""
    res = report_service.generate_report(
        db,
        report_type=request.report_type,
        date_from=request.date_from,
        date_to=request.date_to,
        user_id=current_user.id,
    )
    return ReportResponse(
        id=res["id"],
        name=res["name"],
        period=res["period"],
        records=res["records"],
        generated=res["generated"],
    )


@router.get("/export")
def export_csv(report_type: str = "Event Summary", db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Export report as downloadable CSV spreadsheet."""
    csv_data = report_service.export_report_csv(db, report_type)
<<<<<<< HEAD
    filename = f"{report_type.lower().replace(' ', '_')}.csv"
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.delete("/{id}")
def delete_report(id: str, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Delete a generated report."""
    success = report_service.delete_report(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": "Report deleted successfully"}
=======
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type.lower().replace(' ', '_')}.csv"},
    )
>>>>>>> 1e84df882758a8315a2b307f308c3c92965815ad
