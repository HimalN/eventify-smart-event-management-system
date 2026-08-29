"""API integration tests for authentication (registration and login)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_register_and_login_flow(client: TestClient):
    # 1. Register new user
    reg_payload = {
        "name": "Amara Jayasinghe",
        "email": "amara.j@university.edu",
        "password": "securepassword123",
        "role": "participant",
        "department": "Computer Science",
    }
    
    resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["email"] == "amara.j@university.edu"

    # 2. Try to register with duplicate email
    resp_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp_dup.status_code == 400

    # 3. Login
    login_payload = {
        "email": "amara.j@university.edu",
        "password": "securepassword123",
    }
    resp_login = client.post("/api/v1/auth/login", json=login_payload)
    assert resp_login.status_code == 200
    login_data = resp_login.json()
    assert "accessToken" in login_data
    assert login_data["user"]["role"] == "participant"
