"""Ticket code generator — SEMS-XXX-XXXX format."""

from __future__ import annotations
import random
import string


def generate_ticket_code(event_id: str) -> str:
    """Generate a unique ticket code in SEMS-XXX-XXXX format."""
    # Extract last 3 chars from event_id (or use random)
    suffix = event_id[-3:] if len(event_id) >= 3 else "".join(random.choices(string.digits, k=3))
    # Ensure suffix is alphanumeric digits
    suffix = "".join(c if c.isdigit() else str(ord(c) % 10) for c in suffix)[:3].zfill(3)
    serial = "".join(random.choices(string.digits, k=4))
    return f"SEMS-{suffix}-{serial}"
