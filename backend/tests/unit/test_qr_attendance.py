"""Unit tests for QR ticket generation and attendance code extraction."""

import re
from app.utils.ticket_generator import generate_ticket_code


def test_generate_ticket_code_format():
    event_id = "evt-computer-science-001"
    ticket = generate_ticket_code(event_id)
    
    assert ticket.startswith("SEMS-")
    pattern = r"^SEMS-[A-Z0-9]{3}-[A-Z0-9]{4}$"
    assert re.match(pattern, ticket) is not None


def test_generate_ticket_code_uniqueness():
    event_id = "evt-workshop-2026"
    codes = set()
    sample_size = 500
    
    for _ in range(sample_size):
        code = generate_ticket_code(event_id)
        codes.add(code)
        
    assert len(codes) == sample_size, "Generated ticket codes should be collision-free across sample"


def test_ticket_code_regex_extraction():
    regex = r"SEMS-[A-Z0-9]{3}-[A-Z0-9]{4}"
    
    # Test raw code
    raw = "SEMS-001-A48F"
    match = re.search(regex, raw, re.IGNORECASE)
    assert match is not None
    assert match.group(0).upper() == "SEMS-001-A48F"
    
    # Test URL encoded QR payload
    url = "https://eventify.cinec.edu/checkin?ticket=SEMS-ABC-7890&event=ev1"
    match = re.search(regex, url, re.IGNORECASE)
    assert match is not None
    assert match.group(0).upper() == "SEMS-ABC-7890"
