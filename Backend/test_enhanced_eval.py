import asyncio
from evaluation_service import create_evaluation_prompt

def test_prompt_creation():
    print("--- Testing Math Prompt ---")
    prompt_math = create_evaluation_prompt(
        question_text="Solve for x: 2x + 4 = 10",
        correct_answer="x = 3",
        max_marks=5,
        topic="Grade 8 - Math - Algebra"
    )
    print(prompt_math)
    assert "For MATH questions" in prompt_math
    
    print("\n--- Testing Science Prompt ---")
    prompt_science = create_evaluation_prompt(
        question_text="Draw the water cycle.",
        correct_answer="Diagram showing evaporation, condensation, precipitation.",
        max_marks=5,
        topic="Grade 5 - Science - Water Cycle"
    )
    print(prompt_science)
    assert "For SCIENCE questions" in prompt_science
    
    print("\n--- Testing General Prompt ---")
    prompt_general = create_evaluation_prompt(
        question_text="Who was the first President of India?",
        correct_answer="Dr. Rajendra Prasad",
        max_marks=2,
        topic="Grade 5 - Social Studies"
    )
    print(prompt_general)
    assert "For MATH questions" not in prompt_general
    assert "For SCIENCE questions" not in prompt_general

if __name__ == "__main__":
    test_prompt_creation()
