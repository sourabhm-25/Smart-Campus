"""
evaluation_service.py — Rubric-Driven, Subject-Aware Handwriting Evaluation
=============================================================================

Architecture:
  1. Each question carries a `rubric` (list of criteria with individual marks).
  2. Evaluation checks EACH criterion independently → partial credit is precise.
  3. Subject routing selects the right evaluation strategy before calling Qwen2.5-VL.
  4. Math: step-by-step checking. Science: keyword + diagram. English: holistic.
  5. Confidence score added to every response so teacher can flag low-confidence evals.
"""

import base64
import json
import re
import math
import os
from enum import Enum
from typing import Optional
from io import BytesIO

from dotenv import load_dotenv
import httpx
import google.generativeai as genai
from PIL import Image

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL_NAME = "gemini-flash-latest"

# ─────────────────────────────────────────────────────────────────────────────
# Enums & constants
# ─────────────────────────────────────────────────────────────────────────────
class EvalMode(str, Enum):
    CRITERIA  = "criteria"   # Check each rubric criterion individually
    HOLISTIC  = "holistic"   # Essay-style: overall quality band
    BINARY    = "binary"     # Correct/wrong only (MCQ, T/F, fill-in)
    STEPWISE  = "stepwise"   # Math: method + intermediate + final answer

SUBJECT_MODES = {
    "mathematics": EvalMode.STEPWISE,
    "math":        EvalMode.STEPWISE,
    "maths":       EvalMode.STEPWISE,
    "science":     EvalMode.CRITERIA,
    "biology":     EvalMode.CRITERIA,
    "chemistry":   EvalMode.CRITERIA,
    "physics":     EvalMode.CRITERIA,
    "english":     EvalMode.HOLISTIC,
    "literature":  EvalMode.HOLISTIC,
    "history":     EvalMode.CRITERIA,
    "geography":   EvalMode.CRITERIA,
    "social":      EvalMode.CRITERIA,
}

# ─────────────────────────────────────────────────────────────────────────────
# Rubric auto-generation
# Called at homework-assignment time; stored WITH the question in MongoDB.
# ─────────────────────────────────────────────────────────────────────────────
def generate_rubric(question: str, answer: str, marks: int, subject: str) -> list[dict]:
    """
    Auto-generate a mark-distribution rubric for a question at creation time.
    Returns a list of { criterion, marks } dicts that sum to `marks`.

    This should be called by the teacher_router when assigning homework,
    so the rubric is persisted with every question in MongoDB.
    """
    subject_lower = subject.lower()
    mode = _detect_mode(subject_lower)

    if mode == EvalMode.BINARY or marks == 1:
        return [{"criterion": "Correct answer", "marks": 1}]

    if mode == EvalMode.STEPWISE:
        return _math_rubric(marks)

    if mode == EvalMode.HOLISTIC:
        return _holistic_rubric(marks)

    # CRITERIA mode — generic chunking, refined per-subject
    return _criteria_rubric(marks, subject_lower, question, answer)


def _math_rubric(marks: int) -> list[dict]:
    """
    Standard math partial-credit distribution:
      1 mark  → correct answer only
      2 marks → method(1) + answer(1)
      3 marks → setup(1) + working(1) + answer(1)
      4 marks → setup(1) + method(1) + calculation(1) + answer(1)
      5 marks → setup(1) + method(1) + calculation(2) + answer(1)
    """
    if marks == 1:
        return [{"criterion": "Correct final answer", "marks": 1}]
    if marks == 2:
        return [
            {"criterion": "Correct method / formula used", "marks": 1},
            {"criterion": "Correct final answer", "marks": 1},
        ]
    if marks == 3:
        return [
            {"criterion": "Correct setup / identification of knowns and unknowns", "marks": 1},
            {"criterion": "Correct working / intermediate steps", "marks": 1},
            {"criterion": "Correct final answer with units (if applicable)", "marks": 1},
        ]
    if marks == 4:
        return [
            {"criterion": "Correct setup and formula identification", "marks": 1},
            {"criterion": "Correct method / approach", "marks": 1},
            {"criterion": "Correct intermediate calculations", "marks": 1},
            {"criterion": "Correct final answer with units", "marks": 1},
        ]
    # 5+ marks
    calc_marks = marks - 3
    return [
        {"criterion": "Correct setup and formula identification", "marks": 1},
        {"criterion": "Correct method / approach", "marks": 1},
        {"criterion": f"Correct intermediate calculations (all steps)", "marks": calc_marks},
        {"criterion": "Correct final answer with units", "marks": 1},
    ]


def _holistic_rubric(marks: int) -> list[dict]:
    """Band-based rubric for essays and long-form English answers."""
    if marks <= 2:
        return [
            {"criterion": "Addresses the question with relevant content", "marks": math.ceil(marks / 2)},
            {"criterion": "Clear expression and structure", "marks": math.floor(marks / 2)},
        ]
    third = marks // 3
    remainder = marks - (third * 2)
    return [
        {"criterion": "Relevant content covering key points", "marks": third},
        {"criterion": "Logical structure and coherent argument", "marks": third},
        {"criterion": "Language quality, grammar, and expression", "marks": remainder},
    ]


def _criteria_rubric(marks: int, subject: str, question: str, answer: str) -> list[dict]:
    """
    Generic criteria rubric for science/history/geography.
    Distributes marks as evenly as possible across key knowledge points.
    """
    # Science-specific
    if any(s in subject for s in ["science", "biology", "chemistry", "physics"]):
        if marks == 1:
            return [{"criterion": "Correct scientific concept / answer", "marks": 1}]
        if marks == 2:
            return [
                {"criterion": "Correct identification of the main scientific concept", "marks": 1},
                {"criterion": "Accurate supporting detail or explanation", "marks": 1},
            ]
        if marks == 3:
            return [
                {"criterion": "Correct identification of concept / phenomenon", "marks": 1},
                {"criterion": "Scientific explanation using correct terminology", "marks": 1},
                {"criterion": "Supporting example, diagram label, or equation (as required)", "marks": 1},
            ]
        # 4-5 marks science
        base = [
            {"criterion": "Correct identification of concept / phenomenon", "marks": 1},
            {"criterion": "Scientific explanation using correct terminology", "marks": 1},
            {"criterion": "Supporting evidence (equation, diagram, example)", "marks": 1},
        ]
        extra = marks - 3
        base.append({"criterion": f"Additional depth: comparison, cause-effect, or application", "marks": extra})
        return base

    # History / Social
    if any(s in subject for s in ["history", "social", "geography", "civics"]):
        if marks == 1:
            return [{"criterion": "Correct fact / date / event", "marks": 1}]
        if marks == 2:
            return [
                {"criterion": "Correct identification of event / person / place", "marks": 1},
                {"criterion": "Relevant explanation or significance", "marks": 1},
            ]
        if marks == 3:
            return [
                {"criterion": "Correct fact or event identification", "marks": 1},
                {"criterion": "Context or cause-and-effect explanation", "marks": 1},
                {"criterion": "Significance, impact, or date accuracy", "marks": 1},
            ]

    # Generic fallback — distribute 1 mark per criterion
    rubric = []
    for i in range(marks):
        rubric.append({
            "criterion": f"Key point {i + 1} from the model answer",
            "marks": 1
        })
    return rubric


def _detect_mode(subject: str) -> EvalMode:
    for key, mode in SUBJECT_MODES.items():
        if key in subject:
            return mode
    return EvalMode.CRITERIA


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builders — one per evaluation mode
# (Unchanged — same prompts, same JSON output contract)
# ─────────────────────────────────────────────────────────────────────────────
def _build_stepwise_prompt(question: str, correct_answer: str, rubric: list[dict], max_marks: int) -> str:
    rubric_text = "\n".join(
        f"  Criterion {i+1} [{r['marks']} mark{'s' if r['marks'] > 1 else ''}]: {r['criterion']}"
        for i, r in enumerate(rubric)
    )
    return f"""You are a strict mathematics teacher grading a student's handwritten solution.

QUESTION:
"{question}"

MODEL ANSWER / SOLUTION:
"{correct_answer}"

MARKING RUBRIC (total: {max_marks} marks):
{rubric_text}

GRADING INSTRUCTIONS:
1. First, carefully TRANSCRIBE the student's handwritten work EXACTLY as written.
2. Identify each mathematical step in the student's work.
3. For EACH criterion in the rubric, decide independently:
   - Does the student's work satisfy this criterion?
   - Award full marks for the criterion, or 0 if not met.
   - For multi-mark criteria, you may award partial marks.
4. IMPORTANT: If the student used a correct method but made a small arithmetic error,
   award method marks but not the final answer mark.
5. If the final answer is correct but NO working is shown, award only the answer mark
   (not method marks) — shown working is required for method credit.

OUTPUT FORMAT — Strict JSON only, no preamble, no markdown fences:
IMPORTANT JSON RULES:
- Every "reason" value MUST be a single-line string of at most 15 words. No newlines, no unescaped quotes inside reason strings.
- Do NOT use apostrophes or double-quotes inside any string value. Rephrase to avoid them.
{{
  "transcription": "<exact transcription of student's handwritten work>",
  "criteria_scores": [
    {{
      "criterion": "<criterion text>",
      "marks_awarded": <integer>,
      "max_marks": <integer>,
      "reason": "<max 15 words, single line, no quotes>"
    }}
  ],
  "total_score": <integer — sum of all marks_awarded>,
  "max_score": {max_marks},
  "overall_feedback": "<2-3 sentences: what was done well, what to improve>",
  "confidence": <0.0 to 1.0 — how clearly could you read the handwriting>
}}"""


def _build_criteria_prompt(question: str, correct_answer: str, rubric: list[dict], max_marks: int, subject: str) -> str:
    rubric_text = "\n".join(
        f"  Criterion {i+1} [{r['marks']} mark{'s' if r['marks'] > 1 else ''}]: {r['criterion']}"
        for i, r in enumerate(rubric)
    )

    diagram_instruction = ""
    if any(s in subject.lower() for s in ["science", "biology", "chemistry", "physics"]):
        diagram_instruction = """
DIAGRAM EVALUATION (if applicable):
- If the question requires a diagram, check: Is it drawn? Are components labeled correctly?
- Missing diagram = 0 marks for any diagram criterion.
- Partial diagram (drawn but not labeled) = 50% of diagram criterion marks.
- Key scientific terms in the student's answer that match the model answer count positively.
"""

    return f"""You are a {subject} teacher grading a student's handwritten answer.

QUESTION:
"{question}"

MODEL ANSWER:
"{correct_answer}"

MARKING RUBRIC (total: {max_marks} marks):
{rubric_text}
{diagram_instruction}
GRADING INSTRUCTIONS:
1. TRANSCRIBE the student's answer exactly as written (and describe any diagrams present).
2. For EACH criterion, check independently whether the student's answer satisfies it.
3. Award marks per criterion. Be strict but fair — approximate answers should receive
   partial credit if the understanding is clearly demonstrated.
4. Do NOT penalize for spelling errors in scientific names if the term is clearly identifiable.

OUTPUT FORMAT — Strict JSON only, no preamble, no markdown fences:
IMPORTANT JSON RULES:
- Every "reason" value MUST be a single-line string of at most 15 words. No newlines, no unescaped quotes inside reason strings.
- Do NOT use apostrophes or double-quotes inside any string value. Rephrase to avoid them.
{{
  "transcription": "<exact transcription + description of any diagrams>",
  "criteria_scores": [
    {{
      "criterion": "<criterion text>",
      "marks_awarded": <integer>,
      "max_marks": <integer>,
      "reason": "<max 15 words, single line, no quotes>"
    }}
  ],
  "total_score": <integer>,
  "max_score": {max_marks},
  "overall_feedback": "<2-3 sentences of constructive feedback>",
  "confidence": <0.0 to 1.0>
}}"""


def _build_holistic_prompt(question: str, correct_answer: str, rubric: list[dict], max_marks: int) -> str:
    rubric_text = "\n".join(
        f"  Dimension [{r['marks']} mark{'s' if r['marks'] > 1 else ''}]: {r['criterion']}"
        for i, r in enumerate(rubric)
    )
    return f"""You are an English teacher grading a student's handwritten essay/answer.

QUESTION:
"{question}"

EXPECTED ANSWER / KEY POINTS:
"{correct_answer}"

MARKING DIMENSIONS (total: {max_marks} marks):
{rubric_text}

GRADING INSTRUCTIONS:
1. TRANSCRIBE the student's complete handwritten answer.
2. Evaluate EACH dimension of the rubric independently.
3. Use this band guide per dimension:
   - Full marks: Clearly meets the criterion with confidence.
   - Half marks: Partially meets — present but weak or incomplete.
   - Zero: Not addressed or significantly incorrect.
4. Grammar errors alone should not reduce content marks — evaluate ideas separately
   from expression unless the expression dimension is being scored.

OUTPUT FORMAT — Strict JSON only, no preamble, no markdown fences:
IMPORTANT JSON RULES:
- Every "reason" value MUST be a single-line string of at most 15 words. No newlines, no unescaped quotes inside reason strings.
- Do NOT use apostrophes or double-quotes inside any string value. Rephrase to avoid them.
{{
  "transcription": "<full transcription of student's answer>",
  "criteria_scores": [
    {{
      "criterion": "<dimension text>",
      "marks_awarded": <integer or half-integer>,
      "max_marks": <integer>,
      "reason": "<max 15 words, single line, no quotes>"
    }}
  ],
  "total_score": <number>,
  "max_score": {max_marks},
  "overall_feedback": "<2-3 sentences: strengths and specific improvement areas>",
  "confidence": <0.0 to 1.0>
}}"""


def _build_binary_prompt(question: str, correct_answer: str, max_marks: int) -> str:
    return f"""You are a teacher grading a student's handwritten answer to an objective question.

QUESTION:
"{question}"

CORRECT ANSWER:
"{correct_answer}"

MAX MARKS: {max_marks}

GRADING INSTRUCTIONS:
1. TRANSCRIBE what the student has written.
2. Compare to the correct answer.
3. Award FULL marks if correct, ZERO if wrong.
4. For fill-in-the-blank: accept minor spelling variations if clearly the same word.
5. For True/False: must be clearly T/True or F/False.

OUTPUT FORMAT — Strict JSON only, no preamble, no markdown fences:
IMPORTANT JSON RULES:
- Every "reason" value MUST be a single-line string of at most 15 words. No newlines, no unescaped quotes inside reason strings.
- Do NOT use apostrophes or double-quotes inside any string value. Rephrase to avoid them.
{{
  "transcription": "<student's answer as written>",
  "criteria_scores": [
    {{
      "criterion": "Correct answer",
      "marks_awarded": <{max_marks} or 0>,
      "max_marks": {max_marks},
      "reason": "<max 15 words, single line, no quotes>"
    }}
  ],
  "total_score": <{max_marks} or 0>,
  "max_score": {max_marks},
  "overall_feedback": "<one sentence>",
  "confidence": <0.0 to 1.0>
}}"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt router
# ─────────────────────────────────────────────────────────────────────────────
def build_evaluation_prompt(
    question: str,
    correct_answer: str,
    marks: int,
    subject: str,
    question_type: str,
    rubric: Optional[list[dict]] = None,
) -> tuple[str, EvalMode]:
    q_type = question_type.lower().replace(" ", "_")
    subject_lower = subject.lower()

    if any(t in q_type for t in ["mcq", "true_false", "multiple_choice", "fill"]):
        return _build_binary_prompt(question, correct_answer, marks), EvalMode.BINARY

    mode = _detect_mode(subject_lower)

    if rubric is None or len(rubric) == 0:
        rubric = generate_rubric(question, correct_answer, marks, subject)

    if mode == EvalMode.STEPWISE:
        return _build_stepwise_prompt(question, correct_answer, rubric, marks), mode

    if mode == EvalMode.HOLISTIC:
        return _build_holistic_prompt(question, correct_answer, rubric, marks), mode

    return _build_criteria_prompt(question, correct_answer, rubric, marks, subject), mode


# ─────────────────────────────────────────────────────────────────────────────
# Response normalizer — make Qwen2.5-VL output safe
# ─────────────────────────────────────────────────────────────────────────────
def normalize_response(raw: dict, max_marks: int) -> dict:
    criteria = raw.get("criteria_scores", [])

    recomputed_total = sum(
        min(c.get("marks_awarded", 0), c.get("max_marks", 0))
        for c in criteria
    )

    total = min(recomputed_total, max_marks)
    total = max(0, total)

    confidence = float(raw.get("confidence", 0.7))
    confidence = max(0.0, min(1.0, confidence))

    return {
        "transcription": raw.get("transcription", "Could not transcribe."),
        "criteria_scores": [
            {
                "criterion": c.get("criterion", ""),
                "marks_awarded": min(max(0, c.get("marks_awarded", 0)), c.get("max_marks", max_marks)),
                "max_marks": c.get("max_marks", 1),
                "reason": c.get("reason", ""),
            }
            for c in criteria
        ],
        "score": total,
        "max_score": max_marks,
        "percentage": round((total / max_marks * 100) if max_marks > 0 else 0, 1),
        "feedback": raw.get("overall_feedback", ""),
        "confidence": confidence,
        "low_confidence": confidence < 0.5,
        "needs_manual_review": confidence < 0.4,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Gemini caller
# ─────────────────────────────────────────────────────────────────────────────
async def _call_gemini(image_bytes: bytes, prompt: str) -> dict:
    model = genai.GenerativeModel(GEMINI_MODEL_NAME)
    img = Image.open(BytesIO(image_bytes))
    
    response = await model.generate_content_async(
        [prompt, img],
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0,
        }
    )
    
    content = response.text
    return _parse_structured_json(content)

def _repair_json_strings(text: str) -> str:
    """
    Best-effort repair for JSON where string values contain literal newlines
    or unescaped characters.  We replace literal newline/tab characters that
    appear *inside* a JSON string value (between opening and closing quote)
    with a space.
    """
    # Replace literal newlines/tabs inside JSON string values with a space
    result = []
    in_string = False
    escape_next = False
    for ch in text:
        if escape_next:
            result.append(ch)
            escape_next = False
            continue
        if ch == "\\":
            result.append(ch)
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            result.append(ch)
            continue
        if in_string and ch in ("\n", "\r", "\t"):
            result.append(" ")  # replace illegal whitespace with space
            continue
        result.append(ch)
    return "".join(result)


def _parse_structured_json(content: str) -> dict:
    """
    Parse the structured grading JSON (which never contains free-form text —
    only numbers, short reason strings, and pre-defined criterion labels).
    Three-level fallback strategy:
      1. Direct parse (fastest path)
      2. Strip markdown fences + retry
      3. Repair literal newlines inside strings + retry
    """
    # Strip markdown fences
    cleaned = re.sub(r"```json\s*", "", content)
    cleaned = re.sub(r"```\s*", "", cleaned).strip()

    # Level 1: direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Extract first valid JSON object
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        candidate = match.group()
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            repaired = _repair_json_strings(candidate)
            try:
                return json.loads(repaired)
            except json.JSONDecodeError:
                pass

    # Last resort: repair the full cleaned text
    repaired = _repair_json_strings(cleaned)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError:
        pass

    raise ValueError(f"Could not parse grading JSON: {content[:400]}")


# Public API
# ─────────────────────────────────────────────────────────────────────────────
async def evaluate_handwriting(
    image_bytes: bytes,
    question_text: str,
    correct_answer: str,
    max_marks: int = 1,
    subject: str = "general",
    question_type: str = "short_answer",
    rubric: Optional[list[dict]] = None,
) -> dict:
    """
    Main entry point. Call from FastAPI endpoint.

    Args:
        image_bytes:    Raw bytes of the student's uploaded photo.
        question_text:  The question being answered.
        correct_answer: The model/teacher answer from MongoDB.
        max_marks:      Total marks this question is worth.
        subject:        Subject name (e.g., "Mathematics", "Science").
        question_type:  Type of question (e.g., "short_answer", "mcq", "fill_in_the_blanks").
        rubric:         Pre-stored rubric from MongoDB (generated at assignment time).

    Returns:
        Normalized evaluation dict with per-criterion breakdown.
    """
    prompt, mode = build_evaluation_prompt(
        question=question_text,
        correct_answer=correct_answer,
        marks=max_marks,
        subject=subject,
        question_type=question_type,
        rubric=rubric,
    )

    try:
        raw = await _call_gemini(image_bytes, prompt)
        result = normalize_response(raw, max_marks)
        result["eval_mode"] = mode.value
        result["subject"] = subject
        result["question_type"] = question_type
        return result

    except Exception as e:
        return _error_response(max_marks, f"Unexpected error: {e}")


def _error_response(max_marks: int, message: str) -> dict:
    return {
        "error": message,
        "score": 0,
        "max_score": max_marks,
        "percentage": 0,
        "transcription": "",
        "criteria_scores": [],
        "feedback": message,
        "confidence": 0.0,
        "low_confidence": True,
        "needs_manual_review": True,
        "eval_mode": "error",
    }