"""
REST endpoints that serve real detection and session data to the Dashboard.
"""

from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user
from app.services.detection_store import get_detections, get_sessions, delete_session

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/detections")
async def list_detections(user=Depends(get_current_user)):
    """Return all stored detection logs."""
    return get_detections()


@router.get("/sessions")
async def list_sessions(user=Depends(get_current_user)):
    """Return all stored sessions (completed + active)."""
    return get_sessions()


@router.delete("/sessions/{session_id}")
async def remove_session(session_id: str, user=Depends(get_current_user)):
    """Delete a session by ID."""
    if delete_session(session_id):
        return {"detail": "Session deleted"}
    return {"detail": "Session not found"}
