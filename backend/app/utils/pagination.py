"""Pagination helper."""

from __future__ import annotations
from typing import Any, Dict, List, TypeVar

T = TypeVar("T")


def paginate(items: List[T], page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """Apply in-memory pagination and return the standard response shape."""
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }
