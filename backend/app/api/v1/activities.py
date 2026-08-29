"""Activities API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_organizer
from app.models.user import User
from app.models.activity import Activity
from app.schemas.base import CamelModel

router = APIRouter(prefix="/activities", tags=["Activities"])


class ActivityResponse(CamelModel):
    id: str
    actor: str
    action: str
    target: str
    time: str


@router.get("", response_model=List[ActivityResponse])
def get_activities(db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Fetch system activities / audit logs."""
    acts = db.query(Activity).order_by(Activity.created_at.desc()).limit(50).all()
    return [
        ActivityResponse(
            id=a.id,
            actor=a.actor,
            action=a.action,
            target=a.target or "",
            time=a.created_at.strftime("%H:%M") if a.created_at else "Just now",
        )
        for a in acts
    ]
