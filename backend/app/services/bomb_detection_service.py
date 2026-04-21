import cv2
import base64
import asyncio
import logging
import collections
import httpx
from app.core.config import settings
from app.services.yolo_service import IPCameraStream

logger = logging.getLogger(__name__)

ROBOFLOW_URL = "https://detect.roboflow.com"
BOMB_BOX_COLOR = (0, 0, 255)
LABEL_BG_COLOR = (0, 0, 255)
LABEL_TEXT_COLOR = (255, 255, 255)

# Number of Roboflow requests in flight at once. Masks per-call latency so
# throughput = N / latency. 4 is a good balance for the hosted tier.
CONCURRENT_REQUESTS = 4
# Downscale frames before base64 encoding to cut upload size + server-side resize cost.
INFER_MAX_DIM = 640


def _resize_for_inference(frame):
    """Scale frame so the long side is INFER_MAX_DIM. Roboflow resizes internally anyway."""
    h, w = frame.shape[:2]
    long_side = max(h, w)
    if long_side <= INFER_MAX_DIM:
        return frame, 1.0
    scale = INFER_MAX_DIM / long_side
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA), scale


async def _infer_frame(client: httpx.AsyncClient, frame, confidence: float):
    """POST a frame to Roboflow hosted inference API. Returns predictions scaled to original size."""
    small, scale = _resize_for_inference(frame)
    _, buf = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 75])
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

    url = f"{ROBOFLOW_URL}/{settings.ROBOFLOW_MODEL_ID}"
    params = {
        "api_key": settings.ROBOFLOW_API_KEY,
        "confidence": int(confidence * 100),
    }
    resp = await client.post(
        url,
        params=params,
        content=b64,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp.raise_for_status()
    predictions = resp.json().get("predictions", [])

    # Scale predictions back to original frame dimensions
    if scale != 1.0 and scale > 0:
        inv = 1.0 / scale
        for p in predictions:
            p["x"] *= inv
            p["y"] *= inv
            p["width"] *= inv
            p["height"] *= inv

    return predictions


def _draw_predictions(frame, predictions):
    for p in predictions:
        x, y = p["x"], p["y"]
        w, h = p["width"], p["height"]
        x1 = int(x - w / 2)
        y1 = int(y - h / 2)
        x2 = int(x + w / 2)
        y2 = int(y + h / 2)

        cv2.rectangle(frame, (x1, y1), (x2, y2), BOMB_BOX_COLOR, 2)

        label = f"{p['class']} {p['confidence'] * 100:.1f}%"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 6, y1), LABEL_BG_COLOR, -1)
        cv2.putText(
            frame, label, (x1 + 3, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.55, LABEL_TEXT_COLOR, 1, cv2.LINE_AA,
        )
    return frame


async def _send_result(websocket, frame, predictions, frame_id, on_frame_detections):
    """Draw boxes, encode, and push one frame + metadata over the WebSocket."""
    _draw_predictions(frame, predictions)

    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    frame_bytes = buffer.tobytes()

    class_names = [p["class"] for p in predictions]
    confidences = [round(float(p["confidence"]), 2) for p in predictions]
    bomb_detected = any(
        p["class"].lower() == "bomb" and p["confidence"] >= 0  # already filtered by API
        for p in predictions
    )

    if on_frame_detections:
        on_frame_detections(class_names, confidences)

    await websocket.send_json({
        "type": "frame",
        "frame_id": frame_id,
        "detections": len(predictions),
        "classes": class_names,
        "confidences": confidences,
        "bomb_detected": bomb_detected,
        "size": len(frame_bytes),
    })
    await websocket.send_bytes(frame_bytes)


async def stream_bomb_detections(
    websocket,
    confidence: float = 0.4,
    camera_url: str = None,
    on_frame_detections=None,
):
    """Stream pipelined Roboflow bomb detections to a WebSocket client."""
    if not settings.ROBOFLOW_API_KEY:
        await websocket.send_json({
            "type": "error",
            "message": "ROBOFLOW_API_KEY not configured on server.",
        })
        return

    cam_url = camera_url if camera_url else settings.IP_CAM_URL
    camera = IPCameraStream(cam_url)

    if not camera.connect():
        await websocket.send_json({
            "type": "error",
            "message": "Failed to connect to IP camera. Check URL.",
        })
        return

    await websocket.send_json({
        "type": "connected",
        "message": "Bomb detection stream started",
        "confidence": confidence,
        "model": settings.ROBOFLOW_MODEL_ID,
    })

    frame_count = 0
    in_flight = collections.deque()  # (frame, frame_id, task)

    limits = httpx.Limits(max_connections=CONCURRENT_REQUESTS * 2, max_keepalive_connections=CONCURRENT_REQUESTS)
    async with httpx.AsyncClient(timeout=15.0, limits=limits, http2=False) as client:
        try:
            while True:
                # Refill pipeline up to CONCURRENT_REQUESTS
                while len(in_flight) < CONCURRENT_REQUESTS:
                    frame = camera.read_frame()
                    if frame is None:
                        break
                    task = asyncio.create_task(_infer_frame(client, frame, confidence))
                    in_flight.append((frame, frame_count, task))
                    frame_count += 1

                if not in_flight:
                    logger.warning("No frames available, attempting camera reconnect...")
                    await websocket.send_json({
                        "type": "warning",
                        "message": "Stream lost, reconnecting...",
                    })
                    await asyncio.sleep(2)
                    if not camera.connect():
                        break
                    continue

                # Await oldest in-flight task (preserves frame order)
                frame, fid, task = in_flight.popleft()
                try:
                    predictions = await task
                except httpx.HTTPError as e:
                    logger.error(f"Roboflow API error on frame {fid}: {e}")
                    await websocket.send_json({
                        "type": "warning",
                        "message": f"Inference call failed: {e}",
                    })
                    continue
                except Exception as e:
                    logger.error(f"Inference task error on frame {fid}: {e}")
                    continue

                await _send_result(websocket, frame, predictions, fid, on_frame_detections)

        except Exception as e:
            logger.error(f"Bomb detection streaming error: {e}")
            try:
                await websocket.send_json({"type": "error", "message": str(e)})
            except Exception:
                pass
        finally:
            # Cancel any in-flight tasks on shutdown
            for _, _, task in in_flight:
                task.cancel()
            camera.release()
            logger.info("Bomb detection stream ended, camera released.")
