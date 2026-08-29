"""Main FastAPI application module."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.connection import engine
from app.database.base import Base
from app.api.v1.router import router as api_v1_router
from app.ml.train import train_pipeline

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """ lifespan setup: triggers table creation and ML model checks at startup."""
    logger.info("Starting up Smart Event Management System...")
    
    # Recreate tables if not exists
    try:
        from app.database.connection import create_database_if_not_exists
        create_database_if_not_exists()
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as exc:
        logger.error("Failed to connect or create database tables: %s", exc)

    # Check if models exist. If not, trigger initial training pipeline automatically
    model_dir = settings.model_dir
    xgb_path = model_dir / "xgboost.joblib"
    if not xgb_path.exists():
        logger.info("No trained models found in %s — running initial training pipeline...", model_dir)
        try:
            train_pipeline()
        except Exception as exc:
            logger.error("Initial training pipeline failed: %s", exc)
            
    yield
    logger.info("Shutting down Smart Event Management System...")


app = FastAPI(
    title="Smart Event Management System API",
    description="Backend API for academic capstone - event organization, weather integration & turnout forecasts.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Router ────────────────────────────────────────────────────────────────
app.include_router(api_v1_router, prefix="/api/v1")


# ── Centralized Exception Handler ─────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception occurred: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred.",
            "error_code": "INTERNAL_SERVER_ERROR",
        },
    )


# ── Health Endpoint ───────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    """Verify application health and database connection status."""
    from sqlalchemy.sql import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": str(exc)},
        )
