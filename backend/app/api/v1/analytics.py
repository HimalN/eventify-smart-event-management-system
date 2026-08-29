"""Analytics API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_organizer
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import get_dashboard_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Fetch aggregated dataset trends, weather impacts, and model statistics."""
    return get_dashboard_analytics(db)
