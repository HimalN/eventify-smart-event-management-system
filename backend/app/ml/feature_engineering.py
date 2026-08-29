"""Feature engineering helpers for ML pipeline."""

from __future__ import annotations
import pandas as pd

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineer standard feature columns from raw data.

    Returns the engineered DataFrame.
    """
    df_feat = df.copy()

    # Fill default/mock historical average if not present
    if "historical_avg_attendance" not in df_feat.columns:
        if "historical_attendance" in df_feat.columns:
            df_feat["historical_avg_attendance"] = df_feat["historical_attendance"]
        else:
            df_feat["historical_avg_attendance"] = df_feat["expected_attendance"] * 0.85

    # Interaction terms: weather sensitivity impact indicator
    # Outdoor events with high rain probability are penalized
    if "venue_type" in df_feat.columns and "rain_probability" in df_feat.columns:
        is_outdoor = (df_feat["venue_type"] == "outdoor").astype(int)
        df_feat["weather_risk_index"] = is_outdoor * df_feat["rain_probability"]
    else:
        df_feat["weather_risk_index"] = 0.0

    return df_feat
