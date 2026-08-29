"""Historical events API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_organizer
from app.models.user import User
from app.schemas.analytics import HistoricalEventSchema
from app.services.analytics_service import get_dashboard_analytics

router = APIRouter(prefix="/historical-events", tags=["Historical Data"])


@router.get("", response_model=List[HistoricalEventSchema])
def get_historical_events(db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Fetch completed historical events with ground-truth attendance and accuracy metrics."""
    data = get_dashboard_analytics(db)
    return data["historicalEvents"]
