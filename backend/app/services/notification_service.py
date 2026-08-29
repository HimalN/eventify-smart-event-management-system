"""Notification service for fetching, reading, and generating warnings."""

from __future__ import annotations

from sqlalchemy.orm import Session
from app.models.notification import Notification

def get_notifications(db: Session, user_id: str | None = None, limit: int = 50) -> list[Notification]:
    query = db.query(Notification)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    return query.order_by(Notification.created_at.desc()).limit(limit).all()

def mark_notification_as_read(db: Session, notification_id: str) -> bool:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        return False
    notif.read = True
    db.commit()
    return True

def create_notification(db: Session, user_id: str | None, type_: str, title: str, body: str) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type_,
        title=title,
        body=body,
        read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
