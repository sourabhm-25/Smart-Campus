# Backend/main.py

from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from db import get_collection
import re # Keep this for the smart question matching

# --- IMPORT NEW LLM EVALUATION SERVICE ---
from evaluation_service import evaluate_handwriting

# --- 'ocr_service.py' is no longer used ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- The 'normalize_text' function is no longer needed. LLaVA will handle it. ---

@app.post("/evaluate")
async def evaluate_answer(question_text: str = Form(...), file: UploadFile = Form(...)):
    
    question_text = question_text.strip()

    # --- 1. FIND QUESTION IN DB (This logic is good, we keep it) ---
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

    # Get details from the database
    correct_answer = db_question.get("answer", "").strip()
    max_marks = db_question.get("max_marks", 5) # Default to 5 for better grading

    try:
        # --- 2. GET IMAGE BYTES ---
        image_bytes = await file.read()

        # --- 3. CALL LLAVA FOR OCR + EVALUATION (Replaces Tesseract/OpenCV) ---
        evaluation = await evaluate_handwriting(image_bytes, correct_answer, max_marks)

        # Check if the evaluation service returned an error
        if "error" in evaluation:
            return evaluation

        # --- 4. RETURN THE AI'S FULL RESPONSE ---
        return {
            "question": db_question["question"],
            "student_answer": evaluation.get("transcription", "(AI failed to transcribe)"),
            "correct_answer": correct_answer, 
            "score": evaluation.get("score", 0),
            "feedback": evaluation.get("feedback", "No feedback provided by AI."),
        }

    except Exception as e:
        print(f"An error occurred during evaluation: {e}")
        return {"error": f"An internal server error occurred: {e}"}

@app.get("/")
def read_root():
    return {"message": "AI Evaluation API (using Ollama) is running"}