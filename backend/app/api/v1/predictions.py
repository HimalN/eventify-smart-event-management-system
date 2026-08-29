"""Predictions API endpoints."""

from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_organizer
from app.models.user import User
from app.models.event import Event
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services import prediction_service

router = APIRouter(tags=["Predictions"])


@router.post("/predict", response_model=PredictionResponse)
def run_what_if_prediction(request: PredictionRequest, current_user: User = Depends(require_organizer)):
    """Run a 'what-if' attendance simulation using various input parameters."""
    # Build params dictionary for the service
    params = request.model_dump(exclude_unset=True)
    
    # Run the prediction simulator
    res = prediction_service.run_prediction(params)
    return res


@router.get("/predictions/{event_id}", response_model=PredictionResponse)
def get_event_prediction(event_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    # Query latest prediction from DB
    pred_db = (
        db.query(Prediction)
        .filter(Prediction.event_id == event_id)
        .order_by(Prediction.generated_at.desc())
        .first()
    )
    if not pred_db:
        raise HTTPException(status_code=404, detail="No predictions found for this event")
        
    ev = db.query(Event).filter(Event.id == event_id).first()
    title = ev.title if ev else "Event"
    
    # Parse feature weights and insights
    weights = []
    if pred_db.feature_weights_json:
        try:
            weights = json.loads(pred_db.feature_weights_json)
        except Exception:
            pass
            
    insights = []
    if pred_db.insights_json:
        try:
            insights = json.loads(pred_db.insights_json)
        except Exception:
            pass

    return PredictionResponse(
        event_id=event_id,
        event_title=title,
        model_name=pred_db.model_name,
        predicted_attendance=pred_db.predicted_attendance,
        expected_attendance=pred_db.expected_attendance or 0,
        current_registrations=pred_db.current_registrations or 0,
        difference=pred_db.difference or 0,
        confidence_score=pred_db.confidence_score or 0.0,
        generated_at=pred_db.generated_at.strftime("%H:%M"),
        feature_weights=weights,
        insights=insights,
    )
