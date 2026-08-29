"""Unit tests for password hashing and JWT helper functions."""

from __future__ import annotations

from app.core.security import hash_password, verify_password, create_access_token, decode_token


def test_password_hashing():
    pwd = "supersecretpassword123"
    hashed = hash_password(pwd)
    
    assert hashed != pwd
    assert verify_password(pwd, hashed)
    assert not verify_password("wrongpassword", hashed)


def test_jwt_generation_and_decoding():
    payload = {"sub": "user-123", "role": "admin"}
    token = create_access_token(payload)
    
    assert isinstance(token, str)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-123"
    assert decoded["role"] == "admin"
