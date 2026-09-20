"""Events management API endpoints."""

from __future__ import annotations

import json
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import List, Optional, Union

from app.core.dependencies import get_db, require_organizer, get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.weather import WeatherRecord
from app.models.prediction import Prediction
from app.schemas.event import (
    EventResponse,
    EventCreate,
    EventUpdate,
    WeatherForecastSchema,
    PlanningInsightSchema,
    PaginatedEventsResponse,
)
from app.services import event_service
from app.services.insight_service import generate_planning_insights

router = APIRouter(prefix="/events", tags=["Events"])



def map_db_event_to_response(db: Session, event: Event) -> EventResponse:
    # Fetch weather record
    weather_db = (
        db.query(WeatherRecord)
        .filter(WeatherRecord.event_id == event.id)
        .order_by(WeatherRecord.recorded_at.desc())
        .first()
    )
    weather_schema = None
    if weather_db:
        weather_schema = WeatherForecastSchema(
            date=weather_db.forecast_date.strftime("%Y-%m-%d") if weather_db.forecast_date else event.event_date.strftime("%Y-%m-%d"),
            condition=weather_db.condition or "Partly Cloudy",
            temperature=weather_db.temperature or 28.0,
            feels_like=weather_db.feels_like or (weather_db.temperature or 28.0) + 2,
            humidity=weather_db.humidity or 70.0,
            rain_probability=weather_db.rain_probability or 25.0,
            wind_speed=weather_db.wind_speed or 10.0,
            impact_score=weather_db.impact_score or 88.0,
            advisory=weather_db.advisory or "favorable",
            advisory_message=weather_db.advisory_message or "Favorable weather predicted for event day.",
        )
    else:
        # Default mock weather if not fetched
        weather_schema = WeatherForecastSchema(
            date=event.event_date.strftime("%Y-%m-%d"),
            condition="Partly Cloudy",
            temperature=28.0,
            humidity=70.0,
            rain_probability=25.0,
            wind_speed=10.0,
            impact_score=88.0,
            advisory="favorable",
            advisory_message="Favorable weather predicted for event day.",
        )

    # Fetch planning insights from latest prediction
    pred_db = (
        db.query(Prediction)
        .filter(Prediction.event_id == event.id)
        .order_by(Prediction.generated_at.desc())
        .first()
    )
    planning_insights = []
    if pred_db and pred_db.insights_json:
        try:
            insights_list = json.loads(pred_db.insights_json)
            planning_insights = [PlanningInsightSchema(**ins) for ins in insights_list]
        except Exception:
            pass
            
    if not planning_insights:
        # Generate dynamically on the fly
        weather_dict = {
            "rain_probability": weather_schema.rain_probability,
            "advisory": weather_schema.advisory,
            "condition": weather_schema.condition,
        }
        pred_val = event.predicted_attendance or int(event.expected_attendance or event.capacity * 0.75)
        insights_list = generate_planning_insights(
            pred_val, event.current_registrations, event.capacity, weather_dict, event.venue_type
        )
        planning_insights = [PlanningInsightSchema(**ins) for ins in insights_list]

    # Map status value (support upcoming mappings for front-end compatibility)
    # The frontend expects status to match: draft | upcoming | ongoing | completed | cancelled
    # Let's ensure it is one of these
    status_val = event.status
    if status_val in ("scheduled", "registration_open", "registration_closed"):
        status_val = "upcoming"

    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description or "",
        location=event.location or "",
        venue_type=event.venue_type,
        category=event.category,
        date=event.event_date.strftime("%Y-%m-%d"),
        start_time=event.start_time or "09:00",
        end_time=event.end_time or "17:00",
        capacity=event.capacity,
        expected_attendance=event.expected_attendance,
        current_registrations=event.current_registrations,
        predicted_attendance=event.predicted_attendance,
        confidence=event.confidence,
        actual_attendance=event.actual_attendance,
        status=status_val,
        organizer=event.organizer_name or "Events Office",
        target_audience=event.target_audience or "Campus Community",
        registration_deadline=event.registration_deadline.strftime("%Y-%m-%d") if event.registration_deadline else event.event_date.strftime("%Y-%m-%d"),
        banner_hue=event.banner_hue or 0,
        weather=weather_schema,
        model_used=event.model_used or "XGBoost",
        planning_insights=planning_insights,
    )


@router.get("/categories", response_model=List[str])
def get_event_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch distinct event categories for filter dropdowns."""
    results = db.query(Event.category).distinct().all()
    categories = [r[0] for r in results if r[0]]
    if not categories:
        categories = ["Workshop", "Conference", "Hackathon", "Seminar", "Sports", "Cultural", "Webinar"]
    return sorted(list(set(categories)))


@router.get("", response_model=Union[PaginatedEventsResponse, List[EventResponse]])
def get_events(
    page: Optional[int] = Query(default=None, ge=1),
    limit: Optional[int] = Query(default=None, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    sort_by: Optional[str] = Query(default="date"),
    order: Optional[str] = Query(default="asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Event)

    # Search filter (title, location, description, category)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Event.title.ilike(term),
                Event.location.ilike(term),
                Event.description.ilike(term),
                Event.category.ilike(term),
            )
        )

    # Category filter
    if category and category.strip() and category.lower() != "all":
        query = query.filter(Event.category.ilike(category.strip()))

    # Status filter
    if status and status.strip() and status.lower() != "all":
        # Handle status mappings
        if status.lower() == "upcoming":
            query = query.filter(Event.status.in_(["upcoming", "scheduled", "registration_open", "registration_closed"]))
        else:
            query = query.filter(Event.status.ilike(status.strip()))

    # Sorting
    sort_col = Event.event_date
    if sort_by == "title":
        sort_col = Event.title
    elif sort_by == "created_at":
        sort_col = Event.created_at
    elif sort_by == "capacity":
        sort_col = Event.capacity
    elif sort_by == "predicted_attendance":
        sort_col = Event.predicted_attendance

    if order == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    # If page is specified, return paginated response
    if page is not None:
        page_size = limit if limit is not None else 9
        total_count = query.count()
        total_pages = max(1, math.ceil(total_count / page_size)) if total_count > 0 else 1
        
        events_db = query.offset((page - 1) * page_size).limit(page_size).all()
        items = [map_db_event_to_response(db, e) for e in events_db]

        return PaginatedEventsResponse(
            items=items,
            total=total_count,
            page=page,
            limit=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

    # If pagination is not requested, return list of all matching items
    events_db = query.all()
    return [map_db_event_to_response(db, e) for e in events_db]


@router.get("/{id}", response_model=EventResponse)
def get_event(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = event_service.get_event(db, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return map_db_event_to_response(db, event)



@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(request: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    try:
        # Pass user details for organizer fields
        event = await event_service.create_event(
            db, request.model_dump(), organizer_id=current_user.id, organizer_name=current_user.name
        )
        return map_db_event_to_response(db, event)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/{id}", response_model=EventResponse)
async def update_event(id: str, request: EventUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    # Check if user is owner or admin
    event = event_service.get_event(db, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if current_user.role != "admin" and event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this event")

    updated = await event_service.update_event(db, id, request.model_dump(exclude_unset=True), actor_name=current_user.name)
    return map_db_event_to_response(db, updated)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(id: str, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    event = event_service.get_event(db, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if current_user.role != "admin" and event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this event")

    success = event_service.delete_event(db, id, actor_name=current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return None
