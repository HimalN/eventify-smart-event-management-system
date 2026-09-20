"""Ticket code generator — SEMS-XXX-XXXX format."""

import secrets
import string


def generate_ticket_code(event_id: str) -> str:
    """Generate a unique ticket code in SEMS-XXX-XXXX format."""
    # Extract last 3 chars from event_id or generate 3 random digits
    clean_id = "".join(c for c in event_id if c.isalnum())
    suffix = clean_id[-3:].upper() if len(clean_id) >= 3 else "".join(secrets.choice(string.digits) for _ in range(3))
    # Ensure suffix is 3 characters
    suffix = suffix.zfill(3)[:3]
    # 4-character random numeric/uppercase serial with high entropy
    chars = string.digits + "ABCDEFGHJKLMNPQRSTUVWXYZ"  # excluded easily confused I, O
    serial = "".join(secrets.choice(chars) for _ in range(4))
    return f"SEMS-{suffix}-{serial}"
