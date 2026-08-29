"""Registration schemas."""

from __future__ import annotations
from typing import Optional
from pydantic import EmailStr
from app.schemas.base import CamelModel


class RegistrationResponse(CamelModel):
    id: str
    event_id: str
    event_title: str = ""
    participant: str
    email: str
    registered_at: str
    status: str = "confirmed"
    attendance: str = "pending"
    ticket_code: str


class RegistrationCreate(CamelModel):
    event_id: str
    participant_name: Optional[str] = None
    email: Optional[EmailStr] = None
