# test_ocr_eval.py 

from db import get_collection
from ocr_service import extract_text_from_image # <-- Uses new Tesseract service
import os

def test_question_evaluation(question_query, image_path):
    # 1️⃣ Fetch the question from DB
    questions = get_collection("questions")
    q = questions.find_one({"question": {"$regex": f"^{question_query}$", "$options": "i"}})
    if not q:
        print(f"❌ Question not found in DB for query: '{question_query}'")
        return

    correct_answer = q.get("answer", "").strip()
    max_marks = q.get("max_marks", 1) # Default to 1

    print(f"\n✅ Found Question: {q['question']}")
    print(f"📘 Correct Answer: {correct_answer}")

    # 2️⃣ Extract text from the uploaded image
    print(f"\n🔍 Extracting text from image using Tesseract/CV...")
    
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        extracted_text = extract_text_from_image(image_bytes)
        print(f"\n📝 OCR Output:\n---\n{extracted_text}\n---")
    except FileNotFoundError:
        print(f"❌ Error: Image file not found at {image_path}")
        return
    except Exception as e:
        print(f"❌ Error during OCR: {e}")
        return

    # 3️⃣ Evaluate with simple string comparison
    if not extracted_text:
        print("\n📊 Skipping evaluation as no text was extracted.")
        return
        
    print("\n🤖 Evaluating answer using simple comparison...")

    # Normalize strings
    norm_student_text = " ".join(extracted_text.lower().split())
    norm_correct_answer = " ".join(correct_answer.lower().split())

    score = 0
    feedback = ""

    if norm_student_text == norm_correct_answer:
        score = max_marks
        feedback = "Correct. The answer matches the model answer."
    else:
        score = 0
        feedback = "Incorrect. The extracted answer does not match."
    
    print("\n📊 Evaluation Result:")
    print(f"  Score: {score}")
    print(f"  Feedback: {feedback}")

if __name__ == "__main__":
    # --- IMPORTANT ---
    # Update the values below to match a question in your DB
    # and an image in your 'uploads' folder.
    # ---
    
    test_question_evaluation(
        question_query="What is the powerhouse of the cell?", # Must be EXACT match
        image_path="uploads/my_answer.png" # Must be a real file
    )