"""
Script to insert test questions into MongoDB for testing the enhanced evaluation service.
This will insert questions for Math, Chemistry, and Diagrams.
"""

import json
from pathlib import Path
from db import get_collection

def insert_test_questions(file_path):
    """Insert questions from a JSON file into MongoDB."""
    
    print(f"\n📂 Reading file: {file_path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    coll = get_collection("questions")
    topic = data.get("topic", "Unknown Topic")
    
    print(f"📚 Topic: {topic}")
    
    # Split JSON into multiple question documents
    docs = []
    for qtype in ["short_answer", "mcq", "fill_in_the_blanks"]:
        questions_list = data.get("questions", {}).get(qtype, [])
        
        for q in questions_list:
            doc = {
                "topic": topic,
                "type": qtype,
                "question": q["question"],
                "answer": q.get("answer"),
                "max_marks": q.get("max_marks", 5),  # Default to 5 if not specified
                "options": q.get("options"),
                "explanation": q.get("explanation", "")
            }
            docs.append(doc)
    
    if docs:
        # Check if questions already exist to avoid duplicates
        existing_count = 0
        new_docs = []
        
        for doc in docs:
            existing = coll.find_one({"question": doc["question"]})
            if existing:
                existing_count += 1
            else:
                new_docs.append(doc)
        
        if new_docs:
            coll.insert_many(new_docs)
            print(f"✅ Inserted {len(new_docs)} new questions")
        
        if existing_count > 0:
            print(f"ℹ️  Skipped {existing_count} questions (already exist)")
    else:
        print("⚠️  No questions found in file")
    
    return len(docs)

def main():
    """Insert all test question files."""
    
    print("=" * 80)
    print("🧪 INSERTING TEST QUESTIONS INTO DATABASE")
    print("=" * 80)
    
    test_files = [
        "test_questions_math.json",
        "test_questions_chemistry.json",
        "test_questions_diagrams.json"
    ]
    
    total_questions = 0
    
    for file_name in test_files:
        file_path = Path(__file__).parent / file_name
        
        if file_path.exists():
            count = insert_test_questions(file_path)
            total_questions += count
        else:
            print(f"⚠️  File not found: {file_name}")
    
    print("\n" + "=" * 80)
    print(f"✅ DONE! Total questions processed: {total_questions}")
    print("=" * 80)
    
    # Display sample questions
    print("\n📋 Sample questions now in database:")
    coll = get_collection("questions")
    
    for topic_type in ["Math", "Chemistry", "Biology"]:
        sample = coll.find_one({"topic": {"$regex": topic_type, "$options": "i"}})
        if sample:
            print(f"\n  [{sample['topic']}]")
            print(f"  Q: {sample['question']}")
            print(f"  A: {sample['answer'][:50]}..." if len(sample['answer']) > 50 else f"  A: {sample['answer']}")
            print(f"  Max Marks: {sample.get('max_marks', 'N/A')}")

if __name__ == "__main__":
    main()
