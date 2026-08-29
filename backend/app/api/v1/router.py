"""Master router grouping all v1 sub-routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    activities,
    analytics,
    auth,
    events,
    historical_events,
    models,
    notifications,
    predictions,
    registrations,
    reports,
    tasks,
    users,
    weather,
)

router = APIRouter()

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(events.router)
router.include_router(registrations.router)
router.include_router(predictions.router)
router.include_router(models.router)
router.include_router(weather.router)
router.include_router(historical_events.router)
router.include_router(analytics.router)
router.include_router(notifications.router)
router.include_router(activities.router)
router.include_router(tasks.router)
router.include_router(reports.router)
