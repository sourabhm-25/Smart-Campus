"""
speaking_evaluation_service.py
──────────────────────────────
Evaluates student spoken audio using Gemini 2.5 Flash Native Audio Dialog.
"""

import asyncio
import base64
import json
import logging
import re
import time
from typing import Optional

import httpx
from pydantic import BaseModel, field_validator

logger = logging.getLogger(__name__)

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-flash-latest:generateContent"
)

MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024
MIN_AUDIO_SIZE_BYTES = 1024
MIN_DURATION_SECONDS = 2
MAX_DURATION_SECONDS = 180
MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.5

SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/ogg",
    "audio/ogg;codecs=opus",
    "audio/wav",
    "audio/mpeg",
}

RUBRIC_WEIGHTS = {
    "content_relevance": 3,
    "pronunciation":     2,
    "fluency":           2,
    "grammar":           2,
    "confidence":        1,
}
MAX_SCORE = sum(RUBRIC_WEIGHTS.values())  # 10


class ScoreBreakdown(BaseModel):
    content_relevance: int
    pronunciation: int
    fluency: int
    grammar: int
    confidence: int
    total: int

    @field_validator("content_relevance")
    @classmethod
    def validate_content(cls, v):
        if not 0 <= v <= 3:
            raise ValueError(f"content_relevance must be 0-3, got {v}")
        return v

    @field_validator("pronunciation", "fluency", "grammar")
    @classmethod
    def validate_two(cls, v):
        if not 0 <= v <= 2:
            raise ValueError(f"Score must be 0-2, got {v}")
        return v

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v):
        if not 0 <= v <= 1:
            raise ValueError(f"confidence must be 0-1, got {v}")
        return v

    @field_validator("total")
    @classmethod
    def validate_total(cls, v):
        if not 0 <= v <= MAX_SCORE:
            raise ValueError(f"total must be 0-{MAX_SCORE}, got {v}")
        return v


class FeedbackDetail(BaseModel):
    strengths: str
    improvements: str
    encouragement: str


class SpeakingEvaluationResult(BaseModel):
    transcript: str
    scores: ScoreBreakdown
    feedback: FeedbackDetail
    grade_letter: str
    grade_percentage: float
    duration_evaluated: Optional[float] = None
    evaluation_model: str = "gemini-flash-latest"
    evaluated_at: float = 0.0


class EvaluationError(Exception):
    def __init__(self, message: str, error_code: str):
        super().__init__(message)
        self.error_code = error_code


def build_rubric_prompt(grade: int, topic: str, question_text: str) -> str:
    grade_context = {
        range(1, 4): "primary school student (age 6-9). Use very simple language in feedback.",
        range(4, 7): "upper primary student (age 9-12). Standard primary school expectations.",
        range(7, 10): "middle school student (age 12-15). Clear sentences, basic grammar expected.",
        range(10, 13): "high school student (age 15-18). Structured paragraphs, coherent arguments expected.",
    }

    level_desc = "school student"
    for grade_range, desc in grade_context.items():
        if grade in grade_range:
            level_desc = desc
            break

    return f"""You are an expert English speaking evaluator for school students.

STUDENT PROFILE:
- Grade: {grade}
- Level: {level_desc}

SPEAKING PROMPT GIVEN TO STUDENT:
"{question_text}"

TOPIC:
"{topic}"

TASK:
Listen to the audio carefully and evaluate the student's spoken response.

SCORING RUBRIC (be fair and constructive — these scores help students improve):
1. content_relevance (0–3): Did the student speak about the given prompt/topic?
   - 3: Fully relevant, accurate content, answered the prompt well
   - 2: Mostly relevant, one minor factual error or slight drift
   - 1: Vaguely related, mostly off-topic or incomplete
   - 0: No relevant content or completely silent

2. pronunciation (0–2): Can the words be clearly understood?
   - 2: Clear and understandable throughout
   - 1: Some words unclear but overall understandable
   - 0: Very difficult to understand

3. fluency (0–2): Natural flow, appropriate pace, minimal filler sounds
   - 2: Smooth, natural pace
   - 1: Some pauses or "um/uh" but manageable
   - 0: Extremely halting, very difficult to follow

4. grammar (0–2): Sentence structure and verb agreement
   - 2: Grammatically correct or only minor slips
   - 1: Some grammatical errors but meaning is clear
   - 0: Many errors that obscure meaning

5. confidence (0–1): Steady voice, not extremely rushed or shaky
   - 1: Reasonably confident delivery
   - 0: Very nervous, inaudible, or extremely rushed

IMPORTANT RULES:
- If the audio is silent, return all zeros and transcript = "[No speech detected]"
- If audio is corrupted or inaudible, return error_code = "AUDIO_UNPROCESSABLE"
- Transcribe EXACTLY what was said, including filler words (um, uh, like)
- total = sum of all five scores (max 10)
- grade_letter: A=9-10, B=7-8, C=5-6, D=3-4, F=0-2
- grade_percentage = (total / 10) * 100

Return ONLY valid JSON, no markdown, no explanation:
{{
  "transcript": "<exact words spoken>",
  "scores": {{
    "content_relevance": <int>,
    "pronunciation": <int>,
    "fluency": <int>,
    "grammar": <int>,
    "confidence": <int>,
    "total": <int>
  }},
  "feedback": {{
    "strengths": "<1-2 specific things done well, for grade {grade} level>",
    "improvements": "<1-2 specific, actionable improvements>",
    "encouragement": "<one warm, motivating sentence for a {level_desc}>"
  }},
  "grade_letter": "<A/B/C/D/F>",
  "grade_percentage": <float>
}}"""


def validate_audio(
    audio_bytes: bytes,
    mime_type: str,
    claimed_duration: Optional[float],
) -> None:
    if len(audio_bytes) < MIN_AUDIO_SIZE_BYTES:
        raise EvaluationError(
            "Audio file is too small — likely empty or corrupted.",
            "AUDIO_TOO_SMALL",
        )

    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise EvaluationError(
            f"Audio exceeds {MAX_AUDIO_SIZE_BYTES // 1_000_000} MB limit.",
            "AUDIO_TOO_LARGE",
        )

    base_mime = mime_type.split(";")[0].strip().lower()
    if base_mime not in {m.split(";")[0] for m in SUPPORTED_AUDIO_MIME_TYPES}:
        raise EvaluationError(
            f"Unsupported audio format: {mime_type}. Use WebM, MP4, OGG, WAV, or MP3.",
            "UNSUPPORTED_FORMAT",
        )

    if claimed_duration is not None:
        if claimed_duration < MIN_DURATION_SECONDS:
            raise EvaluationError(
                f"Recording too short ({claimed_duration:.1f}s). Minimum is {MIN_DURATION_SECONDS}s.",
                "TOO_SHORT",
            )
        if claimed_duration > MAX_DURATION_SECONDS:
            raise EvaluationError(
                f"Recording too long ({claimed_duration:.1f}s). Maximum is {MAX_DURATION_SECONDS}s.",
                "TOO_LONG",
            )


async def _call_gemini(
    api_key: str,
    audio_bytes: bytes,
    mime_type: str,
    prompt: str,
) -> dict:
    gemini_mime = mime_type.split(";")[0].strip().lower()

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": gemini_mime,
                            "data": base64.b64encode(audio_bytes).decode("utf-8"),
                        }
                    },
                    {"text": prompt},
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }

    last_error: Optional[Exception] = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.post(
                    f"{GEMINI_API_URL}?key={api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code == 429:
                    wait = RETRY_BASE_DELAY * (3 ** attempt)
                    logger.warning(f"Gemini rate limited, waiting {wait}s")
                    await asyncio.sleep(wait)
                    last_error = EvaluationError("Gemini rate limit hit.", "RATE_LIMITED")
                    continue

                if response.status_code >= 500:
                    wait = RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning(f"Gemini {response.status_code}, retrying in {wait}s")
                    await asyncio.sleep(wait)
                    last_error = EvaluationError(
                        f"Gemini server error {response.status_code}.", "GEMINI_SERVER_ERROR"
                    )
                    continue

                if response.status_code == 400:
                    body = response.json()
                    raise EvaluationError(
                        f"Gemini rejected request: {body.get('error', {}).get('message', 'unknown')}",
                        "GEMINI_BAD_REQUEST",
                    )

                if response.status_code != 200:
                    raise EvaluationError(
                        f"Unexpected Gemini status: {response.status_code}",
                        "GEMINI_UNEXPECTED_STATUS",
                    )

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    last_error = EvaluationError(
                        "Gemini returned no candidates — audio may be unprocessable.",
                        "NO_CANDIDATES",
                    )
                    wait = RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning(f"No candidates returned, retrying in {wait}s")
                    await asyncio.sleep(wait)
                    continue

                finish_reason = candidates[0].get("finishReason", "")
                if finish_reason in ("SAFETY", "RECITATION"):
                    raise EvaluationError(
                        f"Gemini blocked response: {finish_reason}",
                        "CONTENT_BLOCKED",
                    )

                parts = candidates[0].get("content", {}).get("parts", [])
                raw_text = "".join(p.get("text", "") for p in parts)

                if not raw_text.strip():
                    last_error = EvaluationError("Gemini returned empty response.", "EMPTY_RESPONSE")
                    wait = RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning(f"Empty response from Gemini, retrying in {wait}s")
                    await asyncio.sleep(wait)
                    continue

                raw_text = re.sub(r"```json|```", "", raw_text).strip()

                try:
                    return json.loads(raw_text)
                except json.JSONDecodeError as e:
                    logger.error(f"Gemini response not valid JSON: {raw_text[:300]}")
                    last_error = EvaluationError(
                        "Gemini response was not valid JSON.", "INVALID_JSON"
                    )
                    wait = RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning(f"Invalid JSON returned, retrying in {wait}s")
                    await asyncio.sleep(wait)
                    continue

            except (httpx.TimeoutException, httpx.ConnectError) as e:
                wait = RETRY_BASE_DELAY * (2 ** attempt)
                logger.warning(f"Network error on attempt {attempt+1}: {e}, retrying in {wait}s")
                await asyncio.sleep(wait)
                last_error = EvaluationError("Network timeout reaching Gemini.", "NETWORK_TIMEOUT")
                continue

    raise last_error or EvaluationError("All Gemini retries exhausted.", "MAX_RETRIES_EXCEEDED")


def _validate_and_repair_scores(raw: dict) -> dict:
    required_keys = {"transcript", "scores", "feedback", "grade_letter", "grade_percentage"}
    missing = required_keys - set(raw.keys())
    if missing:
        raise EvaluationError(f"Gemini response missing keys: {missing}", "SCHEMA_MISMATCH")

    scores = raw.get("scores", {})
    score_keys = {"content_relevance", "pronunciation", "fluency", "grammar", "confidence", "total"}
    missing_scores = score_keys - set(scores.keys())
    if missing_scores:
        raise EvaluationError(f"Scores missing fields: {missing_scores}", "SCORE_SCHEMA_MISMATCH")

    limits = {
        "content_relevance": (0, 3),
        "pronunciation": (0, 2),
        "fluency": (0, 2),
        "grammar": (0, 2),
        "confidence": (0, 1),
    }
    repaired_scores = {}
    for key, (lo, hi) in limits.items():
        val = int(scores.get(key, 0))
        repaired_scores[key] = max(lo, min(hi, val))

    repaired_scores["total"] = sum(repaired_scores[k] for k in limits)

    total = repaired_scores["total"]
    grade_percentage = round((total / MAX_SCORE) * 100, 1)
    if total >= 9:
        grade_letter = "A"
    elif total >= 7:
        grade_letter = "B"
    elif total >= 5:
        grade_letter = "C"
    elif total >= 3:
        grade_letter = "D"
    else:
        grade_letter = "F"

    raw["scores"] = repaired_scores
    raw["grade_letter"] = grade_letter
    raw["grade_percentage"] = grade_percentage

    feedback = raw.get("feedback", {})
    for fkey in ("strengths", "improvements", "encouragement"):
        if fkey not in feedback or not isinstance(feedback[fkey], str):
            feedback[fkey] = ""
    raw["feedback"] = feedback

    if not isinstance(raw.get("transcript"), str):
        raw["transcript"] = ""

    return raw


async def evaluate_speaking(
    audio_bytes: bytes,
    mime_type: str,
    question_text: str,
    topic: str,
    grade: int,
    claimed_duration: Optional[float],
    gemini_api_key: str,
) -> SpeakingEvaluationResult:
    validate_audio(audio_bytes, mime_type, claimed_duration)
    prompt = build_rubric_prompt(grade, topic, question_text)
    raw_result = await _call_gemini(gemini_api_key, audio_bytes, mime_type, prompt)

    if raw_result.get("error_code") == "AUDIO_UNPROCESSABLE":
        raise EvaluationError(
            "Audio could not be processed by the AI model.", "AUDIO_UNPROCESSABLE"
        )

    validated = _validate_and_repair_scores(raw_result)

    return SpeakingEvaluationResult(
        transcript=validated["transcript"],
        scores=ScoreBreakdown(**validated["scores"]),
        feedback=FeedbackDetail(**validated["feedback"]),
        grade_letter=validated["grade_letter"],
        grade_percentage=validated["grade_percentage"],
        duration_evaluated=claimed_duration,
        evaluated_at=time.time(),
    )
