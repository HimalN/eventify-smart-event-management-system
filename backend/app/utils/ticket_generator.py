"""Ticket code generator — SEMS-XXX-XXXX format."""

<<<<<<< HEAD
import secrets
=======
from __future__ import annotations
import random
>>>>>>> 1e84df882758a8315a2b307f308c3c92965815ad
import string


def generate_ticket_code(event_id: str) -> str:
    """Generate a unique ticket code in SEMS-XXX-XXXX format."""
<<<<<<< HEAD
    # Extract last 3 chars from event_id or generate 3 random digits
    clean_id = "".join(c for c in event_id if c.isalnum())
    suffix = clean_id[-3:].upper() if len(clean_id) >= 3 else "".join(secrets.choice(string.digits) for _ in range(3))
    # Ensure suffix is 3 characters
    suffix = suffix.zfill(3)[:3]
    # 4-character random numeric/uppercase serial with high entropy
    chars = string.digits + "ABCDEFGHJKLMNPQRSTUVWXYZ"  # excluded easily confused I, O
    serial = "".join(secrets.choice(chars) for _ in range(4))
=======
    # Extract last 3 chars from event_id (or use random)
    suffix = event_id[-3:] if len(event_id) >= 3 else "".join(random.choices(string.digits, k=3))
    # Ensure suffix is alphanumeric digits
    suffix = "".join(c if c.isdigit() else str(ord(c) % 10) for c in suffix)[:3].zfill(3)
    serial = "".join(random.choices(string.digits, k=4))
>>>>>>> 1e84df882758a8315a2b307f308c3c92965815ad
    return f"SEMS-{suffix}-{serial}"
