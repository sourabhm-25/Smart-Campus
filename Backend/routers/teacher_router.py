"""
Teacher Router — Teacher-Specific Endpoints
============================================
- View assigned classes
- View students in class
- Preview students before assigning homework
- Assign homework for their subject (with deadline)
- View assigned homework + submission counts
- View and grade submissions
- Manage enrollment requests (accept/reject)
- Class analytics
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Optional, List
from core.database import (
    users_collection, classes_collection, homework_collection,
    enrollment_requests_collection, submissions_collection
)
from core.security import get_current_user, require_role
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/teacher", tags=["Teacher"])


# ─────────────────────────────
# Request Models
# ─────────────────────────────

class AssignHomeworkRequest(BaseModel):
    class_id: str
    subject: str
    title: str
    description: Optional[str] = ""
    questions: Optional[dict] = None        # Generated questions JSON from AI
    deadline: Optional[str] = None          # ISO 8601 datetime string e.g. "2026-04-25T23:59:00"
    task_type: Optional[str] = "homework"   # "homework" or "test"


class EnrollmentActionRequest(BaseModel):
    subject: str   # The subject the teacher is accepting/rejecting for


class ManualGradeRequest(BaseModel):
    total_score: int
    feedback: Optional[str] = ""


# ─────────────────────────────
# 1. Teacher Dashboard
# ─────────────────────────────

@router.get("/dashboard")
def teacher_dashboard(user=Depends(require_role("teacher"))):
    """
    Get teacher dashboard data:
    - Their assigned classes with student counts
    - Total students across all classes
    - Pending homework count
    - Pending enrollment requests count
    """
    user_id = user["_id"]

    # Get all classes where this teacher teaches
    classes = list(classes_collection.find({"teachers.teacher_id": user_id}))

    total_students = 0
    class_summaries = []
    class_ids = []

    for cls in classes:
        student_count = len(cls.get("students", []))
        total_students += student_count
        class_ids.append(cls["_id"])

        my_subjects = [
            t["subject"] for t in cls.get("teachers", [])
            if t["teacher_id"] == user_id
        ]

        class_summaries.append({
            "id": str(cls["_id"]),
            "school": cls.get("school", ""),
            "grade": cls.get("grade", ""),
            "student_count": student_count,
            "my_subjects": my_subjects,
        })

    homework_count = homework_collection.count_documents({"teacher_id": user_id})

    pending_requests = enrollment_requests_collection.count_documents({
        "class_id": {"$in": class_ids},
        "status": "pending"
    })

    return {
        "message": f"Welcome {user['name']} to Teacher Dashboard",
        "classes": class_summaries,
        "total_classes": len(classes),
        "total_students": total_students,
        "homework_assigned": homework_count,
        "pending_enrollment_requests": pending_requests,
    }


# ─────────────────────────────
# 2. My Classes (detailed)
# ─────────────────────────────

@router.get("/my-classes")
def my_classes(user=Depends(require_role("teacher"))):
    """Get all classes assigned to this teacher with full details."""
    user_id = user["_id"]
    classes = list(classes_collection.find({"teachers.teacher_id": user_id}))

    result = []
    for cls in classes:
        my_subjects = [
            t["subject"] for t in cls.get("teachers", [])
            if t["teacher_id"] == user_id
        ]

        students = []
        for sid in cls.get("students", []):
            student = users_collection.find_one({"_id": sid})
            if student:
                students.append({
                    "id": str(student["_id"]),
                    "name": student.get("name", ""),
                    "email": student.get("email", ""),
                })

        result.append({
            "id": str(cls["_id"]),
            "school": cls.get("school", ""),
            "grade": cls.get("grade", ""),
            "my_subjects": my_subjects,
            "students": students,
            "student_count": len(students),
        })

    return {"classes": result}


# ─────────────────────────────
# 3. Get Students in a Class
# ─────────────────────────────

@router.get("/class/{class_id}/students")
def get_class_students(class_id: str, user=Depends(require_role("teacher"))):
    """Get all students in a specific class."""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    is_assigned = any(
        t["teacher_id"] == user["_id"]
        for t in cls.get("teachers", [])
    )
    if not is_assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this class")

    students = []
    for sid in cls.get("students", []):
        student = users_collection.find_one({"_id": sid})
        if student:
            students.append({
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "email": student.get("email", ""),
                "grade": student.get("grade", ""),
            })

    return {
        "class_id": class_id,
        "school": cls.get("school", ""),
        "grade": cls.get("grade", ""),
        "students": students,
        "count": len(students)
    }


# ─────────────────────────────
# 3b. Preview Students Before Assigning (with optional filters)
#     Route: /teacher/class/{class_id}/students-preview
#     Different path to avoid conflict with /teacher/class/{class_id}/students
# ─────────────────────────────

@router.get("/class/{class_id}/students-preview")
def preview_class_students(
    class_id: str,
    subject: Optional[str] = Query(None, description="Filter context — not a DB filter, shown in response"),
    status: Optional[str] = Query("enrolled", description="enrolled = in class.students[], all shows everyone"),
    user=Depends(require_role("teacher"))
):
    """
    Preview which students will receive the homework before assigning.
    Returns all enrolled students (those in class.students[]).
    Use ?subject= to show which subject context this preview is for.
    """
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    is_assigned = any(
        t["teacher_id"] == user["_id"]
        for t in cls.get("teachers", [])
    )
    if not is_assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this class")

    # Enrolled = students who are in class.students[] (already accepted)
    student_ids = cls.get("students", [])
    students = []
    for sid in student_ids:
        student = users_collection.find_one({"_id": sid})
        if student:
            students.append({
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "email": student.get("email", ""),
                "grade": student.get("grade", ""),
            })

    return {
        "class_id": class_id,
        "school": cls.get("school", ""),
        "grade": cls.get("grade", ""),
        "subject_context": subject,
        "students": students,
        "count": len(students),
        "note": "These students will receive the homework when you assign it."
    }


# ─────────────────────────────
# 4. Assign Homework
# ─────────────────────────────

@router.post("/assign-homework")
def assign_homework(
    data: AssignHomeworkRequest,
    background_tasks: BackgroundTasks,
    user=Depends(require_role("teacher"))
):
    """
    Assign homework to a class for a specific subject.
    Only the teacher assigned for that subject can assign homework.
    Deadline is stored as datetime; notifications are fired in the background.
    """
    cls = classes_collection.find_one({"_id": ObjectId(data.class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    is_subject_teacher = any(
        t["teacher_id"] == user["_id"] and t["subject"].lower() == data.subject.lower()
        for t in cls.get("teachers", [])
    )
    if not is_subject_teacher:
        raise HTTPException(
            status_code=403,
            detail=f"You are not the '{data.subject}' teacher for this class."
        )

    # Parse deadline to datetime if provided
    deadline_dt = None
    if data.deadline:
        try:
            deadline_dt = datetime.fromisoformat(data.deadline)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid deadline format '{data.deadline}'. Use ISO 8601: 2026-04-25T23:59:00"
            )

    student_ids_snapshot = cls.get("students", [])

    homework = {
        "class_id": cls["_id"],
        "teacher_id": user["_id"],
        "teacher_name": user.get("name", ""),
        "school": cls.get("school", ""),
        "grade": cls.get("grade", ""),
        "subject": data.subject,
        "title": data.title,
        "description": data.description,
        "questions": data.questions,
        "task_type": data.task_type,
        "deadline": deadline_dt,           # datetime or None
        "status": "active",
        "submission_count": 0,             # incremented atomically on each submission
        "created_at": datetime.utcnow(),
        "student_ids": student_ids_snapshot,
    }

    result = homework_collection.insert_one(homework)
    homework_id = str(result.inserted_id)

    # Fire notifications in background (non-blocking) — implemented in Step 4
    background_tasks.add_task(
        _notify_homework_assigned,
        homework_id=homework_id,
        student_ids=student_ids_snapshot,
        subject=data.subject,
        title=data.title,
        class_id=str(cls["_id"]),
    )

    return {
        "message": f"Homework '{data.title}' assigned to {cls['school']} - Grade {cls['grade']} for {data.subject}",
        "homework_id": homework_id,
        "deadline": data.deadline,
        "student_count": len(student_ids_snapshot),
    }


def _notify_homework_assigned(homework_id, student_ids, subject, title, class_id):
    """
    Background task: write a notification for every student (and their parents)
    when a new homework is assigned. Imported from notification_service in Step 4.
    """
    try:
        from services.notification_service import notify_users
        payload = {
            "homework_id": homework_id,
            "class_id": class_id,
            "message": f"New {subject} homework assigned: {title}",
        }
        # Notify students
        notify_users(student_ids, "homework_assigned", payload)
        # Notify parents of each student
        for sid in student_ids:
            parents = list(users_collection.find({"children": sid, "role": "parent"}))
            parent_ids = [p["_id"] for p in parents]
            if parent_ids:
                notify_users(parent_ids, "homework_assigned", payload)
    except ImportError:
        pass  # notification_service not yet available — silent until Step 4


# ─────────────────────────────
# 5. View Assigned Homework
# ─────────────────────────────

@router.get("/homework")
def get_my_homework(user=Depends(require_role("teacher"))):
    """Get all homework assigned by this teacher."""
    homework_list = list(homework_collection.find(
        {"teacher_id": user["_id"]}
    ).sort("created_at", -1))

    result = []
    for hw in homework_list:
        deadline = hw.get("deadline")
        result.append({
            "id": str(hw["_id"]),
            "class_id": str(hw.get("class_id", "")),
            "school": hw.get("school", ""),
            "grade": hw.get("grade", ""),
            "subject": hw.get("subject", ""),
            "title": hw.get("title", ""),
            "description": hw.get("description", ""),
            "task_type": hw.get("task_type", ""),
            "deadline": deadline.isoformat() if isinstance(deadline, datetime) else deadline,
            "status": hw.get("status", ""),
            "student_count": len(hw.get("student_ids", [])),
            "submission_count": hw.get("submission_count", 0),
            "created_at": str(hw.get("created_at", "")),
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 6. Get Homework Detail
# ─────────────────────────────

@router.get("/homework/{homework_id}")
def get_homework_detail(homework_id: str, user=Depends(require_role("teacher"))):
    """Get full details of a specific homework including questions and submission count."""
    hw = homework_collection.find_one({"_id": ObjectId(homework_id)})
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    if hw["teacher_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="You can only view your own homework")

    deadline = hw.get("deadline")
    return {
        "id": str(hw["_id"]),
        "class_id": str(hw.get("class_id", "")),
        "school": hw.get("school", ""),
        "grade": hw.get("grade", ""),
        "subject": hw.get("subject", ""),
        "title": hw.get("title", ""),
        "description": hw.get("description", ""),
        "questions": hw.get("questions"),
        "task_type": hw.get("task_type", ""),
        "deadline": deadline.isoformat() if isinstance(deadline, datetime) else deadline,
        "status": hw.get("status", ""),
        "student_count": len(hw.get("student_ids", [])),
        "submission_count": hw.get("submission_count", 0),
        "created_at": str(hw.get("created_at", "")),
    }


# ─────────────────────────────
# 7. View All Submissions for a Homework
# ─────────────────────────────

@router.get("/homework/{homework_id}/submissions")
def get_homework_submissions(homework_id: str, user=Depends(require_role("teacher"))):
    """Get all student submissions for a specific homework."""
    hw = homework_collection.find_one({"_id": ObjectId(homework_id)})
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    if hw["teacher_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="You can only view submissions for your own homework")

    hw_oid = ObjectId(homework_id)
    subs = list(submissions_collection.find({"homework_id": hw_oid}).sort("submitted_at", -1))

    result = []
    for sub in subs:
        student = users_collection.find_one({"_id": sub["student_id"]})
        submitted_at = sub.get("submitted_at")
        result.append({
            "submission_id": str(sub["_id"]),
            "student_id": str(sub["student_id"]),
            "student_name": student.get("name", "Unknown") if student else "Unknown",
            "student_email": student.get("email", "") if student else "",
            "status": sub.get("status", "submitted"),
            "total_score": sub.get("total_score"),
            "max_score": sub.get("max_score"),
            "submitted_at": submitted_at.isoformat() if isinstance(submitted_at, datetime) else str(submitted_at),
            "answers": sub.get("answers", []),
        })

    enrolled_count = len(hw.get("student_ids", []))
    return {
        "homework_id": homework_id,
        "title": hw.get("title", ""),
        "subject": hw.get("subject", ""),
        "submissions": result,
        "submitted_count": len(result),
        "enrolled_count": enrolled_count,
        "completion_rate": round(len(result) / enrolled_count * 100, 1) if enrolled_count else 0,
    }


# ─────────────────────────────
# 8. Manually Grade a Submission
# ─────────────────────────────

@router.post("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: str,
    data: ManualGradeRequest,
    background_tasks: BackgroundTasks,
    user=Depends(require_role("teacher"))
):
    """Manually grade a student's submission and notify the student."""
    sub = submissions_collection.find_one({"_id": ObjectId(submission_id)})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Verify this teacher owns the homework
    hw = homework_collection.find_one({"_id": sub["homework_id"]})
    if not hw or hw["teacher_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="You can only grade submissions for your own homework")

    submissions_collection.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {
            "total_score": data.total_score,
            "feedback": data.feedback,
            "status": "evaluated",
            "graded_by": user["_id"],
            "graded_at": datetime.utcnow(),
        }}
    )

    # Notify student (and their parents) in background
    background_tasks.add_task(
        _notify_submission_graded,
        student_id=sub["student_id"],
        submission_id=submission_id,
        homework_title=hw.get("title", ""),
        subject=hw.get("subject", ""),
        total_score=data.total_score,
    )

    return {
        "message": "Submission graded",
        "submission_id": submission_id,
        "total_score": data.total_score,
    }


def _notify_submission_graded(student_id, submission_id, homework_title, subject, total_score):
    """Background task: notify student + parents that a submission was graded."""
    try:
        from services.notification_service import notify_users
        payload = {
            "submission_id": submission_id,
            "message": f"Your {subject} submission '{homework_title}' was graded: {total_score} marks",
        }
        notify_users([student_id], "submission_graded", payload)
        parents = list(users_collection.find({"children": student_id, "role": "parent"}))
        parent_ids = [p["_id"] for p in parents]
        if parent_ids:
            notify_users(parent_ids, "submission_graded", payload)
    except ImportError:
        pass


# ─────────────────────────────
# 9. Class Analytics
# ─────────────────────────────

@router.get("/class/{class_id}/analytics")
def get_class_analytics(class_id: str, user=Depends(require_role("teacher"))):
    """
    Aggregate analytics for a class:
    - Total homework assigned
    - Overall completion rate across all homework
    - Average score across all evaluated submissions
    """
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    is_assigned = any(t["teacher_id"] == user["_id"] for t in cls.get("teachers", []))
    if not is_assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this class")

    class_oid = ObjectId(class_id)
    hw_list = list(homework_collection.find({"class_id": class_oid, "teacher_id": user["_id"]}))
    hw_ids = [hw["_id"] for hw in hw_list]

    enrolled_count = len(cls.get("students", []))
    total_submissions = submissions_collection.count_documents({"homework_id": {"$in": hw_ids}})
    total_possible = len(hw_list) * enrolled_count

    # Average score across evaluated submissions
    pipeline = [
        {"$match": {"homework_id": {"$in": hw_ids}, "status": "evaluated", "total_score": {"$exists": True}}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$total_score"}, "max_score": {"$avg": "$max_score"}}},
    ]
    agg = list(submissions_collection.aggregate(pipeline))
    avg_score = round(agg[0]["avg_score"], 1) if agg else None
    avg_max = round(agg[0]["max_score"], 1) if agg else None

    return {
        "class_id": class_id,
        "school": cls.get("school", ""),
        "grade": cls.get("grade", ""),
        "enrolled_students": enrolled_count,
        "total_homework_assigned": len(hw_list),
        "total_submissions": total_submissions,
        "total_possible_submissions": total_possible,
        "overall_completion_rate": round(total_submissions / total_possible * 100, 1) if total_possible else 0,
        "average_score": avg_score,
        "average_max_score": avg_max,
    }


# ══════════════════════════════════════════════
# ENROLLMENT REQUESTS — Accept / Reject Students
# ══════════════════════════════════════════════

@router.get("/enrollment-requests")
def get_enrollment_requests(user=Depends(require_role("teacher"))):
    """
    Get all pending enrollment requests for classes this teacher belongs to.
    """
    user_id = user["_id"]

    classes = list(classes_collection.find({"teachers.teacher_id": user_id}))
    class_ids = [cls["_id"] for cls in classes]

    if not class_ids:
        return {"requests": [], "count": 0}

    requests = list(enrollment_requests_collection.find({
        "class_id": {"$in": class_ids},
        "status": "pending"
    }).sort("requested_at", -1))

    class_lookup = {cls["_id"]: cls for cls in classes}

    result = []
    for req in requests:
        cls = class_lookup.get(req.get("class_id"))
        my_subjects = []
        if cls:
            my_subjects = [
                t["subject"] for t in cls.get("teachers", [])
                if t["teacher_id"] == user_id
            ]

        result.append({
            "id": str(req["_id"]),
            "student_id": str(req["student_id"]),
            "student_name": req.get("student_name", ""),
            "student_email": req.get("student_email", ""),
            "school": req.get("school", ""),
            "grade": req.get("grade", ""),
            "class_id": str(req["class_id"]) if req.get("class_id") else None,
            "status": req.get("status", ""),
            "requested_at": str(req.get("requested_at", "")),
            "my_subjects": my_subjects,
        })

    return {"requests": result, "count": len(result)}


@router.post("/enrollment-requests/{request_id}/accept")
def accept_enrollment_request(
    request_id: str,
    data: EnrollmentActionRequest,
    background_tasks: BackgroundTasks,
    user=Depends(require_role("teacher"))
):
    """Accept a student's enrollment request."""
    user_id = user["_id"]

    req = enrollment_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Enrollment request not found")

    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req['status']}")

    class_id = req.get("class_id")
    if not class_id:
        raise HTTPException(status_code=400, detail="No class associated with this request yet")

    cls = classes_collection.find_one({"_id": class_id})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    is_subject_teacher = any(
        t["teacher_id"] == user_id and t["subject"].lower() == data.subject.lower()
        for t in cls.get("teachers", [])
    )
    if not is_subject_teacher:
        raise HTTPException(
            status_code=403,
            detail=f"You are not the '{data.subject}' teacher for this class"
        )

    student_id = req["student_id"]

    classes_collection.update_one(
        {"_id": class_id},
        {"$addToSet": {"students": student_id}}
    )

    users_collection.update_one(
        {"_id": student_id},
        {"$set": {"grade": cls["grade"], "school": cls["school"]}}
    )

    enrollment_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "accepted",
            "responded_by": user_id,
            "responded_at": datetime.utcnow(),
            "accepted_subject": data.subject,
        }}
    )

    # Auto-add parent to this class
    parents = list(users_collection.find({"children": student_id, "role": "parent"}))
    for parent in parents:
        classes_collection.update_one(
            {"_id": class_id},
            {"$addToSet": {"parents": parent["_id"]}}
        )

    # Notify student + parents
    background_tasks.add_task(
        _notify_enrollment_result,
        student_id=student_id,
        accepted=True,
        school=cls["school"],
        grade=cls["grade"],
        subject=data.subject,
    )

    return {
        "message": f"Student '{req['student_name']}' accepted into {cls['school']} - Grade {cls['grade']} for {data.subject}",
        "student_id": str(student_id),
        "class_id": str(class_id),
    }


@router.post("/enrollment-requests/{request_id}/reject")
def reject_enrollment_request(
    request_id: str,
    background_tasks: BackgroundTasks,
    user=Depends(require_role("teacher"))
):
    """Reject a student's enrollment request."""
    user_id = user["_id"]

    req = enrollment_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Enrollment request not found")

    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req['status']}")

    class_id = req.get("class_id")

    if class_id:
        cls = classes_collection.find_one({"_id": class_id})
        if cls:
            is_assigned = any(t["teacher_id"] == user_id for t in cls.get("teachers", []))
            if not is_assigned:
                raise HTTPException(status_code=403, detail="You are not a teacher in this class")

    enrollment_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "rejected",
            "responded_by": user_id,
            "responded_at": datetime.utcnow(),
        }}
    )

    background_tasks.add_task(
        _notify_enrollment_result,
        student_id=req["student_id"],
        accepted=False,
        school=req.get("school", ""),
        grade=req.get("grade", ""),
        subject="",
    )

    return {
        "message": f"Enrollment request from '{req['student_name']}' has been rejected",
        "request_id": request_id,
    }


def _notify_enrollment_result(student_id, accepted, school, grade, subject):
    """Background task: notify student + parents of enrollment accept/reject."""
    try:
        from services.notification_service import notify_users
        ntype = "enrollment_accepted" if accepted else "enrollment_rejected"
        msg = (
            f"Your enrollment in {school} Grade {grade} for {subject} was accepted."
            if accepted
            else f"Your enrollment request for {school} Grade {grade} was rejected."
        )
        payload = {"message": msg, "school": school, "grade": grade}
        notify_users([student_id], ntype, payload)
        parents = list(users_collection.find({"children": student_id, "role": "parent"}))
        parent_ids = [p["_id"] for p in parents]
        if parent_ids:
            notify_users(parent_ids, ntype, payload)
    except ImportError:
        pass

