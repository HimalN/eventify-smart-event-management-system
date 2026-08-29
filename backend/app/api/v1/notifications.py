"""Notifications API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.base import CamelModel
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationResponse(CamelModel):
    id: str
    type: str
    title: str
    body: str
    time: str
    read: bool


@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch notifications for the current authenticated user."""
    notifs = notification_service.get_notifications(db, user_id=current_user.id)
    response_list = []
    for n in notifs:
        response_list.append(NotificationResponse(
            id=n.id,
            type=n.type,
            title=n.title,
            body=n.body or "",
            time=n.created_at.strftime("%H:%M") if n.created_at else "Just now",
            read=n.read,
        ))
    return response_list


@router.put("/{id}/read")
def mark_as_read(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = notification_service.mark_notification_as_read(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}
