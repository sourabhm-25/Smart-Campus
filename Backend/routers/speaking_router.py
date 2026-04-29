"""
routers/speaking_router.py
──────────────────────────
Speaking task endpoints for Smart Campus.

Endpoints:
  POST /speaking/submit                              — Student submits audio
  GET  /speaking/result/{homework_id}               — Student fetches own result
  POST /speaking/generate                           — Teacher creates speaking homework
  GET  /speaking/teacher/homework/{id}/submissions  — Teacher views all submissions
  GET  /speaking/teacher/class/{id}/speaking        — Teacher views class homework list
  GET  /speaking/parent/child/{id}/speaking         — Parent views child results
"""

import logging
import os
import time
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from core.database import (
    classes_collection,
    homework_collection,
    submissions_collection,
    users_collection,
)
from core.security import get_current_user, require_role
from speaking_evaluation_service import EvaluationError, evaluate_speaking, MAX_AUDIO_SIZE_BYTES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/speaking", tags=["speaking"])

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

ERROR_CODE_TO_HTTP = {
    "AUDIO_TOO_SMALL":        status.HTTP_422_UNPROCESSABLE_ENTITY,
    "AUDIO_TOO_LARGE":        status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    "UNSUPPORTED_FORMAT":     status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    "TOO_SHORT":              status.HTTP_422_UNPROCESSABLE_ENTITY,
    "TOO_LONG":               status.HTTP_422_UNPROCESSABLE_ENTITY,
    "AUDIO_UNPROCESSABLE":    status.HTTP_422_UNPROCESSABLE_ENTITY,
    "RATE_LIMITED":           status.HTTP_503_SERVICE_UNAVAILABLE,
    "GEMINI_SERVER_ERROR":    status.HTTP_503_SERVICE_UNAVAILABLE,
    "NETWORK_TIMEOUT":        status.HTTP_504_GATEWAY_TIMEOUT,
    "MAX_RETRIES_EXCEEDED":   status.HTTP_503_SERVICE_UNAVAILABLE,
    "CONTENT_BLOCKED":        status.HTTP_422_UNPROCESSABLE_ENTITY,
    "NO_CANDIDATES":          status.HTTP_503_SERVICE_UNAVAILABLE,
    "INVALID_JSON":           status.HTTP_503_SERVICE_UNAVAILABLE,
    "SCHEMA_MISMATCH":        status.HTTP_503_SERVICE_UNAVAILABLE,
    "SCORE_SCHEMA_MISMATCH":  status.HTTP_503_SERVICE_UNAVAILABLE,
    "EMPTY_RESPONSE":         status.HTTP_503_SERVICE_UNAVAILABLE,
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _oid(id_str: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {id_str}")


def _require_gemini_key():
    if not GEMINI_API_KEY:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "AI evaluation service not configured. Set GEMINI_API_KEY in .env",
        )


def _get_homework_or_404(homework_id: str) -> dict:
    hw = homework_collection.find_one({"_id": _oid(homework_id, "homework_id")})
    if not hw:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Homework not found.")
    return hw


def _assert_speaking_homework(hw: dict):
    if hw.get("task_type") != "speaking":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This homework is not a speaking task.",
        )


def _assert_student_in_class(hw: dict, student_id: ObjectId):
    assigned_ids = [ObjectId(s) for s in hw.get("student_ids", [])]
    if student_id not in assigned_ids:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "You are not assigned to this homework.",
        )


def _check_deadline(hw: dict) -> bool:
    deadline = hw.get("deadline")
    if deadline is None:
        return False
    return time.time() > deadline.timestamp() if hasattr(deadline, "timestamp") else False


def _serialize_submission(sub: dict) -> dict:
    sub["_id"] = str(sub["_id"])
    sub["homework_id"] = str(sub.get("homework_id", ""))
    sub["student_id"] = str(sub.get("student_id", ""))
    return sub


def _serialize_hw(hw: dict) -> dict:
    hw["_id"] = str(hw["_id"])
    hw["class_id"] = str(hw.get("class_id", ""))
    hw["teacher_id"] = str(hw.get("teacher_id", ""))
    return hw


# ─── Student: Submit Speaking Answer ──────────────────────────────────────────

@router.post("/submit", summary="Student submits a spoken answer for evaluation")
async def submit_speaking_answer(
    homework_id: str = Form(...),
    duration_seconds: float = Form(..., ge=0, le=300),
    audio_file: UploadFile = File(...),
    current_user: dict = Depends(require_role("student")),
):
    """
    Accepts audio from the browser's MediaRecorder API.
    Sends it to Gemini 2.5 Flash for pronunciation/fluency evaluation.
    Upserts the result to MongoDB (re-submissions overwrite previous attempt).
    """
    _require_gemini_key()

    student_id = ObjectId(current_user["_id"])

    hw = _get_homework_or_404(homework_id)
    _assert_speaking_homework(hw)
    _assert_student_in_class(hw, student_id)

    audio_bytes = await audio_file.read(MAX_AUDIO_SIZE_BYTES + 1)
    is_late = _check_deadline(hw)

    try:
        result = await evaluate_speaking(
            audio_bytes=audio_bytes,
            mime_type=audio_file.content_type or "audio/webm",
            question_text=hw.get("speaking_passage", hw.get("title", "")),
            topic=hw.get("topic", ""),
            grade=int(hw.get("grade", 5)),
            claimed_duration=duration_seconds,
            gemini_api_key=GEMINI_API_KEY,
        )
    except EvaluationError as e:
        http_status = ERROR_CODE_TO_HTTP.get(e.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        logger.warning(f"EvaluationError [{e.error_code}] for student {student_id}: {e}")
        raise HTTPException(
            http_status,
            detail={
                "message": str(e),
                "error_code": e.error_code,
                "retry": e.error_code in {
                    "RATE_LIMITED", "GEMINI_SERVER_ERROR",
                    "NETWORK_TIMEOUT", "MAX_RETRIES_EXCEEDED",
                },
            },
        )

    existing = submissions_collection.find_one(
        {"homework_id": ObjectId(homework_id), "student_id": student_id},
        {"attempt_number": 1},
    )
    attempt_number = (existing.get("attempt_number", 0) if existing else 0) + 1

    submission_doc = {
        "homework_id":    ObjectId(homework_id),
        "student_id":     student_id,
        "class_id":       hw.get("class_id"),
        "task_type":      "speaking",
        "subject":        hw.get("subject", ""),
        "is_late":        is_late,
        "attempt_number": attempt_number,
        "duration_seconds": duration_seconds,
        "transcript":     result.transcript,
        "score_content_relevance": result.scores.content_relevance,
        "score_pronunciation":     result.scores.pronunciation,
        "score_fluency":           result.scores.fluency,
        "score_grammar":           result.scores.grammar,
        "score_confidence":        result.scores.confidence,
        "score_total":             result.scores.total,
        "score_max":               10,
        "grade_letter":            result.grade_letter,
        "grade_percentage":        result.grade_percentage,
        "feedback_strengths":     result.feedback.strengths,
        "feedback_improvements":  result.feedback.improvements,
        "feedback_encouragement": result.feedback.encouragement,
        "evaluation_model": result.evaluation_model,
        "submitted_at":     time.time(),
        "status":           "late" if is_late else "submitted",
    }

    submissions_collection.update_one(
        {"homework_id": ObjectId(homework_id), "student_id": student_id},
        {
            "$set": submission_doc,
            "$setOnInsert": {"created_at": time.time()},
        },
        upsert=True,
    )

    saved = submissions_collection.find_one(
        {"homework_id": ObjectId(homework_id), "student_id": student_id}
    )

    return {
        "submission_id":  str(saved["_id"]),
        "is_late":        is_late,
        "attempt_number": attempt_number,
        "transcript":     result.transcript,
        "scores": {
            "content_relevance": result.scores.content_relevance,
            "pronunciation":     result.scores.pronunciation,
            "fluency":           result.scores.fluency,
            "grammar":           result.scores.grammar,
            "confidence":        result.scores.confidence,
            "total":             result.scores.total,
            "max":               10,
        },
        "grade_letter":     result.grade_letter,
        "grade_percentage": result.grade_percentage,
        "feedback": {
            "strengths":     result.feedback.strengths,
            "improvements":  result.feedback.improvements,
            "encouragement": result.feedback.encouragement,
        },
    }


# ─── Student: Get My Result ────────────────────────────────────────────────────

@router.get("/result/{homework_id}", summary="Student fetches their speaking result")
async def get_my_speaking_result(
    homework_id: str,
    current_user: dict = Depends(require_role("student")),
):
    student_id = ObjectId(current_user["_id"])
    sub = submissions_collection.find_one(
        {
            "homework_id": _oid(homework_id, "homework_id"),
            "student_id":  student_id,
            "task_type":   "speaking",
        }
    )
    if not sub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No submission found for this homework.")
    return _serialize_submission(sub)


# ─── Teacher: Generate Speaking Homework ──────────────────────────────────────

@router.post("/generate", summary="Teacher creates a speaking homework task")
async def generate_speaking_homework(
    class_id: str = Form(...),
    subject: str = Form(...),
    topic: str = Form(...),
    grade: int = Form(..., ge=1, le=12),
    passage: str = Form(
        ..., min_length=10, max_length=2000,
        description="The prompt/passage the student must speak about"
    ),
    deadline_unix: Optional[float] = Form(None),
    current_user: dict = Depends(require_role("teacher")),
):
    """
    Creates a speaking homework. 'passage' is the spoken prompt for the student.
    Example passage: 'Tell me about India in 3-4 lines.'
    """
    teacher_id = ObjectId(current_user["_id"])
    class_oid = _oid(class_id, "class_id")

    cls = classes_collection.find_one(
        {
            "_id": class_oid,
            "teachers": {"$elemMatch": {"teacher_id": teacher_id, "subject": subject}},
        }
    )
    if not cls:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "You are not the subject teacher for this class and subject.",
        )

    student_ids = [str(s) for s in cls.get("students", [])]
    if not student_ids:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Class has no enrolled students.",
        )

    from datetime import datetime, timezone
    deadline_dt = (
        datetime.fromtimestamp(deadline_unix, tz=timezone.utc)
        if deadline_unix else None
    )

    hw_doc = {
        "class_id":         class_oid,
        "teacher_id":       teacher_id,
        "subject":          subject,
        "topic":            topic,
        "title":            topic,          # keep title = topic for card display
        "task_type":        "speaking",
        "speaking_passage": passage,
        "grade":            grade,
        "student_ids":      student_ids,
        "deadline":         deadline_dt,
        "created_at":       time.time(),
    }

    result = homework_collection.insert_one(hw_doc)

    return {
        "homework_id":  str(result.inserted_id),
        "student_count": len(student_ids),
        "topic":        topic,
        "task_type":    "speaking",
        "deadline":     deadline_unix,
        "message":      f"Speaking homework assigned to {len(student_ids)} students.",
    }


# ─── Teacher: Submissions for a Homework ──────────────────────────────────────

@router.get(
    "/teacher/homework/{homework_id}/submissions",
    summary="Teacher views all speaking submissions for a homework",
)
async def teacher_get_speaking_submissions(
    homework_id: str,
    current_user: dict = Depends(require_role("teacher")),
):
    teacher_id = ObjectId(current_user["_id"])
    hw_oid = _oid(homework_id, "homework_id")

    hw = homework_collection.find_one({"_id": hw_oid, "teacher_id": teacher_id})
    if not hw:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Homework not found or you don't own this homework.",
        )
    _assert_speaking_homework(hw)

    subs = list(
        submissions_collection.find(
            {"homework_id": hw_oid, "task_type": "speaking"},
            sort=[("submitted_at", -1)],
        )
    )

    student_oids = [s["student_id"] for s in subs]
    students = {
        u["_id"]: u
        for u in users_collection.find(
            {"_id": {"$in": student_oids}}, {"name": 1, "email": 1}
        )
    }

    enriched = []
    for sub in subs:
        s = _serialize_submission(sub)
        student = students.get(sub.get("student_id"), {})
        s["student_name"] = student.get("name", "Unknown")
        s["student_email"] = student.get("email", "")
        enriched.append(s)

    total_assigned = len(hw.get("student_ids", []))
    submitted_count = len(subs)
    avg_score = (
        round(sum(s["score_total"] for s in subs) / submitted_count, 1)
        if submitted_count > 0 else None
    )

    return {
        "homework_id":     homework_id,
        "topic":           hw.get("topic"),
        "speaking_passage": hw.get("speaking_passage"),
        "total_assigned":  total_assigned,
        "submitted_count": submitted_count,
        "pending_count":   total_assigned - submitted_count,
        "average_score":   avg_score,
        "submissions":     enriched,
    }


# ─── Teacher: All Speaking Homework for a Class ───────────────────────────────

@router.get(
    "/teacher/class/{class_id}/speaking",
    summary="Teacher views all speaking homework for a class",
)
async def teacher_get_class_speaking_homework(
    class_id: str,
    current_user: dict = Depends(require_role("teacher")),
):
    teacher_id = ObjectId(current_user["_id"])
    class_oid = _oid(class_id, "class_id")

    hws = list(
        homework_collection.find(
            {"class_id": class_oid, "teacher_id": teacher_id, "task_type": "speaking"},
            sort=[("created_at", -1)],
        )
    )

    result = []
    for hw in hws:
        total = len(hw.get("student_ids", []))
        submitted = submissions_collection.count_documents(
            {"homework_id": hw["_id"], "task_type": "speaking"}
        )
        h = _serialize_hw(hw)
        h["submission_count"] = submitted
        h["pending_count"] = total - submitted
        result.append(h)

    return {"class_id": class_id, "speaking_homework": result}


# ─── Parent: Child's Speaking Results ─────────────────────────────────────────

@router.get(
    "/parent/child/{child_id}/speaking",
    summary="Parent views their child's speaking submissions",
)
async def parent_get_child_speaking(
    child_id: str,
    current_user: dict = Depends(require_role("parent")),
):
    child_oid = _oid(child_id, "child_id")
    parent_children = [ObjectId(c) for c in current_user.get("children", [])]
    if child_oid not in parent_children:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You are not authorized to view this child's data."
        )

    subs = list(
        submissions_collection.find(
            {"student_id": child_oid, "task_type": "speaking"},
            sort=[("submitted_at", -1)],
        )
    )

    return {
        "child_id": child_id,
        "submissions": [_serialize_submission(s) for s in subs],
        "total_speaking_tasks": len(subs),
        "average_score": (
            round(sum(s["score_total"] for s in subs) / len(subs), 1)
            if subs else None
        ),
    }
