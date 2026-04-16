import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.services.yolo_service import stream_yolo_detections
from app.services.detection_store import (
    start_session, record_frame_detections, end_session, save_detections,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/realtime", tags=["Real-Time Detection"])


@router.websocket("/detect")
async def realtime_detect(
    websocket: WebSocket,
    token: str = Query(...),
    confidence: float = Query(default=0.45, ge=0.1, le=0.95),
    camera_url: str = Query(default=None),
):
    """
    WebSocket endpoint for real-time YOLO object detection.
    Streams: JSON metadata + binary JPEG frames.
    Persists every detection and tracks the session lifetime.
    """
    await websocket.accept()

    session_id = None
    try:
        # Validate JWT
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            await websocket.send_json({"type": "error", "message": "Invalid or expired token."})
            await websocket.close(code=4001)
            return

        user_id = payload.get("sub")
        logger.info(f"Surveillance stream started for user: {user_id}")

        # Start a tracked session
        session_id = start_session(user_id, confidence)

        # Stream detections — the callback persists each frame's results
        await stream_yolo_detections(
            websocket,
            confidence=confidence,
            camera_url=camera_url,
            on_frame_detections=lambda classes, confs: _handle_frame(session_id, classes, confs),
        )

    except WebSocketDisconnect:
        logger.info("Client disconnected from surveillance stream.")
    except Exception as e:
        logger.error(f"Surveillance stream error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        if session_id:
            end_session(session_id)
        try:
            await websocket.close()
        except Exception:
            pass


def _handle_frame(session_id: str, classes: list[str], confidences: list[float]):
    """Called for every frame — persists detections and updates session."""
    from datetime import datetime, timezone

    record_frame_detections(session_id, classes, confidences)

    if classes:
        now = datetime.now(timezone.utc).isoformat()
        logs = []
        for cls, conf in zip(classes, confidences):
            logs.append({
                "id": f"{session_id}-{now}-{cls}",
                "timestamp": now,
                "class": cls,
                "confidence": conf,
                "session_id": session_id,
            })
        save_detections(logs)
