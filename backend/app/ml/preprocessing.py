"""Data preprocessing pipeline for the attendance models."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib

logger = logging.getLogger("sems.ml.preprocess")

# Columns must match feature engineering ordering exactly
FEATURE_COLUMNS = [
    "venue_capacity", "ticket_price_lkr", "promotion_days", 
    "registered_attendees", "social_media_reach", "previous_event_attendance", 
    "temperature_c", "humidity_pct", "rainfall_mm", "wind_speed_kmh", 
    "duration_hours", "is_weekend", "is_public_holiday",
    "event_type_encoded", "location_encoded", "weather_condition_encoded", "day_of_week_encoded"
]

class PreprocessingPipeline:
    """Preprocess data for both training and inference consistency."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.event_type_mapping = {
            "Conference": 0, "Workshop": 1, "Seminar": 2, "Hackathon": 3,
            "Sports Event": 4, "Cultural Festival": 5, "Career Fair": 6, 
            "Academic Colloquium": 7, "Religious Event": 8, "Music Festival": 9,
            "University Event": 10, "Exhibition": 11, "School Event": 12, 
            "Community Event": 13, "Perahera": 14
        }
        self.location_mapping = {
            "Galle": 0, "Kegalle": 1, "Nuwara Eliya": 2, "Anuradhapura": 3,
            "Matara": 4, "Ratnapura": 5, "Colombo": 6, "Kandy": 7,
            "Negombo": 8, "Kurunegala": 9
        }
        self.weather_mapping = {
            "Clear": 0, "Sunny": 0, "Partly Cloudy": 1, "Cloudy": 1, "Rain": 2, "Heavy Rain": 3
        }
        self.day_mapping = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }

    def fit(self, df: pd.DataFrame) -> PreprocessingPipeline:
        """Fit any preprocessing transformers (e.g. Scaler)."""
        processed_df = self._encode_and_fill(df)
        X = processed_df[FEATURE_COLUMNS]
        self.scaler.fit(X)
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform input DataFrame to standard features array."""
        processed_df = self._encode_and_fill(df)
        X = processed_df[FEATURE_COLUMNS]
        return self.scaler.transform(X)

    def _encode_and_fill(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values, encoding, and column order validation."""
        df_copy = df.copy()

        # Handle numeric fields
        numeric_cols = [
            "venue_capacity", "ticket_price_lkr", "promotion_days", 
            "registered_attendees", "social_media_reach", "previous_event_attendance", 
            "temperature_c", "humidity_pct", "rainfall_mm", "wind_speed_kmh", 
            "duration_hours", "is_weekend", "is_public_holiday"
        ]
        
        for col in numeric_cols:
            if col not in df_copy.columns:
                df_copy[col] = 0.0
            # Simple fillna
            df_copy[col] = df_copy[col].fillna(0.0).astype(float)

        # Handle encoding
        if "event_type" in df_copy.columns:
            df_copy["event_type_encoded"] = df_copy["event_type"].map(self.event_type_mapping).fillna(0).astype(int)
        else:
            df_copy["event_type_encoded"] = 0
            
        if "location" in df_copy.columns:
            df_copy["location_encoded"] = df_copy["location"].map(self.location_mapping).fillna(6).astype(int) # default to Colombo
        else:
            df_copy["location_encoded"] = 6
            
        if "weather_condition" in df_copy.columns:
            df_copy["weather_condition_encoded"] = df_copy["weather_condition"].map(self.weather_mapping).fillna(0).astype(int)
        else:
            df_copy["weather_condition_encoded"] = 0
            
        if "day_of_week" in df_copy.columns:
            # Handle if it's already an int (from legacy or what-if)
            if pd.api.types.is_integer_dtype(df_copy["day_of_week"]):
                df_copy["day_of_week_encoded"] = df_copy["day_of_week"]
            else:
                df_copy["day_of_week_encoded"] = df_copy["day_of_week"].map(self.day_mapping).fillna(0).astype(int)
        else:
            df_copy["day_of_week_encoded"] = 0

        return df_copy
