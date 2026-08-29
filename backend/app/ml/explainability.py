"""Model explainability and feature importance extraction helpers."""

from __future__ import annotations
import numpy as np
from typing import Any, Dict, List

def get_feature_importance_dict(model: Any, feature_names: List[str]) -> Dict[str, float]:
    """Retrieve absolute feature importances or coefficients from a model."""
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_)
    else:
        # Equal importance fallback
        importances = np.ones(len(feature_names)) / len(feature_names)

    # Normalize to sum to 100
    total = max(importances.sum(), 1e-10)
    scaled_importances = (importances / total) * 100

    return {name: round(float(val), 2) for name, val in zip(feature_names, scaled_importances)}
