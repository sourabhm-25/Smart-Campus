"""
Student Router — Student-Specific Endpoints
============================================
- Dashboard with class + teacher info
- View subjects (derived from class teachers)
- View homework assigned per subject (with submission status in one batch query)
- Submit homework (with late-status detection)
- View my submission history + progress
- View class details
- Enrollment status & re-request
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from core.database import (
    users_collection, classes_collection, homework_collection,
    enrollment_requests_collection, submissions_collection
)
from core.security import require_role, get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(
    prefix="/student",
    tags=["Student"]
)


# ─────────────────────────────
# Request Models
# ─────────────────────────────

class ReRequestEnrollment(BaseModel):
    school: str
    grade: str


class AnswerItem(BaseModel):
    question_id: str
    answer_text: str


class SubmitHomeworkRequest(BaseModel):
    homework_id: str
    answers: List[AnswerItem]   # Full set of answers submitted in one call


# ─────────────────────────────
# 1. Student Dashboard
# ─────────────────────────────

@router.get("/dashboard")
def student_dashboard(user=Depends(require_role("student"))):
    """
    Get student dashboard data:
    - Their class info
    - Subjects with teachers
    - Pending homework count
    - Enrollment status (if not yet in a class)
    """
    user_id = user["_id"]

    classes = list(classes_collection.find({"students": user_id}))

    subjects_with_teachers = []
    total_homework = 0

    for cls in classes:
        for t in cls.get("teachers", []):
            teacher = users_collection.find_one({"_id": t["teacher_id"]})
            teacher_name = teacher.get("name", "Unknown") if teacher else "Unknown"

            hw_count = homework_collection.count_documents({
                "class_id": cls["_id"],
                "subject": t["subject"],
                "status": "active"
            })
            total_homework += hw_count

            subjects_with_teachers.append({
                "subject": t["subject"],
                "teacher_name": teacher_name,
                "teacher_id": str(t["teacher_id"]),
                "class_id": str(cls["_id"]),
                "school": cls.get("school", ""),
                "grade": cls.get("grade", ""),
                "pending_homework": hw_count,
            })

    enrollment_status = None
    if not classes:
        latest_request = enrollment_requests_collection.find_one(
            {"student_id": user_id},
            sort=[("requested_at", -1)]
        )
        if latest_request:
            enrollment_status = {
                "request_id": str(latest_request["_id"]),
                "school": latest_request.get("school", ""),
                "grade": latest_request.get("grade", ""),
                "status": latest_request.get("status", ""),
                "requested_at": str(latest_request.get("requested_at", "")),
                "class_found": latest_request.get("class_id") is not None,
            }
        else:
            enrollment_status = {"status": "none"}

    return {
        "message": f"Welcome {user['name']} to Student Dashboard",
        "student": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "school": user.get("school", ""),
            "grade": user.get("grade", ""),
        },
        "subjects": subjects_with_teachers,
        "total_pending_homework": total_homework,
        "total_classes": len(classes),
        "enrollment_status": enrollment_status,
    }


# ─────────────────────────────
# 2. My Subjects (from class)
# ─────────────────────────────

@router.get("/my-subjects")
def get_my_subjects(user=Depends(require_role("student"))):
    """Get all subjects for the logged-in student."""
    user_id = user["_id"]
    classes = list(classes_collection.find({"students": user_id}))

    subjects = []
    for cls in classes:
        for t in cls.get("teachers", []):
            teacher = users_collection.find_one({"_id": t["teacher_id"]})
            subjects.append({
                "subject": t["subject"],
                "teacher": {
                    "id": str(t["teacher_id"]),
                    "name": teacher.get("name", "Unknown") if teacher else "Unknown",
                    "email": teacher.get("email", "") if teacher else "",
                },
                "class_id": str(cls["_id"]),
                "school": cls.get("school", ""),
                "grade": cls.get("grade", ""),
            })

    return {"subjects": subjects, "count": len(subjects)}


# ─────────────────────────────
# 3. Homework by Subject
# ─────────────────────────────

@router.get("/homework/{subject}")
def get_homework_by_subject(subject: str, user=Depends(require_role("student"))):
    """
    Get all homework for a specific subject assigned to this student.
    Includes whether the student has already submitted (no N+1: one batch query).
    """
    user_id = user["_id"]

    classes = list(classes_collection.find({"students": user_id}))
    class_ids = [cls["_id"] for cls in classes]

    homework_list = list(homework_collection.find({
        "class_id": {"$in": class_ids},
        "subject": {"$regex": f"^{subject}$", "$options": "i"},
        "status": "active"
    }).sort("created_at", -1))

    # Batch-fetch submissions to avoid N+1
    hw_ids = [hw["_id"] for hw in homework_list]
    my_subs = {
        sub["homework_id"]: sub
        for sub in submissions_collection.find({
            "homework_id": {"$in": hw_ids},
            "student_id": user_id
        })
    }

    result = []
    for hw in homework_list:
        sub = my_subs.get(hw["_id"])
        deadline = hw.get("deadline")
        result.append({
            "id": str(hw["_id"]),
            "title": hw.get("title", ""),
            "description": hw.get("description", ""),
            "subject": hw.get("subject", ""),
            "teacher_name": hw.get("teacher_name", ""),
            "task_type": hw.get("task_type", "homework"),
            "questions": hw.get("questions"),
            "deadline": deadline.isoformat() if isinstance(deadline, datetime) else deadline,
            "created_at": str(hw.get("created_at", "")),
            "school": hw.get("school", ""),
            "grade": hw.get("grade", ""),
            # submission status — no extra query
            "submitted": sub is not None,
            "submission_status": sub.get("status") if sub else None,
            "submission_score": sub.get("total_score") if sub else None,
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 4. All Homework (with submission status — N+1 fixed)
# ─────────────────────────────

@router.get("/homework")
def get_all_homework(user=Depends(require_role("student"))):
    """
    Get all active homework across all subjects for this student.
    Batch-fetches submission status in a single query to prevent N+1.
    """
    user_id = user["_id"]

    classes = list(classes_collection.find({"students": user_id}))
    class_ids = [cls["_id"] for cls in classes]

    homework_list = list(homework_collection.find({
        "class_id": {"$in": class_ids},
        "status": "active"
    }).sort("created_at", -1))

    # ── N+1 fix: one query for all submissions ──
    hw_ids = [hw["_id"] for hw in homework_list]
    my_subs = {
        sub["homework_id"]: sub
        for sub in submissions_collection.find({
            "homework_id": {"$in": hw_ids},
            "student_id": user_id
        })
    }

    result = []
    for hw in homework_list:
        sub = my_subs.get(hw["_id"])
        deadline = hw.get("deadline")
        result.append({
            "id": str(hw["_id"]),
            "title": hw.get("title", ""),
            "description": hw.get("description", ""),
            "subject": hw.get("subject", ""),
            "teacher_name": hw.get("teacher_name", ""),
            "task_type": hw.get("task_type", "homework"),
            "deadline": deadline.isoformat() if isinstance(deadline, datetime) else deadline,
            "created_at": str(hw.get("created_at", "")),
            "school": hw.get("school", ""),
            "grade": hw.get("grade", ""),
            # submission status attached without extra queries
            "submitted": sub is not None,
            "submission_status": sub.get("status") if sub else None,
            "submission_score": sub.get("total_score") if sub else None,
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 5. Submit Homework
# ─────────────────────────────

@router.post("/submit")
def submit_homework(data: SubmitHomeworkRequest, user=Depends(require_role("student"))):
    """
    Submit answers for a homework assignment.
    - Accepts the full answer set in one call.
    - Detects late submission by comparing submitted_at against homework.deadline.
    - Atomically increments homework.submission_count.
    - Enforces uniqueness via DB index (one submission per student per homework).
    """
    user_id = user["_id"]
    hw_oid = ObjectId(data.homework_id)

    # Verify homework exists and student is enrolled in the class
    hw = homework_collection.find_one({"_id": hw_oid})
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    if hw.get("status") == "closed":
        raise HTTPException(status_code=400, detail="This homework is closed and no longer accepting submissions")

    # Ensure the student is enrolled in this homework's class
    cls = classes_collection.find_one({
        "_id": hw["class_id"],
        "students": user_id
    })
    if not cls:
        raise HTTPException(status_code=403, detail="You are not enrolled in the class this homework belongs to")

    # Determine late status by comparing now against deadline
    now = datetime.utcnow()
    deadline = hw.get("deadline")
    if deadline and isinstance(deadline, datetime):
        sub_status = "late" if now > deadline else "submitted"
    else:
        sub_status = "submitted"

    answers_payload = [
        {
            "question_id": a.question_id,
            "answer_text": a.answer_text,
            "score": None,
            "feedback": None,
            "evaluated_at": None,
        }
        for a in data.answers
    ]

    submission = {
        "homework_id": hw_oid,
        "student_id": user_id,
        "class_id": hw["class_id"],
        "subject": hw.get("subject", ""),
        "answers": answers_payload,
        "total_score": None,
        "max_score": None,
        "submitted_at": now,
        "status": sub_status,   # "submitted" or "late"
    }

    try:
        result = submissions_collection.insert_one(submission)
    except Exception as e:
        # Unique index violation → duplicate submission
        if "duplicate key" in str(e).lower() or "E11000" in str(e):
            raise HTTPException(
                status_code=409,
                detail="You have already submitted this homework. Contact your teacher to update your submission."
            )
        raise HTTPException(status_code=500, detail=f"Submission failed: {e}")

    # Atomically increment submission_count on the homework doc
    homework_collection.update_one(
        {"_id": hw_oid},
        {"$inc": {"submission_count": 1}}
    )

    return {
        "message": "Homework submitted successfully",
        "submission_id": str(result.inserted_id),
        "status": sub_status,
        "submitted_at": now.isoformat(),
        "late": sub_status == "late",
    }


# ─────────────────────────────
# 6. My Submission History
# ─────────────────────────────

@router.get("/submissions")
def get_my_submissions(user=Depends(require_role("student"))):
    """Get all homework submissions made by this student, newest first."""
    user_id = user["_id"]

    subs = list(submissions_collection.find(
        {"student_id": user_id}
    ).sort("submitted_at", -1))

    result = []
    for sub in subs:
        hw = homework_collection.find_one({"_id": sub["homework_id"]})
        submitted_at = sub.get("submitted_at")
        result.append({
            "submission_id": str(sub["_id"]),
            "homework_id": str(sub["homework_id"]),
            "homework_title": hw.get("title", "") if hw else "",
            "subject": sub.get("subject", ""),
            "status": sub.get("status", ""),
            "total_score": sub.get("total_score"),
            "max_score": sub.get("max_score"),
            "submitted_at": submitted_at.isoformat() if isinstance(submitted_at, datetime) else str(submitted_at),
        })

    return {"submissions": result, "count": len(result)}


# ─────────────────────────────
# 7. My Submission for Specific Homework
# ─────────────────────────────

@router.get("/submissions/{homework_id}")
def get_submission_for_homework(homework_id: str, user=Depends(require_role("student"))):
    """Get this student's submission for a specific homework."""
    user_id = user["_id"]
    hw_oid = ObjectId(homework_id)

    sub = submissions_collection.find_one({
        "homework_id": hw_oid,
        "student_id": user_id
    })
    if not sub:
        return {"submitted": False, "submission": None}

    submitted_at = sub.get("submitted_at")
    return {
        "submitted": True,
        "submission": {
            "submission_id": str(sub["_id"]),
            "status": sub.get("status", ""),
            "answers": sub.get("answers", []),
            "total_score": sub.get("total_score"),
            "max_score": sub.get("max_score"),
            "feedback": sub.get("feedback"),
            "submitted_at": submitted_at.isoformat() if isinstance(submitted_at, datetime) else str(submitted_at),
        }
    }


# ─────────────────────────────
# 8. My Progress (scores by subject over time)
# ─────────────────────────────

@router.get("/progress")
def get_my_progress(user=Depends(require_role("student"))):
    """Get this student's scores over time, grouped by subject."""
    user_id = user["_id"]

    pipeline = [
        {"$match": {"student_id": user_id, "status": "evaluated"}},
        {"$group": {
            "_id": "$subject",
            "submissions": {"$sum": 1},
            "total_scored": {"$sum": "$total_score"},
            "total_possible": {"$sum": "$max_score"},
            "avg_score": {"$avg": "$total_score"},
        }},
        {"$sort": {"_id": 1}},
    ]

    agg = list(submissions_collection.aggregate(pipeline))

    subjects = []
    for row in agg:
        subjects.append({
            "subject": row["_id"],
            "evaluated_submissions": row["submissions"],
            "total_scored": row["total_scored"],
            "total_possible": row["total_possible"],
            "average_score": round(row["avg_score"], 1) if row["avg_score"] is not None else None,
            "percentage": round(
                row["total_scored"] / row["total_possible"] * 100, 1
            ) if row.get("total_possible") else None,
        })

    return {
        "student_id": str(user_id),
        "progress_by_subject": subjects,
    }


# ─────────────────────────────
# 9. My Class Info
# ─────────────────────────────

@router.get("/my-class")
def get_my_class(user=Depends(require_role("student"))):
    """Get the student's class with teacher and classmate info."""
    user_id = user["_id"]

    cls = classes_collection.find_one({"students": user_id})
    if not cls:
        return {
            "message": "You are not enrolled in any class yet.",
            "class": None
        }

    teachers = []
    for t in cls.get("teachers", []):
        teacher = users_collection.find_one({"_id": t["teacher_id"]})
        if teacher:
            teachers.append({
                "id": str(teacher["_id"]),
                "name": teacher.get("name", ""),
                "subject": t["subject"],
            })

    classmates = []
    for sid in cls.get("students", []):
        if sid != user_id:
            student = users_collection.find_one({"_id": sid})
            if student:
                classmates.append({
                    "id": str(student["_id"]),
                    "name": student.get("name", ""),
                })

    return {
        "class": {
            "id": str(cls["_id"]),
            "school": cls.get("school", ""),
            "grade": cls.get("grade", ""),
            "teachers": teachers,
            "classmates": classmates,
            "classmate_count": len(classmates),
        }
    }


# ══════════════════════════════════════════════
# ENROLLMENT — Status & Re-Request
# ══════════════════════════════════════════════

@router.get("/enrollment-status")
def get_enrollment_status(user=Depends(require_role("student"))):
    """Get all enrollment requests for this student."""
    user_id = user["_id"]

    requests = list(enrollment_requests_collection.find(
        {"student_id": user_id}
    ).sort("requested_at", -1))

    result = []
    for req in requests:
        result.append({
            "id": str(req["_id"]),
            "school": req.get("school", ""),
            "grade": req.get("grade", ""),
            "status": req.get("status", ""),
            "requested_at": str(req.get("requested_at", "")),
            "responded_at": str(req.get("responded_at", "")) if req.get("responded_at") else None,
            "class_found": req.get("class_id") is not None,
        })

    return {"requests": result, "count": len(result)}


@router.post("/re-request")
def re_request_enrollment(data: ReRequestEnrollment, user=Depends(require_role("student"))):
    """Re-send an enrollment request after being rejected."""
    user_id = user["_id"]

    existing_pending = enrollment_requests_collection.find_one({
        "student_id": user_id,
        "school": data.school,
        "grade": data.grade,
        "status": "pending"
    })
    if existing_pending:
        raise HTTPException(
            status_code=400,
            detail=f"You already have a pending request for {data.school} - Grade {data.grade}"
        )

    existing_accepted = enrollment_requests_collection.find_one({
        "student_id": user_id,
        "school": data.school,
        "grade": data.grade,
        "status": "accepted"
    })
    if existing_accepted:
        raise HTTPException(
            status_code=400,
            detail=f"You are already enrolled in {data.school} - Grade {data.grade}"
        )

    cls = classes_collection.find_one({"school": data.school, "grade": data.grade})
    class_id = cls["_id"] if cls else None

    request_doc = {
        "student_id": user_id,
        "student_name": user.get("name", ""),
        "student_email": user.get("email", ""),
        "school": data.school,
        "grade": data.grade,
        "class_id": class_id,
        "status": "pending",
        "requested_at": datetime.utcnow(),
        "responded_by": None,
        "responded_at": None,
    }

    result = enrollment_requests_collection.insert_one(request_doc)

    users_collection.update_one(
        {"_id": user_id},
        {"$set": {"school": data.school, "grade": data.grade}}
    )

    return {
        "message": f"Enrollment request sent for {data.school} - Grade {data.grade}",
        "request_id": str(result.inserted_id),
        "status": "pending",
        "class_found": class_id is not None,
    }



# ─────────────────────────────
# Request Models
# ─────────────────────────────

class ReRequestEnrollment(BaseModel):
    school: str
    grade: str


# ─────────────────────────────
# 1. Student Dashboard
# ─────────────────────────────

@router.get("/dashboard")
def student_dashboard(user=Depends(require_role("student"))):
    """
    Get student dashboard data:
    - Their class info
    - Subjects with teachers
    - Pending homework count
    - Enrollment status (if not yet in a class)
    """
    user_id = user["_id"]

    # Find classes this student is in
    classes = list(classes_collection.find({"students": user_id}))

    subjects_with_teachers = []
    total_homework = 0

    for cls in classes:
        for t in cls.get("teachers", []):
            teacher = users_collection.find_one({"_id": t["teacher_id"]})
            teacher_name = teacher.get("name", "Unknown") if teacher else "Unknown"

            # Count homework for this subject in this class
            hw_count = homework_collection.count_documents({
                "class_id": cls["_id"],
                "subject": t["subject"],
                "status": "active"
            })
            total_homework += hw_count

            subjects_with_teachers.append({
                "subject": t["subject"],
                "teacher_name": teacher_name,
                "teacher_id": str(t["teacher_id"]),
                "class_id": str(cls["_id"]),
                "school": cls.get("school", ""),
                "grade": cls.get("grade", ""),
                "pending_homework": hw_count,
            })

    # Check enrollment status if student is not in any class
    enrollment_status = None
    if not classes:
        latest_request = enrollment_requests_collection.find_one(
            {"student_id": user_id},
            sort=[("requested_at", -1)]
        )
        if latest_request:
            enrollment_status = {
                "request_id": str(latest_request["_id"]),
                "school": latest_request.get("school", ""),
                "grade": latest_request.get("grade", ""),
                "status": latest_request.get("status", ""),
                "requested_at": str(latest_request.get("requested_at", "")),
                "class_found": latest_request.get("class_id") is not None,
            }
        else:
            enrollment_status = {"status": "none"}

    return {
        "message": f"Welcome {user['name']} to Student Dashboard",
        "student": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "school": user.get("school", ""),
            "grade": user.get("grade", ""),
        },
        "subjects": subjects_with_teachers,
        "total_pending_homework": total_homework,
        "total_classes": len(classes),
        "enrollment_status": enrollment_status,
    }


# ─────────────────────────────
# 2. My Subjects (from class)
# ─────────────────────────────

@router.get("/my-subjects")
def get_my_subjects(user=Depends(require_role("student"))):
    """
    Get all subjects for the logged-in student.
    Subjects are derived from which teachers are assigned to the student's class.
    """
    user_id = user["_id"]
    classes = list(classes_collection.find({"students": user_id}))

    subjects = []
    for cls in classes:
        for t in cls.get("teachers", []):
            teacher = users_collection.find_one({"_id": t["teacher_id"]})
            subjects.append({
                "subject": t["subject"],
                "teacher": {
                    "id": str(t["teacher_id"]),
                    "name": teacher.get("name", "Unknown") if teacher else "Unknown",
                    "email": teacher.get("email", "") if teacher else "",
                },
                "class_id": str(cls["_id"]),
                "school": cls.get("school", ""),
                "grade": cls.get("grade", ""),
            })

    return {"subjects": subjects, "count": len(subjects)}


# ─────────────────────────────
# 3. Homework by Subject
# ─────────────────────────────

@router.get("/homework/{subject}")
def get_homework_by_subject(subject: str, user=Depends(require_role("student"))):
    """
    Get all homework for a specific subject assigned to this student.
    Only returns homework from classes the student is enrolled in.
    """
    user_id = user["_id"]

    # Find classes this student is in
    classes = list(classes_collection.find({"students": user_id}))
    class_ids = [cls["_id"] for cls in classes]

    # Find homework for this subject in student's classes
    homework_list = list(homework_collection.find({
        "class_id": {"$in": class_ids},
        "subject": {"$regex": f"^{subject}$", "$options": "i"},
        "status": "active"
    }).sort("created_at", -1))

    result = []
    for hw in homework_list:
        result.append({
            "id": str(hw["_id"]),
            "title": hw.get("title", ""),
            "description": hw.get("description", ""),
            "subject": hw.get("subject", ""),
            "teacher_name": hw.get("teacher_name", ""),
            "task_type": hw.get("task_type", "homework"),
            "questions": hw.get("questions"),
            "due_date": hw.get("due_date"),
            "created_at": str(hw.get("created_at", "")),
            "school": hw.get("school", ""),
            "grade": hw.get("grade", ""),
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 4. All Pending Homework
# ─────────────────────────────

@router.get("/homework")
def get_all_homework(user=Depends(require_role("student"))):
    """Get all pending homework across all subjects for this student."""
    user_id = user["_id"]

    classes = list(classes_collection.find({"students": user_id}))
    class_ids = [cls["_id"] for cls in classes]

    homework_list = list(homework_collection.find({
        "class_id": {"$in": class_ids},
        "status": "active"
    }).sort("created_at", -1))

    result = []
    for hw in homework_list:
        result.append({
            "id": str(hw["_id"]),
            "title": hw.get("title", ""),
            "description": hw.get("description", ""),
            "subject": hw.get("subject", ""),
            "teacher_name": hw.get("teacher_name", ""),
            "task_type": hw.get("task_type", "homework"),
            "due_date": hw.get("due_date"),
            "created_at": str(hw.get("created_at", "")),
            "school": hw.get("school", ""),
            "grade": hw.get("grade", ""),
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 5. My Class Info
# ─────────────────────────────

@router.get("/my-class")
def get_my_class(user=Depends(require_role("student"))):
    """Get the student's class with teacher and classmate info."""
    user_id = user["_id"]

    cls = classes_collection.find_one({"students": user_id})
    if not cls:
        return {
            "message": "You are not enrolled in any class yet.",
            "class": None
        }

    # Teachers
    teachers = []
    for t in cls.get("teachers", []):
        teacher = users_collection.find_one({"_id": t["teacher_id"]})
        if teacher:
            teachers.append({
                "id": str(teacher["_id"]),
                "name": teacher.get("name", ""),
                "subject": t["subject"],
            })

    # Classmates (other students)
    classmates = []
    for sid in cls.get("students", []):
        if sid != user_id:
            student = users_collection.find_one({"_id": sid})
            if student:
                classmates.append({
                    "id": str(student["_id"]),
                    "name": student.get("name", ""),
                })

    return {
        "class": {
            "id": str(cls["_id"]),
            "school": cls.get("school", ""),
            "grade": cls.get("grade", ""),
            "teachers": teachers,
            "classmates": classmates,
            "classmate_count": len(classmates),
        }
    }


# ══════════════════════════════════════════════
# ENROLLMENT — Status & Re-Request
# ══════════════════════════════════════════════

@router.get("/enrollment-status")
def get_enrollment_status(user=Depends(require_role("student"))):
    """
    Get all enrollment requests for this student.
    Shows history of requests (pending, accepted, rejected).
    """
    user_id = user["_id"]

    requests = list(enrollment_requests_collection.find(
        {"student_id": user_id}
    ).sort("requested_at", -1))

    result = []
    for req in requests:
        result.append({
            "id": str(req["_id"]),
            "school": req.get("school", ""),
            "grade": req.get("grade", ""),
            "status": req.get("status", ""),
            "requested_at": str(req.get("requested_at", "")),
            "responded_at": str(req.get("responded_at", "")) if req.get("responded_at") else None,
            "class_found": req.get("class_id") is not None,
        })

    return {"requests": result, "count": len(result)}


@router.post("/re-request")
def re_request_enrollment(data: ReRequestEnrollment, user=Depends(require_role("student"))):
    """
    Re-send an enrollment request after being rejected.
    Student can choose the same or a different school/grade.
    """
    user_id = user["_id"]

    # Check if already has a pending request for this school+grade
    existing_pending = enrollment_requests_collection.find_one({
        "student_id": user_id,
        "school": data.school,
        "grade": data.grade,
        "status": "pending"
    })
    if existing_pending:
        raise HTTPException(
            status_code=400,
            detail=f"You already have a pending request for {data.school} - Grade {data.grade}"
        )

    # Check if already accepted for this school+grade
    existing_accepted = enrollment_requests_collection.find_one({
        "student_id": user_id,
        "school": data.school,
        "grade": data.grade,
        "status": "accepted"
    })
    if existing_accepted:
        raise HTTPException(
            status_code=400,
            detail=f"You are already enrolled in {data.school} - Grade {data.grade}"
        )

    # Find the class
    cls = classes_collection.find_one({"school": data.school, "grade": data.grade})
    class_id = cls["_id"] if cls else None

    # Create new enrollment request
    request_doc = {
        "student_id": user_id,
        "student_name": user.get("name", ""),
        "student_email": user.get("email", ""),
        "school": data.school,
        "grade": data.grade,
        "class_id": class_id,
        "status": "pending",
        "requested_at": datetime.utcnow(),
        "responded_by": None,
        "responded_at": None,
    }

    result = enrollment_requests_collection.insert_one(request_doc)

    # Update student's school and grade preference
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {"school": data.school, "grade": data.grade}}
    )

    return {
        "message": f"Enrollment request sent for {data.school} - Grade {data.grade}",
        "request_id": str(result.inserted_id),
        "status": "pending",
        "class_found": class_id is not None,
    }