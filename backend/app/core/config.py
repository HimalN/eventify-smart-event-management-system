"""Application configuration loaded from environment variables."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration – reads from .env automatically."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = "mysql+pymysql://root:rootpassword@localhost:3306/smart_events_db"
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "smart_events_db"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "rootpassword"

    # ── JWT / Auth ────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── OpenWeatherMap ────────────────────────────────────────────────────
    OPENWEATHER_API_KEY: str = ""
    WEATHER_DEFAULT_LAT: float = 6.9271
    WEATHER_DEFAULT_LON: float = 79.8612

    # ── ML ────────────────────────────────────────────────────────────────
    MODEL_PATH: str = "app/ml/models"

    # ── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:5173","http://localhost:5174"]'

    # ── App ───────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ── Helpers ───────────────────────────────────────────────────────────
    @property
    def cors_origin_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000"]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def model_dir(self) -> Path:
        return Path(self.MODEL_PATH)


settings = Settings()
