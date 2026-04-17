# Backend/evaluation_service.py

import httpx
import base64
import json


# Make sure to add "/api/chat" at the end!
OLLAMA_URL = "https://nickeliferous-unchainable-ty.ngrok-free.dev/api/chat"
# ----------------------------------------

# The model you pulled (llava:latest)
MODEL_NAME = "llava" 

def create_evaluation_prompt(question_text: str, correct_answer: str, max_marks: int, topic: str = "") -> str:
    """Creates a standardized prompt for the AI with subject-specific instructions."""
    
    subject_instruction = ""
    if "math" in topic.lower() or "maths" in topic.lower():
        subject_instruction = """
        - For MATH questions: 
          1. Check if the final answer matches exactly.
          2. Check the steps/method if visible strings exist.
          3. If the final answer is correct but steps are missing/wrong, deduct partial marks.
        """
    elif "science" in topic.lower():
        subject_instruction = """
        - For SCIENCE questions:
          1. Check for key scientific keywords in the student's answer.
          2. If a chemical equation is required, check for correct subscripts/superscripts and balancing.
          3. For diagrams, check if the student has drawn the correct components and labeled them if required.
        """
    
    return f"""
    You are a strict but fair teacher grading a student's answer.
    
    QUESTION: "{question_text}"
    TOPIC: "{topic}"
    
    MODEL ANSWER:
    "{correct_answer}"

    MAX MARKS: {max_marks}

    INSTRUCTIONS:
    1. Transcribe the student's handwritten answer *exactly* as you see it.
    2. Compare the student's answer to the MODEL ANSWER.
    3. Evaluate based on the context of the question and the max marks.{subject_instruction}
    4. Provide a score from 0 to {max_marks} (integer only).
    5. Provide 2-3 lines of constructive feedback explaining the score.
    
    OUTPUT FORMAT (Strict JSON only):
    {{
      "transcription": "<your_transcription>",
      "score": <integer_score>,
      "feedback": "<your_feedback>"
    }}
    """

async def evaluate_handwriting(image_bytes: bytes, question_text: str, correct_answer: str, max_marks: int = 5, topic: str = ""):
    """
    Sends the handwritten image and prompt to Ollama (via the tunnel) 
    for both OCR and Evaluation.
    """
    
    # Convert image bytes to Base64
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
    
    prompt_text = create_evaluation_prompt(question_text, correct_answer, max_marks, topic)
    
    payload = {
    "model": MODEL_NAME,
    "format": "json",
    "stream": False,
    "options": {
        "temperature": 0,
        "top_p": 1,
        "top_k": 1,
        "repeat_penalty": 1,
        "seed": 42      # ensures identical output every time
    },
    "messages": [
        {
            "role": "user",
            "content": prompt_text,
            "images": [encoded_image]
        }
      ]
    }

    
    try:
        # Set a very long timeout (e.g., 300 seconds) because LLaVA on CPU can be very slow
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status() # Raise an error for bad responses

            ollama_response = response.json()
            message_content = ollama_response.get('message', {}).get('content', '{}')
            
            # Parse the inner JSON string
            evaluation_json = json.loads(message_content)
            
            return evaluation_json

    except httpx.ConnectError:
        print("Error: Cannot connect to Ollama tunnel. Is it running?")
        return {"error": "Could not connect to local AI model. Please ensure Ollama and the Cloudflare tunnel are running."}
    except httpx.ReadTimeout:
        print("Error: AI model timed out.")
        return {"error": "The AI model took too long to respond. Please try again."}
    except json.JSONDecodeError:
        print(f"Error: Could not parse JSON response from Ollama: {message_content}")
        return {"error": "AI model returned an invalid response."}
    except Exception as e:
        print(f"An unknown error occurred: {e}")
        return {"error": f"An unknown error occurred: {e}"}