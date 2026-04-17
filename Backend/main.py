# Backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from core.database import questions_collection
import re

# --- IMPORT  LLM EVALUATION SERVICE ---
from evaluation_service import evaluate_handwriting

# --- IMPORT RETRIEVAL ROUTER ---
from Retrieval_modular import router as retrieval_router  # 👈 Import the router from Retrieval_modular.py (modular prompts with task types & custom counts)

# ── IMPORT ROUTERS ──
from routers.auth_router import router as auth_router
from routers import student_router
from routers.class_router import router as class_router
from routers.teacher_router import router as teacher_router
from routers.parent_router import router as parent_router
from routers.notification_router import router as notification_router

# ── IMPORT SCHEDULER ──
from services.deadline_scheduler import start_scheduler, stop_scheduler


# ------------------------------------------------
# Lifespan — startup / shutdown
# ------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


# ------------------------------------------------
# Initialize FastAPI App
# ------------------------------------------------
app = FastAPI(
    title="Unified AI Backend (Evaluation + Retrieval)",
    lifespan=lifespan,
)

# ------------------------------------------------
# Middleware (CORS)
# ------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: lock to your frontend domain before production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include All Routers ──
app.include_router(retrieval_router)        # AI question generation
app.include_router(auth_router)             # Auth (register, login, Google OAuth)
app.include_router(student_router.router)   # Student endpoints
app.include_router(class_router)            # Classroom management (central hub)
app.include_router(teacher_router)          # Teacher endpoints
app.include_router(parent_router)           # Parent endpoints
app.include_router(notification_router)     # In-app notifications


# ------------------------------------------------
# Evaluation Endpoint
# ------------------------------------------------
@app.post("/evaluate")
async def evaluate_answer(question_text: str = Form(...), file: UploadFile = Form(...)):
    """Evaluates handwritten answers using AI handwriting recognition."""
    question_text = question_text.strip()

    # 1️⃣ Find question in MongoDB
    cleaned_question_text = question_text.rstrip('.?')
    db_question = questions_collection.find_one({
        "question": {
            "$regex": f"^{re.escape(cleaned_question_text)}[.?]?$",
            "$options": "i"
        }
    })

    if not db_question:
        return {"error": f"Question not found in database for query: '{question_text}'"}

    # Extract correct answer and marks
    correct_answer = db_question.get("answer", "").strip()
    max_marks = db_question.get("max_marks", 5)

    try:
        # 2️⃣ Read image file
        image_bytes = await file.read()

        # 3️⃣ Evaluate handwriting via LLaVA (custom service)
        evaluation = await evaluate_handwriting(
            image_bytes,
            db_question.get("question", question_text),
            correct_answer,
            max_marks,
            db_question.get("topic", "")
        )

        if "error" in evaluation:
            return evaluation

        # 4️⃣ Return full AI evaluation
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

# ------------------------------------------------
# Root Endpoint
# ------------------------------------------------
@app.get("/")
def read_root():
    return {
        "message": "Unified AI Backend is running 🚀",
        "routes": [
            "/evaluate",
            "/generate-task",
            "/auth/*",
            "/class/*",
            "/student/*",
            "/student/submit",
            "/student/submissions",
            "/student/progress",
            "/teacher/*",
            "/teacher/homework/{id}/submissions",
            "/teacher/submissions/{id}/grade",
            "/teacher/class/{id}/analytics",
            "/parent/*",
            "/parent/child/{id}/submissions",
            "/parent/child/{id}/progress",
            "/notifications",
        ]
    }