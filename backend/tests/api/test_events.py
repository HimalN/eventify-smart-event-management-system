"""API integration tests for events creation, access controls, and prediction triggers."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def _get_auth_headers(client: TestClient, email: str, role: str) -> dict:
    # Register and return authorization headers
    payload = {
        "name": "Test User",
        "email": email,
        "password": "password123",
        "role": role,
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    token = resp.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}


def test_create_event_roles_permissions(client: TestClient):
    # Get tokens
    participant_headers = _get_auth_headers(client, "student@university.edu", "participant")
    organizer_headers = _get_auth_headers(client, "lecturer@university.edu", "organizer")

    event_payload = {
        "title": "Hackathon 2026",
        "description": "Annual programming challenge.",
        "location": "Innovation Lab, Block C",
        "venueType": "indoor",
        "category": "Hackathon",
        "date": "2026-10-15",
        "capacity": 150,
    }

    # 1. Participant tries to create event -> Forbidden (403)
    resp_part = client.post("/api/v1/events", json=event_payload, headers=participant_headers)
    assert resp_part.status_code == 403

    # 2. Organizer creates event -> Created (201) and triggers weather + ML forecasts
    resp_org = client.post("/api/v1/events", json=event_payload, headers=organizer_headers)
    assert resp_org.status_code == 201, resp_org.text
    event_data = resp_org.json()
    assert event_data["title"] == "Hackathon 2026"
    assert event_data["predictedAttendance"] is not None
    assert event_data["weather"] is not None
    assert len(event_data["planningInsights"]) > 0
