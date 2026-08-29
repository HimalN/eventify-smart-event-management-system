"""ML model evaluation / benchmark record."""

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from app.database.base import Base, generate_uuid
from datetime import datetime, timezone


class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), nullable=False)  # Linear Regression | Decision Tree Regression | etc.
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=False)
    training_time_ms = Column(Integer, nullable=True)
    is_best_model = Column(Boolean, nullable=False, default=False)
    description = Column(Text, nullable=True)
    model_version = Column(String(20), nullable=True, default="1.0")
    training_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=True)
    dataset_version = Column(String(50), nullable=True)
    feature_list_json = Column(Text, nullable=True)
    production_status = Column(String(20), nullable=True, default="candidate")  # candidate | production | retired
