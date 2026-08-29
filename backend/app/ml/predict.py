"""Prediction interface linking API parameters to trained model checkpoints."""

from __future__ import annotations

import logging
from typing import Any, Dict
import numpy as np

from app.services.prediction_service import run_prediction

logger = logging.getLogger("sems.ml.predict")

def predict_attendance(params: Dict[str, Any]) -> Dict[str, Any]:
    """Load model and run turnout prediction.

    Wraps the core prediction service.
    """
    return run_prediction(params)
