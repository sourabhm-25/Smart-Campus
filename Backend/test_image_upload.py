"""
Test script to verify the enhanced evaluation service by uploading an image.
This simulates what happens when a user uploads an answer image via the frontend.
"""

import asyncio
import sys
from pathlib import Path
from evaluation_service import evaluate_handwriting
from db import get_collection

async def test_with_image(question_query: str, image_path: str):
    """
    Test the evaluation service with an actual image upload.
    
    Args:
        question_query: The question text to search for in the database
        image_path: Path to the handwritten answer image
    """
    
    print("=" * 80)
    print("🧪 TESTING ENHANCED EVALUATION SERVICE")
    print("=" * 80)
    
    # 1️⃣ Find the question in the database
    print(f"\n📚 Step 1: Looking for question in database...")
    print(f"   Query: '{question_query}'")
    
    questions = get_collection("questions")
    q = questions.find_one({"question": {"$regex": f"^{question_query}", "$options": "i"}})
    
    if not q:
        print(f"❌ ERROR: Question not found in database!")
        print(f"   Make sure the question exists in MongoDB.")
        return
    
    print(f"✅ Found question!")
    print(f"   Question: {q['question']}")
    print(f"   Topic: {q.get('topic', 'N/A')}")
    print(f"   Correct Answer: {q.get('answer', 'N/A')}")
    print(f"   Max Marks: {q.get('max_marks', 5)}")
    
    # 2️⃣ Load the image
    print(f"\n📸 Step 2: Loading image...")
    print(f"   Path: {image_path}")
    
    image_file = Path(image_path)
    if not image_file.exists():
        print(f"❌ ERROR: Image file not found at {image_path}")
        print(f"   Please provide a valid image path.")
        return
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    
    print(f"✅ Image loaded successfully!")
    print(f"   Size: {len(image_bytes)} bytes")
    
    # 3️⃣ Call the enhanced evaluation service
    print(f"\n🤖 Step 3: Calling AI evaluation service...")
    print(f"   This may take 30-60 seconds depending on your Ollama setup...")
    
    try:
        evaluation = await evaluate_handwriting(
            image_bytes=image_bytes,
            question_text=q['question'],
            correct_answer=q.get('answer', ''),
            max_marks=q.get('max_marks', 5),
            topic=q.get('topic', '')
        )
        
        # 4️⃣ Display results
        print("\n" + "=" * 80)
        print("📊 EVALUATION RESULTS")
        print("=" * 80)
        
        if "error" in evaluation:
            print(f"❌ ERROR: {evaluation['error']}")
            print("\n💡 Troubleshooting:")
            print("   1. Make sure Ollama is running (ollama serve)")
            print("   2. Make sure the ngrok tunnel is active")
            print("   3. Check the OLLAMA_URL in evaluation_service.py")
        else:
            print(f"\n📝 Transcription:")
            print(f"   {evaluation.get('transcription', 'N/A')}")
            print(f"\n🎯 Score: {evaluation.get('score', 0)} / {q.get('max_marks', 5)}")
            print(f"\n💬 Feedback:")
            print(f"   {evaluation.get('feedback', 'N/A')}")
            
            print("\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ ERROR during evaluation: {e}")
        print(f"\n💡 Make sure:")
        print(f"   1. Ollama is running with qwen2.5vl model")
        print(f"   2. The ngrok tunnel is active")
        print(f"   3. MongoDB is running")

async def main():
    """Main test runner with example usage."""
    
    print("\n" + "=" * 80)
    print("USAGE INSTRUCTIONS")
    print("=" * 80)
    print("\nTo test with your own image:")
    print("1. Make sure you have a question in your MongoDB database")
    print("2. Create a handwritten answer image (or use a test image)")
    print("3. Update the values below and run this script\n")
    
    # ========================================
    # 🔧 CONFIGURE YOUR TEST HERE
    # ========================================
    
    # Example 1: Math question
    QUESTION = "What is the cube root of 8?"
    IMAGE_PATH = "uploads/math_answer.png"  # Update this path!
    
    # Example 2: Science question
    # QUESTION = "How do trees help prevent floods?"
    # IMAGE_PATH = "uploads/science_answer.png"
    
    # ========================================
    
    await test_with_image(QUESTION, IMAGE_PATH)

if __name__ == "__main__":
    # Check if custom arguments provided
    if len(sys.argv) == 3:
        question = sys.argv[1]
        image_path = sys.argv[2]
        asyncio.run(test_with_image(question, image_path))
    else:
        asyncio.run(main())
