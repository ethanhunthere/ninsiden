"""Shared utility helpers."""
import json
import re
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_event(
    event_type: str,
    title: str,
    description: str,
    payload: dict | None = None,
) -> str:
    """Serialise a trace event as an SSE data line."""
    data = {
        "type": event_type,
        "title": title,
        "description": description,
        "payload": payload or {},
        "timestamp": now_iso(),
    }
    return f"data: {json.dumps(data)}\n\n"


def sanitize_text(text: str) -> str:
    """Remove control characters that could break SSE framing."""
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
