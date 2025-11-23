# Backend/evaluation_service.py

import httpx
import base64
import json


# Make sure to add "/api/chat" at the end!
OLLAMA_URL = "https://nickeliferous-unchainable-ty.ngrok-free.dev/api/chat"
# ----------------------------------------

# The model you pulled (llava:latest)
MODEL_NAME = "llava" 

def create_evaluation_prompt(correct_answer: str, max_marks: int) -> str:
    """Creates a standardized prompt for the AI."""
    
    return f"""
    You are a strict but fair teacher grading a student's handwritten answer.

    Here is the correct model answer for your reference:
    "{correct_answer}"

    A photo of the student's handwritten answer is provided.
    First, transcribe the student's handwritten answer *exactly* as you see it.
    Second, compare the student's transcribed answer to the model answer.
    Third, provide a score from 0 to {max_marks}. The score must be an integer.
    Fourth, provide 2-3 lines of constructive feedback.

    Respond *only* with a valid JSON object in this exact format.
    Do not add any text before or after the JSON.

    {{
      "transcription": "<your_transcription_of_the_handwriting>",
      "score": <integer_score>,
      "feedback": "<your_feedback>"
    }}
    """

async def evaluate_handwriting(image_bytes: bytes, correct_answer: str, max_marks: int = 5):
    """
    Sends the handwritten image and prompt to Ollama (via the tunnel) 
    for both OCR and Evaluation.
    """
    
    # Convert image bytes to Base64
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
    
    prompt_text = create_evaluation_prompt(correct_answer, max_marks)
    
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
        # Set a long timeout (e.g., 60 seconds) because LLaVA can be slow
        async with httpx.AsyncClient(timeout=60.0) as client:
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