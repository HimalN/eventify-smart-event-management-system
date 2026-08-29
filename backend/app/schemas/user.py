"""User schemas."""

from __future__ import annotations
from typing import Optional
from pydantic import EmailStr, Field
from app.schemas.base import CamelModel


class UserResponse(CamelModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    status: str = "active"
    joined_at: Optional[str] = None
    avatar_hue: int = 0


class UserCreate(CamelModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="participant")
    department: Optional[str] = None
    status: str = Field(default="active")


class UserUpdate(CamelModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
