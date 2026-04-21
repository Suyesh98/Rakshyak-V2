import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.services.bomb_detection_service import stream_bomb_detections

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bomb-detection", tags=["Bomb Detection"])


@router.websocket("/detect")
async def bomb_detect(
    websocket: WebSocket,
    token: str = Query(...),
    confidence: float = Query(default=0.4, ge=0.1, le=0.95),
    camera_url: str = Query(default=None),
):
    """
    WebSocket endpoint for real-time bomb detection via Roboflow hosted API.
    Streams: JSON metadata + binary JPEG frames with bomb bounding boxes.
    """
    await websocket.accept()

    try:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            await websocket.send_json({"type": "error", "message": "Invalid or expired token."})
            await websocket.close(code=4001)
            return

        user_id = payload.get("sub")
        logger.info(f"Bomb detection stream started for user: {user_id}")

        await stream_bomb_detections(
            websocket,
            confidence=confidence,
            camera_url=camera_url,
        )

    except WebSocketDisconnect:
        logger.info("Client disconnected from bomb detection stream.")
    except Exception as e:
        logger.error(f"Bomb detection stream error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
