"""Model registry for saving and fetching model checkpoints and metrics."""

from __future__ import annotations

import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import joblib

from app.core.config import settings


def get_model_path(model_name: str, version: str | None = None) -> Path:
    """Resolve full path to a saved model file."""
    model_dir = Path(settings.MODEL_PATH)
    if version:
        model_dir = model_dir / version
    model_dir.mkdir(parents=True, exist_ok=True)
    fname = model_name.lower().replace(" ", "_").replace("regression", "").strip("_")
    return model_dir / f"{fname}.joblib"


def save_model_checkpoint(
    model: Any,
    model_name: str,
    metrics: Dict[str, float],
    feature_list: List[str],
    version: str = "1.0",
) -> None:
    """Save model binary and corresponding metadata."""
    model_dir = Path(settings.MODEL_PATH)
    model_dir.mkdir(parents=True, exist_ok=True)

    # Save joblib binary
    path = get_model_path(model_name)
    joblib.dump(model, path)

    # Update metadata file
    meta_path = model_dir / "metadata.json"
    metadata = {}
    if meta_path.exists():
        try:
            with open(meta_path) as f:
                metadata = json.load(f)
        except Exception:
            pass

    metadata[model_name] = {
        "name": model_name,
        "version": version,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "features": feature_list,
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=4)
