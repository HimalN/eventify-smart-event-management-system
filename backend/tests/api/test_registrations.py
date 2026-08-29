"""API integration tests for participant registration logic and duplicate block."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def _get_auth_token(client: TestClient, email: str, role: str) -> str:
    payload = {"name": "Test User", "email": email, "password": "password123", "role": role}
    resp = client.post("/api/v1/auth/register", json=payload)
    return resp.json()["accessToken"]


def test_registration_and_duplicate_prevention(client: TestClient):
    org_token = _get_auth_token(client, "org@university.edu", "organizer")
    part_token = _get_auth_token(client, "part@university.edu", "participant")
    headers_part = {"Authorization": f"Bearer {part_token}"}
    headers_org = {"Authorization": f"Bearer {org_token}"}

    # 1. Create an event
    event_payload = {
        "title": "Robotics Seminar",
        "date": "2026-11-20",
        "capacity": 50,
    }
    event_resp = client.post("/api/v1/events", json=event_payload, headers=headers_org)
    event_id = event_resp.json()["id"]

    # 2. Register participant
    reg_payload = {"eventId": event_id}
    reg_resp = client.post("/api/v1/registrations", json=reg_payload, headers=headers_part)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["ticketCode"].startswith("SEMS-")

    # 3. Duplicate registration -> Bad Request (400)
    dup_resp = client.post("/api/v1/registrations", json=reg_payload, headers=headers_part)
    assert dup_resp.status_code == 400
    assert "already registered" in dup_resp.json()["detail"]
