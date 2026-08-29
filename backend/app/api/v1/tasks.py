"""Tasks API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import Field

from app.core.dependencies import get_db, require_organizer
from app.models.user import User
from app.schemas.base import CamelModel
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class TaskResponse(CamelModel):
    id: str
    title: str
    due: str
    priority: str  # high | medium | low
    status: str = "pending"
    event_id: Optional[str] = None


class TaskCreate(CamelModel):
    title: str
    description: Optional[str] = ""
    priority: str = "medium"
    due_date: Optional[str] = None
    event_id: Optional[str] = None


class TaskUpdate(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None


@router.get("", response_model=List[TaskResponse])
def get_tasks(event_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Fetch preparation tasks."""
    tasks = task_service.get_tasks(db, event_id=event_id, assigned_user_id=current_user.id)
    return [
        TaskResponse(
            id=t.id,
            title=t.title,
            due=t.due_label or (t.due_date.strftime("%Y-%m-%d") if t.due_date else "Soon"),
            priority=t.priority,
            status=t.status,
            event_id=t.event_id,
        )
        for t in tasks
    ]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(request: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    task = task_service.create_task(
        db,
        title=request.title,
        description=request.description,
        priority=request.priority,
        due_date=request.due_date,
        event_id=request.event_id,
        assigned_user_id=current_user.id,
        actor_name=current_user.name,
    )
    return TaskResponse(
        id=task.id,
        title=task.title,
        due=task.due_label or "Soon",
        priority=task.priority,
        status=task.status,
        event_id=task.event_id,
    )


@router.put("/{id}", response_model=TaskResponse)
def update_task(id: str, request: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    task = task_service.update_task(db, id, request.model_dump(exclude_unset=True), actor_name=current_user.name)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(
        id=task.id,
        title=task.title,
        due=task.due_label or "Soon",
        priority=task.priority,
        status=task.status,
        event_id=task.event_id,
    )
