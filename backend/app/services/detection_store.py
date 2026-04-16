"""
Persistent storage for detection logs and streaming sessions.
Data is saved to JSON files so the Dashboard can display accurate,
real detection history instead of random demo data.
"""

import json
import os
import uuid
import logging
from datetime import datetime, timezone
from threading import Lock

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DETECTIONS_FILE = os.path.join(DATA_DIR, "detections.json")
SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")

_lock = Lock()


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def _read_json(path: str) -> list:
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _write_json(path: str, data: list):
    _ensure_data_dir()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


# --------------- Detection Logs ---------------

def save_detections(detections: list[dict]):
    """Append a batch of detection records to storage."""
    if not detections:
        return
    with _lock:
        existing = _read_json(DETECTIONS_FILE)
        existing.extend(detections)
        _write_json(DETECTIONS_FILE, existing)


def get_detections() -> list[dict]:
    """Return all stored detection logs."""
    with _lock:
        return _read_json(DETECTIONS_FILE)


def clear_detections():
    with _lock:
        _write_json(DETECTIONS_FILE, [])


# --------------- Sessions ---------------

_active_sessions: dict[str, dict] = {}


def start_session(user_id: str, confidence: float) -> str:
    """Create a new session and return its ID."""
    session_id = str(uuid.uuid4())[:8]
    _active_sessions[session_id] = {
        "id": session_id,
        "user_id": user_id,
        "startTime": datetime.now(timezone.utc).isoformat(),
        "confidence": confidence,
        "totalDetections": 0,
        "classCounts": {},
        "status": "active",
    }
    logger.info(f"Session {session_id} started for user {user_id}")
    return session_id


def record_frame_detections(session_id: str, classes: list[str], confidences: list[float]):
    """Record detections from a single frame into the active session."""
    session = _active_sessions.get(session_id)
    if not session:
        return
    session["totalDetections"] += len(classes)
    for cls in classes:
        session["classCounts"][cls] = session["classCounts"].get(cls, 0) + 1


def end_session(session_id: str) -> dict | None:
    """End an active session, persist it, and return the completed record."""
    session = _active_sessions.pop(session_id, None)
    if not session:
        return None

    start = datetime.fromisoformat(session["startTime"])
    end = datetime.now(timezone.utc)
    duration_seconds = int((end - start).total_seconds())

    completed = {
        "id": session["id"],
        "user_id": session["user_id"],
        "startTime": session["startTime"],
        "endTime": end.isoformat(),
        "duration": duration_seconds,
        "totalDetections": session["totalDetections"],
        "uniqueClasses": len(session["classCounts"]),
        "classCounts": session["classCounts"],
        "avgConfidence": session["confidence"],
        "status": "completed",
    }

    with _lock:
        sessions = _read_json(SESSIONS_FILE)
        sessions.append(completed)
        _write_json(SESSIONS_FILE, sessions)

    logger.info(f"Session {session_id} ended — {duration_seconds}s, {completed['totalDetections']} detections")
    return completed


def get_sessions() -> list[dict]:
    """Return all stored sessions (completed + active)."""
    with _lock:
        stored = _read_json(SESSIONS_FILE)
    # Append currently active sessions
    for s in _active_sessions.values():
        start = datetime.fromisoformat(s["startTime"])
        now = datetime.now(timezone.utc)
        stored.append({
            **s,
            "endTime": None,
            "duration": int((now - start).total_seconds()),
            "uniqueClasses": len(s["classCounts"]),
        })
    stored.sort(key=lambda x: x["startTime"], reverse=True)
    return stored


def delete_session(session_id: str) -> bool:
    """Delete a session by ID."""
    with _lock:
        sessions = _read_json(SESSIONS_FILE)
        filtered = [s for s in sessions if s["id"] != session_id]
        if len(filtered) == len(sessions):
            return False
        _write_json(SESSIONS_FILE, filtered)
    return True
