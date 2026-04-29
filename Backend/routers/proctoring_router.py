"""
routers/proctoring_router.py
============================
YOLOv8s cheating-detection endpoint.

POST /detect-cheating   — send a webcam JPEG frame, get back detection signals
GET  /detect-cheating/health — readiness probe (also warms the model)

Model is loaded ONCE at module import so every subsequent request is fast.
If the weights file isn't cached yet, the first call downloads it (~22 MB).
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
import numpy as np
import cv2
import logging
import threading

logger = logging.getLogger("proctoring")

router = APIRouter(tags=["Proctoring"])

# ── Singleton model — loaded once, thread-safe ────────────────────────────────
_model       = None
_model_ready = False          # True once fully loaded
_model_lock  = threading.Lock()
_load_error  = None


def _load_model_sync():
    """Blocking load — call from a background thread at startup."""
    global _model, _model_ready, _load_error
    try:
        from ultralytics import YOLO
        logger.info("[Proctoring] Loading YOLOv8s…")
        m = YOLO("yolov8s.pt")           # downloads on first run, cached after
        # Warm-up inference so the first real request is fast
        dummy = np.zeros((480, 640, 3), np.uint8)
        m(dummy, verbose=False)
        with _model_lock:
            _model       = m
            _model_ready = True
        logger.info("[Proctoring] YOLOv8s ready ✓")
    except Exception as e:
        with _model_lock:
            _load_error = str(e)
        logger.error(f"[Proctoring] Model load failed: {e}")


def _get_model():
    with _model_lock:
        if _model_ready:
            return _model
        if _load_error:
            raise RuntimeError(f"Model failed to load: {_load_error}")
    return None   # still loading


# Kick off the load immediately when this module is imported
_bg = threading.Thread(target=_load_model_sync, daemon=True)
_bg.start()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/detect-cheating/health")
def proctoring_health():
    """Readiness probe. Returns status: 'loading' until the model is ready."""
    with _model_lock:
        if _model_ready:
            return {"status": "ok",      "model": "yolov8s"}
        if _load_error:
            return {"status": "error",   "detail": _load_error}
    return {"status": "loading", "detail": "YOLOv8s weights are still loading…"}


@router.post("/detect-cheating")
async def detect_cheating(frame: UploadFile = File(...)):
    """
    Analyse one webcam JPEG frame with YOLOv8s.

    Returns
    -------
    phoneDetected   : bool  — cell phone visible with confidence ≥ 0.45
    multiplePersons : bool  — 2+ people visible
    personCount     : int
    detections      : list of {label, confidence} for all classes ≥ 0.45
    """
    model = _get_model()
    if model is None:
        # Still loading — tell the frontend gracefully
        return {
            "phoneDetected":   False,
            "multiplePersons": False,
            "personCount":     0,
            "detections":      [],
            "status":          "loading",
        }

    # ── Decode ────────────────────────────────────────────────────────────────
    raw = await frame.read()
    if not raw:
        raise HTTPException(400, "Empty frame")

    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(422, "Cannot decode image — send JPEG or PNG")

    # ── Inference ─────────────────────────────────────────────────────────────
    # Lower phone threshold — catches real phones early.
    # Higher person threshold — reduces phone→person false positives.
    CONF_PERSON = 0.55
    CONF_PHONE  = 0.28

    results = model(img, verbose=False)

    phone_detected = False
    phone_boxes    = []
    person_boxes   = []
    detections     = []

    for r in results:
        for box in r.boxes:
            cls   = int(box.cls[0])
            conf  = float(box.conf[0])
            label = model.names[cls]
            xyxy  = box.xyxy[0].tolist()   # [x1, y1, x2, y2]

            if label == "cell phone" and conf >= CONF_PHONE:
                phone_detected = True
                phone_boxes.append(xyxy)
                detections.append({"label": label, "confidence": round(conf, 3)})

            elif label == "person" and conf >= CONF_PERSON:
                person_boxes.append(xyxy)
                detections.append({"label": label, "confidence": round(conf, 3)})

    # ── IoU overlap check ──────────────────────────────────────────────────────
    # If a "person" box heavily overlaps a "phone" box it's likely the phone
    # being misclassified as a person — exclude it from the person count.
    def _iou(a, b):
        ix1 = max(a[0], b[0]); iy1 = max(a[1], b[1])
        ix2 = min(a[2], b[2]); iy2 = min(a[3], b[3])
        inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
        if inter == 0:
            return 0.0
        area_a = (a[2] - a[0]) * (a[3] - a[1])
        area_b = (b[2] - b[0]) * (b[3] - b[1])
        return inter / (area_a + area_b - inter)

    # Remove person boxes that heavily overlap a phone box
    real_persons = [
        pb for pb in person_boxes
        if not any(_iou(pb, ph) > 0.25 for ph in phone_boxes)
    ]

    # Size filter — a real person should occupy at least 8 % of the image area.
    # Tiny "person" detections are usually the phone body or background objects.
    img_area = img.shape[0] * img.shape[1]
    real_persons = [
        pb for pb in real_persons
        if ((pb[2] - pb[0]) * (pb[3] - pb[1])) / img_area > 0.08
    ]

    person_count = len(real_persons)

    return {
        "phoneDetected":   phone_detected,
        "multiplePersons": person_count > 1,
        "personCount":     person_count,
        "detections":      detections,
        "status":          "ok",
    }
