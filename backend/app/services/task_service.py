"""Task management service for organizers."""

from __future__ import annotations

from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.activity import Activity

def get_tasks(db: Session, event_id: str | None = None, assigned_user_id: str | None = None) -> list[Task]:
    query = db.query(Task)
    if event_id:
        query = query.filter(Task.event_id == event_id)
    if assigned_user_id:
        query = query.filter(Task.assigned_user_id == assigned_user_id)
    return query.order_by(Task.due_date.asc()).all()

def create_task(db: Session, title: str, description: str | None, priority: str, due_date: date | str | None, event_id: str | None, assigned_user_id: str | None, actor_name: str) -> Task:
    due = None
    if due_date:
        due = datetime.strptime(due_date, "%Y-%m-%d").date() if isinstance(due_date, str) else due_date

    # Determine due label
    due_label = "Soon"
    if due:
        today = date.today()
        delta = (due - today).days
        if delta == 0:
            due_label = "Today"
        elif delta == 1:
            due_label = "Tomorrow"
        elif delta > 1:
            due_label = f"In {delta} days"

    task = Task(
        title=title,
        description=description,
        priority=priority,
        due_date=due,
        due_label=due_label,
        status="pending",
        event_id=event_id,
        assigned_user_id=assigned_user_id,
    )
    db.add(task)
    
    act = Activity(
        actor=actor_name,
        action="created task",
        target=title,
        resource_id=event_id,
    )
    db.add(act)
    db.commit()
    db.refresh(task)
    return task

def update_task(db: Session, task_id: str, data: dict, actor_name: str) -> Task | None:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return None
        
    for field in ["title", "description", "priority", "status"]:
        if field in data and data[field] is not None:
            setattr(task, field, data[field])

    if "due_date" in data and data["due_date"] is not None:
        task.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date() if isinstance(data["due_date"], str) else data["due_date"]
        # Recalculate due label
        delta = (task.due_date - date.today()).days
        if delta == 0:
            task.due_label = "Today"
        elif delta == 1:
            task.due_label = "Tomorrow"
        elif delta > 1:
            task.due_label = f"In {delta} days"
        else:
            task.due_label = "Overdue"

    act = Activity(
        actor=actor_name,
        action="updated task",
        target=task.title,
        resource_id=task.id,
    )
    db.add(act)
    db.commit()
    db.refresh(task)
    return task
