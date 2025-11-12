# Backend/main.py
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from db import get_collection
import re


# --- IMPORT NEW LLM EVALUATION SERVICE ---
from evaluation_service import evaluate_handwriting

# --- IMPORT RETRIEVAL ROUTER ---
from Retrieval import router as retrieval_router  # 👈 Import the router from Retrieval.py

# ------------------------------------------------
# Initialize FastAPI App
# ------------------------------------------------
app = FastAPI(title="Unified AI Backend (Evaluation + Retrieval)")

# ------------------------------------------------
# Middleware (CORS)
# ------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(retrieval_router)  # 👈 add router here


# ------------------------------------------------
# Include the Retrieval Router
# ------------------------------------------------

# ------------------------------------------------
# Evaluation Endpoint
# ------------------------------------------------
@app.post("/evaluate")
async def evaluate_answer(question_text: str = Form(...), file: UploadFile = Form(...)):
    """Evaluates handwritten answers using AI handwriting recognition."""
    question_text = question_text.strip()

    # 1️⃣ Find question in MongoDB
    cleaned_question_text = question_text.rstrip('.?')
    coll = get_collection("questions")
    db_question = coll.find_one({
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
        evaluation = await evaluate_handwriting(image_bytes, correct_answer, max_marks)

        if "error" in evaluation:
            return evaluation

        # 4️⃣ Return full AI evaluation
        return {
            "question": db_question["question"],
            "student_answer": evaluation.get("transcription", "(AI failed to transcribe)"),
            "correct_answer": correct_answer,
            "score": evaluation.get("score", 0),
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
        "routes": ["/evaluate", "/generate-task"]
    }
