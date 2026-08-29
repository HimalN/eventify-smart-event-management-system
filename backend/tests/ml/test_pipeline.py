"""Tests for the ML preprocessing, dataset loading, and model evaluation pipeline."""

from __future__ import annotations

from pathlib import Path
import pandas as pd
import numpy as np
import pytest

from app.ml.preprocessing import PreprocessingPipeline, FEATURE_COLUMNS
from app.ml.train import generate_synthetic_dataset, train_pipeline


def test_preprocessing_pipeline_transform():
    pipeline = PreprocessingPipeline()
    
    # Create sample raw data frame
    df = pd.DataFrame([{
        "capacity": 100,
        "expected_attendance": 80,
        "current_registrations": 70,
        "registration_velocity": 5.2,
        "historical_attendance": 75,
        "promotion_intensity": 50,
        "temperature": 28.0,
        "humidity": 65.0,
        "rain_probability": 20.0,
        "wind_speed": 10.0,
        "start_hour": 9,
        "day_of_week": 2,
        "category": "Workshop",
        "venue_type": "indoor",
        "target_audience": "Campus Community",
    }])

    # Fit preprocessor
    pipeline.fit(df)
    features = pipeline.transform(df)
    
    assert isinstance(features, np.ndarray)
    assert features.shape == (1, len(FEATURE_COLUMNS))


def test_synthetic_dataset_generation(tmp_path):
    dest = tmp_path / "test_events.csv"
    generate_synthetic_dataset(dest, n_records=50)
    
    assert dest.exists()
    df = pd.read_csv(dest)
    assert len(df) == 50
    assert "actual_attendance" in df.columns
