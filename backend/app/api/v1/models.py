"""ML Models API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_organizer
from app.models.user import User
from app.schemas.analytics import ModelEvaluationSchema
from app.services.prediction_service import load_benchmark
from app.models.model_evaluation import ModelEvaluation

router = APIRouter(prefix="/models", tags=["ML Models"])


@router.get("/benchmark", response_model=List[ModelEvaluationSchema])
def get_model_benchmark(db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    """Fetch model evaluation benchmark comparison metrics for all 5 models."""
    evals = db.query(ModelEvaluation).all()
    results = []
    for ev in evals:
        results.append(ModelEvaluationSchema(
            id=ev.id,
            name=ev.name,
            mae=ev.mae,
            rmse=ev.rmse,
            r2_score=ev.r2_score,
            training_time_ms=ev.training_time_ms or 0,
            is_best_model=ev.is_best_model,
            description=ev.description or "",
        ))
        
    if not results:
        # Fallback to local files
        benchmarks = load_benchmark()
        for b in benchmarks:
            results.append(ModelEvaluationSchema(
                id=b.get("id", f"mod-{b['name'][:3].lower()}"),
                name=b["name"],
                mae=b["mae"],
                rmse=b["rmse"],
                r2_score=b["r2_score"],
                training_time_ms=b.get("training_time_ms", 100),
                is_best_model=b.get("is_best_model", False),
                description=b.get("description", ""),
            ))
            
    return results
