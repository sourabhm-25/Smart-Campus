"""
routers/submission_router.py
============================
Handles student homework submissions with per-question, per-criterion grading.

Two submission paths:
  A) Text answer (MCQ/T-F/short typed) → direct comparison, no LLaVA
  B) Photo upload (handwritten)         → Qwen2.5-VL OCR + rubric evaluation

POST /student/homework/{homework_id}/submit
GET  /student/homework/{homework_id}/result
GET  /teacher/homework/{homework_id}/submissions  (teacher view)
POST /teacher/submissions/{submission_id}/override  (manual score fix)
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Body
from core.database import db
from core.security import get_current_user, require_role
from evaluation_service import evaluate_handwriting, generate_rubric
from bson import ObjectId
from datetime import datetime, timezone
import json

router = APIRouter()

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB per photo


# ─────────────────────────────────────────────────────────────────────────────
# Helper: fetch homework document with validation
# ─────────────────────────────────────────────────────────────────────────────
def _get_homework_or_404(homework_id: str) -> dict:
    hw = db.homework.find_one({"_id": ObjectId(homework_id)})
    if not hw:
        raise HTTPException(404, "Homework not found")
    return hw


def _student_in_homework(hw: dict, student_id: ObjectId) -> bool:
    """Verify this student was in the snapshot when homework was assigned."""
    return student_id in [ObjectId(sid) for sid in hw.get("student_ids", [])]


# ─────────────────────────────────────────────────────────────────────────────
# POST /student/homework/{homework_id}/submit
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/student/homework/{homework_id}/submit")
async def submit_homework(
    homework_id: str,
    request: Request,
    current_user: dict = Depends(require_role("student")),
):
    """
    Submit homework answers. Supports mixed submissions:
    - Typed text answers evaluated with string comparison
    - Photo uploads evaluated with Qwen2.5-VL OCR + rubric grading

    Accepts multipart/form-data with:
      - answers: JSON string (list of {question_index, answer, type, has_photo})
      - photo_N: image file for question index N (optional)
    """
    print(f"[SUBMIT] ✅ Handler reached! user={current_user.get('email')} hw={homework_id}")

    # Validate ObjectId early
    try:
        hw_oid = ObjectId(homework_id)
    except Exception:
        raise HTTPException(400, "Invalid homework ID format")

    # Read form manually — never use Form(...) with binary file uploads.
    # Starlette's multipart parser may return text fields as UploadFile
    # when binary fields are present, causing Pydantic v2 to reject the request.
    try:
        form = await request.form()
    except Exception as e:
        raise HTTPException(400, f"Could not parse multipart form: {e}")

    raw_answers = form.get("answers")
    if raw_answers is None:
        raise HTTPException(422, "Missing 'answers' field in form data")

    # Defensively handle UploadFile-as-text (Starlette streaming quirk)
    if hasattr(raw_answers, "read"):
        answers_str = (await raw_answers.read()).decode("utf-8")
    else:
        answers_str = str(raw_answers)

    try:
        answers_payload = json.loads(answers_str)
    except (json.JSONDecodeError, TypeError) as e:
        raise HTTPException(422, f"Invalid answers JSON: {e}")

    if not isinstance(answers_payload, list):
        raise HTTPException(422, "answers must be a JSON array")

    # Extract photo files
    photo_bytes: dict[str, bytes] = {}
    for field_name, field_value in form.multi_items():
        if field_name.startswith("photo_"):
            if hasattr(field_value, "read"):
                data = await field_value.read()
                photo_bytes[field_name] = data
                print(f"[SUBMIT] {field_name}: {len(data)} bytes")
            else:
                print(f"[SUBMIT] WARNING: {field_name} not a file: {type(field_value)}")

    hw = db.homework.find_one({"_id": hw_oid})
    if not hw:
        raise HTTPException(404, "Homework not found")

    student_id = ObjectId(str(current_user["_id"]))

    # Guard: student must be in the homework snapshot
    if not _student_in_homework(hw, student_id):
        raise HTTPException(403, "You are not assigned this homework")

    # Guard: prevent double submission
    existing = db.submissions.find_one({
        "homework_id": ObjectId(homework_id),
        "student_id": student_id,
    })
    if existing:
        raise HTTPException(409, "Already submitted. Contact your teacher to reopen.")

    # ── Deadline enforcement ──────────────────────────────────────────────
    now_utc = datetime.now(timezone.utc)
    task_type = hw.get("task_type", "homework").lower()
    deadline_raw = hw.get("deadline")

    # Normalise deadline to aware datetime
    if isinstance(deadline_raw, str):
        try:
            deadline_dt = datetime.fromisoformat(deadline_raw.replace("Z", "+00:00"))
            if deadline_dt.tzinfo is None:
                deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
        except ValueError:
            deadline_dt = None
    elif isinstance(deadline_raw, datetime):
        deadline_dt = deadline_raw if deadline_raw.tzinfo else deadline_raw.replace(tzinfo=timezone.utc)
    else:
        deadline_dt = None

    is_overdue = deadline_dt is not None and now_utc > deadline_dt

    if task_type == "test" and is_overdue:
        # Hard-lock: auto-insert a zero submission so teacher can see the miss
        questions = _normalize_questions(hw.get("questions", []))
        total_marks = sum(int(q.get("marks", q.get("max_marks", 1))) for q in questions)
        zero_answers = [
            {
                "question_index": i,
                "question": q.get("question") or q.get("text", f"Q{i+1}"),
                "correct_answer": q.get("answer") or q.get("correct_answer", ""),
                "marks": int(q.get("marks", q.get("max_marks", 1))),
                "student_answer": "",
                "has_photo": False,
                "evaluation": {
                    "score": 0,
                    "max_score": int(q.get("marks", q.get("max_marks", 1))),
                    "feedback": "Not attempted — test deadline passed.",
                    "confidence": 1.0,
                    "low_confidence": False,
                    "needs_manual_review": False,
                    "eval_mode": "deadline_lock",
                },
            }
            for i, q in enumerate(questions)
        ]
        zero_doc = {
            "homework_id":    hw_oid,
            "student_id":     student_id,
            "class_id":       ObjectId(str(hw["class_id"])),
            "subject":        hw.get("subject", "general"),
            "submitted_at":   now_utc,
            "answers":        zero_answers,
            "total_score":    0,
            "total_marks":    total_marks,
            "percentage":     0.0,
            "grade":          "F",
            "status":         "deadline_missed",
            "low_confidence_questions": [],
            "teacher_overrides": [],
        }
        try:
            z_result = db.submissions.insert_one(zero_doc)
            db.homework.update_one(
                {"_id": hw_oid},
                {"$addToSet": {"submitted_student_ids": student_id}}
            )
        except Exception:
            pass  # already exists — ignore
        raise HTTPException(
            status_code=423,
            detail={
                "error": "deadline_passed",
                "message": "This test is locked. The deadline has passed.",
                "score": 0,
                "grade": "F",
            }
        )

    questions = _normalize_questions(hw.get("questions", []))
    subject   = hw.get("subject", "general")

    # ── Evaluate each answer ──────────────────────────────────────────────
    evaluated_answers = []
    total_score  = 0
    total_marks  = 0

    for ans_item in answers_payload:
        idx = ans_item.get("question_index", 0)
        if idx >= len(questions):
            continue

        q = questions[idx]
        q_text       = q.get("question") or q.get("text") or f"Question {idx + 1}"
        correct_ans  = q.get("answer") or q.get("correct_answer") or ""
        marks        = int(q.get("marks", q.get("max_marks", 1)))
        q_type       = (ans_item.get("type") or q.get("type") or "short_answer").lower()

        # Rubric: prefer stored rubric, auto-generate if missing
        rubric = q.get("rubric") or generate_rubric(q_text, correct_ans, marks, subject)

        eval_result = None

        # Path A: Photo upload
        photo_key = f"photo_{idx}"
        image_bytes = photo_bytes.get(photo_key)
        if ans_item.get("has_photo") and image_bytes:
            if len(image_bytes) > MAX_IMAGE_BYTES:
                eval_result = {
                    "error": "Image too large (max 10 MB)",
                    "score": 0,
                    "max_score": marks,
                    "needs_manual_review": True,
                }
            else:
                eval_result = await evaluate_handwriting(
                    image_bytes=image_bytes,
                    question_text=q_text,
                    correct_answer=correct_ans,
                    max_marks=marks,
                    subject=subject,
                    question_type=q_type,
                    rubric=rubric,
                )
        else:
            # Path B: Typed text answer
            student_text = str(ans_item.get("answer", "")).strip()
            eval_result  = _evaluate_text_answer(
                student_text=student_text,
                correct_answer=correct_ans,
                marks=marks,
                q_type=q_type,
                rubric=rubric,
                subject=subject,
            )

        total_score += eval_result.get("score", 0)
        total_marks += marks

        evaluated_answers.append({
            "question_index": idx,
            "question":       q_text,
            "correct_answer": correct_ans,
            "marks":          marks,
            "rubric":         rubric,
            "student_answer": ans_item.get("answer", ""),
            "has_photo":      ans_item.get("has_photo", False),
            "evaluation":     eval_result,
        })

    # ── Determine late-submission status for homework ─────────────────────
    submission_status = "submitted"
    if task_type == "homework" and is_overdue:
        submission_status = "late"

    # ── Build submission document ─────────────────────────────────────────
    percentage = round((total_score / total_marks * 100) if total_marks > 0 else 0, 1)
    grade_label = _percentage_to_grade(percentage)

    low_confidence_questions = [
        i for i, a in enumerate(evaluated_answers)
        if a["evaluation"].get("needs_manual_review", False)
    ]

    submission_doc = {
        "homework_id":    ObjectId(homework_id),
        "student_id":     student_id,
        "class_id":       ObjectId(str(hw["class_id"])),
        "subject":        subject,
        "task_type":      task_type,
        "submitted_at":   datetime.now(timezone.utc),
        "answers":        evaluated_answers,
        "total_score":    total_score,
        "total_marks":    total_marks,
        "percentage":     percentage,
        "grade":          grade_label,
        "status":         submission_status if not low_confidence_questions else "needs_review",
        "is_late":        submission_status == "late",
        "low_confidence_questions": low_confidence_questions,
        "teacher_overrides": [],  # Track manual corrections by teacher
    }

    result = db.submissions.insert_one(submission_doc)

    # Update homework: mark student as submitted
    db.homework.update_one(
        {"_id": ObjectId(homework_id)},
        {"$addToSet": {"submitted_student_ids": student_id}}
    )

    return {
        "submission_id": str(result.inserted_id),
        "total_score":   total_score,
        "total_marks":   total_marks,
        "percentage":    percentage,
        "grade":         grade_label,
        "needs_review":  bool(low_confidence_questions),
        "message": (
            "Submitted successfully. Some answers need manual teacher review due to unclear handwriting."
            if low_confidence_questions else
            "Submitted and graded successfully!"
        ),
        "breakdown": [
            {
                "question_index": a["question_index"],
                "question":       a["question"],
                "score":          a["evaluation"].get("score", 0),
                "max_marks":      a["marks"],
                "feedback":       a["evaluation"].get("feedback", ""),
                "criteria":       a["evaluation"].get("criteria_scores", []),
            }
            for a in evaluated_answers
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /student/homework/{homework_id}/result
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/student/homework/{homework_id}/result")
async def get_submission_result(
    homework_id: str,
    current_user: dict = Depends(require_role("student")),
):
    """Student fetches their graded result with per-criterion breakdown."""
    submission = db.submissions.find_one({
        "homework_id": ObjectId(homework_id),
        "student_id":  ObjectId(current_user["_id"]),
    })
    if not submission:
        raise HTTPException(404, "No submission found for this homework")

    return _serialize_submission(submission)


# ─────────────────────────────────────────────────────────────────────────────
# GET /teacher/homework/{homework_id}/submissions
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/teacher/homework/{homework_id}/submissions")
async def get_homework_submissions(
    homework_id: str,
    current_user: dict = Depends(require_role("teacher")),
):
    """
    Teacher fetches all submissions for a homework.
    Flagged low-confidence answers are highlighted for manual review.
    """
    hw = _get_homework_or_404(homework_id)

    # Verify teacher owns this homework
    if str(hw.get("teacher_id")) != str(current_user["_id"]):
        raise HTTPException(403, "You did not assign this homework")

    submissions = list(db.submissions.find({"homework_id": ObjectId(homework_id)}))

    # Attach student names
    student_ids = [s["student_id"] for s in submissions]
    students = {
        str(u["_id"]): u.get("name", "Unknown")
        for u in db.users.find({"_id": {"$in": student_ids}})
    }

    return {
        "homework_id":       homework_id,
        "total_submissions": len(submissions),
        "class_size":        len(hw.get("student_ids", [])),
        "submissions": [
            {
                **_serialize_submission(s),
                "student_name": students.get(str(s["student_id"]), "Unknown"),
            }
            for s in submissions
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /teacher/submissions/{submission_id}/override
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/teacher/submissions/{submission_id}/override")
async def override_score(
    submission_id: str,
    overrides: dict = Body(...),  # explicit Body() required in Pydantic v2 to avoid router schema poisoning
    current_user: dict = Depends(require_role("teacher")),
):
    """
    Teacher manually corrects AI scores for low-confidence evaluations.
    Stores override history for transparency.
    """
    submission = db.submissions.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(404, "Submission not found")

    # Verify teacher's homework
    hw = db.homework.find_one({"_id": submission["homework_id"]})
    if not hw or str(hw.get("teacher_id")) != str(current_user["_id"]):
        raise HTTPException(403, "Not authorized to modify this submission")

    question_index = int(overrides.get("question_index", 0))
    new_score      = int(overrides.get("new_score", 0))
    comment        = str(overrides.get("comment", ""))

    answers = submission.get("answers", [])
    if question_index >= len(answers):
        raise HTTPException(422, "Invalid question index")

    max_marks = answers[question_index]["marks"]
    if new_score < 0 or new_score > max_marks:
        raise HTTPException(422, f"Score must be between 0 and {max_marks}")

    old_score = answers[question_index]["evaluation"].get("score", 0)
    score_diff = new_score - old_score

    # Patch the specific answer's score
    answers[question_index]["evaluation"]["score"] = new_score
    answers[question_index]["evaluation"]["teacher_override"] = True
    answers[question_index]["evaluation"]["override_comment"] = comment

    new_total     = submission["total_score"] + score_diff
    new_pct       = round((new_total / submission["total_marks"] * 100), 1)

    db.submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {
            "$set": {
                "answers":          answers,
                "total_score":      new_total,
                "percentage":       new_pct,
                "grade":            _percentage_to_grade(new_pct),
                "status":           "reviewed",
            },
            "$push": {
                "teacher_overrides": {
                    "question_index": question_index,
                    "old_score":      old_score,
                    "new_score":      new_score,
                    "comment":        comment,
                    "overridden_by":  str(current_user["_id"]),
                    "overridden_at":  datetime.now(timezone.utc),
                }
            },
        }
    )

    return {"message": "Score updated", "new_total": new_total, "new_percentage": new_pct}


# ─────────────────────────────────────────────────────────────────────────────
# Text-based evaluation (no image)
# ─────────────────────────────────────────────────────────────────────────────
def _evaluate_text_answer(
    student_text: str,
    correct_answer: str,
    marks: int,
    q_type: str,
    rubric: list[dict],
    subject: str,
) -> dict:
    """
    Evaluate a typed (non-image) answer.
    Binary for MCQ/T-F/fill, keyword-match for short answers.
    """
    student_norm  = student_text.lower().strip()
    correct_norm  = correct_answer.lower().strip()

    if not student_norm:
        return {
            "score": 0, "max_score": marks, "percentage": 0,
            "criteria_scores": [
                {"criterion": "Completeness", "marks_awarded": 0, "max_marks": marks, "reason": "No answer provided"}
            ],
            "feedback": "No answer provided.",
            "confidence": 1.0, "low_confidence": False,
            "needs_manual_review": False, "eval_mode": "text",
        }

    # Binary types
    if any(t in q_type for t in ["mcq", "true_false", "fill"]):
        # correct_norm may be just a letter ("a") while student_norm is the full
        # option text ("a) some option text…").  We accept a match if:
        #   1. exact match after normalisation, OR
        #   2. the student's answer starts with the correct letter followed by
        #      ")" or "." or whitespace (e.g. "a) …" matches correct="a"), OR
        #   3. the correct answer is a substring of the student answer
        #      (handles "a) …" contains "a"), OR
        #   4. the student answer is a substring of the correct answer
        #      (handles when the full text is stored as the answer)
        import re as _re
        correct = (
            student_norm == correct_norm
            or correct_norm in student_norm
            or student_norm in correct_norm
            or bool(_re.match(
                r'^' + _re.escape(correct_norm) + r'[\s\)\.]',
                student_norm
            ))
        )
        score = marks if correct else 0
        return {
            "score": score,
            "max_score": marks,
            "percentage": 100.0 if correct else 0.0,
            "criteria_scores": [
                {"criterion": "Correct answer", "marks_awarded": score,
                 "max_marks": marks, "reason": "Exact match" if correct else "Incorrect"}
            ],
            "feedback": "Correct!" if correct else f"Incorrect. The correct answer was: {correct_answer}",
            "confidence": 1.0,
            "low_confidence": False,
            "needs_manual_review": False,
            "eval_mode": "binary",
        }

    # Short answer: simple keyword overlap scoring
    # (For typed answers, this is reasonable; photo answers use Qwen2.5-VL)
    correct_words = set(correct_norm.split())
    student_words = set(student_norm.split())
    overlap = len(correct_words & student_words) / max(len(correct_words), 1)
    score = round(overlap * marks)

    return {
        "score": score,
        "max_score": marks,
        "percentage": round(score / marks * 100, 1),
        "criteria_scores": [
            {"criterion": r["criterion"], "marks_awarded": min(r["marks"], round(overlap * r["marks"])),
             "max_marks": r["marks"], "reason": "Based on keyword overlap"}
            for r in rubric
        ],
        "feedback": (
            "Good answer!" if overlap > 0.7
            else "Partial answer — try to include more key terms from the topic."
            if overlap > 0.3
            else "Answer is missing key content. Review the topic again."
        ),
        "confidence": 1.0,
        "low_confidence": False,
        "needs_manual_review": False,
        "eval_mode": "text",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────
def _normalize_questions(raw) -> list:
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        all_q = []
        for key, val in raw.items():
            if isinstance(val, list):
                for q in val:
                    all_q.append({**q, "type": q.get("type", key)})
        return all_q
    return []


def _percentage_to_grade(pct: float) -> str:
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B+"
    if pct >= 60: return "B"
    if pct >= 50: return "C"
    if pct >= 40: return "D"
    return "F"


def _serialize_submission(s: dict) -> dict:
    status = s.get("status", "reviewed")
    return {
        "submission_id": str(s["_id"]),
        "homework_id":   str(s["homework_id"]),
        "submitted_at":  s["submitted_at"].isoformat(),
        "total_score":   s["total_score"],
        "total_marks":   s["total_marks"],
        "percentage":    s["percentage"],
        "grade":         s.get("grade", ""),
        "status":        status,
        "is_late":       s.get("is_late", False) or status == "late",
        "deadline_missed": status == "deadline_missed",
        "task_type":     s.get("task_type", "homework"),
        "needs_review":  status == "needs_review",
        "breakdown": [
            {
                "question_index": a["question_index"],
                "question":       a["question"],
                "score":          a["evaluation"].get("score", 0),
                "max_marks":      a["marks"],
                "transcription":  a["evaluation"].get("transcription", ""),
                "feedback":       a["evaluation"].get("feedback", ""),
                "criteria":       a["evaluation"].get("criteria_scores", []),
                "confidence":     a["evaluation"].get("confidence", 1.0),
                "needs_review":   a["evaluation"].get("needs_manual_review", False),
                "teacher_override": a["evaluation"].get("teacher_override", False),
            }
            for a in s.get("answers", [])
        ],
    }
