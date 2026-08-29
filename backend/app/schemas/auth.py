"""Auth request/response schemas."""

from __future__ import annotations
from typing import Optional
from pydantic import EmailStr, Field
from app.schemas.base import CamelModel


class RegisterRequest(CamelModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="participant")
    department: Optional[str] = None


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class TokenResponse(CamelModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserBrief"


class UserBrief(CamelModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None


class RefreshRequest(CamelModel):
    refresh_token: str


class ForgotPasswordRequest(CamelModel):
    email: EmailStr


class ResetPasswordRequest(CamelModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=128)


class MeResponse(CamelModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    status: str = "active"
    avatar_hue: int = 0
