# Backend/main.py
import sys
# Force UTF-8 stdout/stderr on Windows (prevents cp1252 emoji crash)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
import re
import json
from contextlib import asynccontextmanager

# ─────────────────────────────────────────────────────────────────────────────
# CRITICAL PATCH — must run before ANY FastAPI / Starlette code executes.
#
# Root cause: fastapi/encoders.py has:
#   ENCODERS_BY_TYPE = { bytes: lambda o: o.decode(), ... }
# When a RequestValidationError is raised on a multipart/form-data request,
# FastAPI tries to JSON-encode the error details, which include the raw binary
# image bytes → UnicodeDecodeError: 'utf-8' codec can't decode byte 0x89.
#
# Fix: replace the bytes encoder in-place so binary data never causes a crash.
# ─────────────────────────────────────────────────────────────────────────────
import fastapi.encoders as _enc
_enc.ENCODERS_BY_TYPE[bytes] = lambda o: f"<binary {len(o)} bytes>"

# Also patch the exception handler function directly (belt-and-suspenders)
import fastapi.exception_handlers as _feh
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

async def _safe_validation_handler(request, exc):
    try:
        errors = exc.errors()
        # Log full error details to uvicorn console
        import traceback
        print(f"\n[VALIDATION 422] path={request.url.path} method={request.method}")
        for i, e in enumerate(errors):
            # sanitize 'input' field separately since it may contain bytes
            safe_input = e.get('input')
            if isinstance(safe_input, bytes):
                safe_input = f"<binary {len(safe_input)} bytes>"
            print(f"  [{i}] loc={e.get('loc')} type={e.get('type')} msg={e.get('msg')} input={repr(safe_input)[:80]}")
        safe = json.loads(
            json.dumps(errors, default=lambda o: f"<binary {len(o)} bytes>" if isinstance(o, bytes) else str(o))
        )
    except Exception as ex:
        print(f"[VALIDATION 422] serialization error: {ex}")
        safe = [{"msg": "Validation error"}]
    return JSONResponse(status_code=422, content={"detail": safe})

_feh.request_validation_exception_handler = _safe_validation_handler
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from core.database import questions_collection

# --- IMPORT  LLM EVALUATION SERVICE ---
from evaluation_service import evaluate_handwriting

# --- IMPORT RETRIEVAL ROUTER ---
from Retrieval_modular import router as retrieval_router

# ── IMPORT ROUTERS ──
from routers.auth_router import router as auth_router
from routers import student_router
from routers.class_router import router as class_router
from routers.teacher_router import router as teacher_router
from routers.parent_router import router as parent_router
from routers.notification_router import router as notification_router
from routers.submission_router import router as submission_router
from routers.proctoring_router import router as proctoring_router
from routers.speaking_router import router as speaking_router

# ── IMPORT SCHEDULER ──
from services.deadline_scheduler import start_scheduler, stop_scheduler


# ─────────────────────────────────────────────────────────────────────────────
# Lifespan — startup / shutdown
# ─────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


# ─────────────────────────────────────────────────────────────────────────────
# Initialize FastAPI App
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Unified AI Backend (Evaluation + Retrieval)",
    lifespan=lifespan,
)

# Register safe validation handler at app level too
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return await _safe_validation_handler(request, exc)

# ─────────────────────────────────────────────────────────────────────────────
# Middleware (CORS)
# ─────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include All Routers ──
# submission_router MUST come before student_router to avoid route conflicts:
# Both previously defined POST /student/homework/{homework_id}/submit
app.include_router(retrieval_router)
app.include_router(auth_router)
app.include_router(submission_router)   # multipart/form-data handler ← first
app.include_router(student_router.router)
app.include_router(class_router)
app.include_router(teacher_router)
app.include_router(parent_router)
app.include_router(notification_router)
app.include_router(proctoring_router)
app.include_router(speaking_router)


# ─────────────────────────────────────────────────────────────────────────────
# Evaluation Endpoint
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/evaluate")
async def evaluate_answer(question_text: str = Form(...), file: UploadFile = File(...)):
    """Evaluates handwritten answers using AI handwriting recognition."""
    question_text = question_text.strip()

    cleaned_question_text = question_text.rstrip('.?')
    db_question = questions_collection.find_one({
        "question": {
            "$regex": f"^{re.escape(cleaned_question_text)}[.?]?$",
            "$options": "i"
        }
    })

    if not db_question:
        return {"error": f"Question not found in database for query: '{question_text}'"}

    correct_answer = db_question.get("answer", "").strip()
    max_marks = db_question.get("max_marks", 5)

    try:
        image_bytes = await file.read()
        evaluation = await evaluate_handwriting(
            image_bytes,
            db_question.get("question", question_text),
            correct_answer,
            max_marks,
            db_question.get("topic", "")
        )

        if "error" in evaluation:
            return evaluation

        return {
            "question": db_question["question"],
            "student_answer": evaluation.get("transcription", "(AI failed to transcribe)"),
            "correct_answer": correct_answer,
            "score": evaluation.get("score", 0),
            "max_marks": max_marks,
            "feedback": evaluation.get("feedback", "No feedback provided by AI."),
        }

    except Exception as e:
        print(f"❌ Error during evaluation: {e}")
        return {"error": f"An internal server error occurred: {e}"}


# ─────────────────────────────────────────────────────────────────────────────
# Root Endpoint
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "message": "Unified AI Backend is running 🚀",
        "routes": [
            "/evaluate", "/generate-task", "/auth/*", "/class/*",
            "/student/*", "/teacher/*", "/parent/*", "/notifications",
        ]
    }