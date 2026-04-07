"""
Teacher Router — Teacher-Specific Endpoints
============================================
- View assigned classes
- View students in class
- Assign homework for their subject
- View assigned homework
- Manage enrollment requests (accept/reject)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from core.database import users_collection, classes_collection, homework_collection, enrollment_requests_collection
from core.security import get_current_user, require_role
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/teacher", tags=["Teacher"])


# ─────────────────────────────
# Request Models
# ─────────────────────────────

class AssignHomeworkRequest(BaseModel):
    class_id: str
    subject: str
    title: str
    description: Optional[str] = ""
    questions: Optional[dict] = None   # Generated questions JSON from AI
    due_date: Optional[str] = None     # ISO date string
    task_type: Optional[str] = "homework"  # "homework" or "test"


class EnrollmentActionRequest(BaseModel):
    subject: str   # The subject the teacher is accepting/rejecting for


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

        # Find which subjects this teacher handles in this class
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

    # Count homework assigned by this teacher
    homework_count = homework_collection.count_documents({"teacher_id": user_id})

    # Count pending enrollment requests for this teacher's classes
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

        # Get student names
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

    # Verify teacher is assigned to this class
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
# 4. Assign Homework
# ─────────────────────────────

@router.post("/assign-homework")
def assign_homework(data: AssignHomeworkRequest, user=Depends(require_role("teacher"))):
    """
    Assign homework to a class for a specific subject.
    Only the teacher assigned for that subject can assign homework.
    This connects the AI-generated questions to specific class + subject.
    """
    # Find class
    cls = classes_collection.find_one({"_id": ObjectId(data.class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify this teacher is assigned for this subject in this class
    is_subject_teacher = any(
        t["teacher_id"] == user["_id"] and t["subject"].lower() == data.subject.lower()
        for t in cls.get("teachers", [])
    )

    if not is_subject_teacher:
        raise HTTPException(
            status_code=403,
            detail=f"You are not the '{data.subject}' teacher for this class. Only the assigned subject teacher can assign homework."
        )

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
        "due_date": data.due_date,
        "status": "active",
        "created_at": datetime.utcnow(),
        "student_ids": cls.get("students", []),  # Snapshot of students at assignment time
    }

    result = homework_collection.insert_one(homework)

    return {
        "message": f"Homework '{data.title}' assigned to {cls['school']} - Grade {cls['grade']} for {data.subject}",
        "homework_id": str(result.inserted_id),
    }


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
        result.append({
            "id": str(hw["_id"]),
            "class_id": str(hw.get("class_id", "")),
            "school": hw.get("school", ""),
            "grade": hw.get("grade", ""),
            "subject": hw.get("subject", ""),
            "title": hw.get("title", ""),
            "description": hw.get("description", ""),
            "task_type": hw.get("task_type", ""),
            "due_date": hw.get("due_date"),
            "status": hw.get("status", ""),
            "student_count": len(hw.get("student_ids", [])),
            "created_at": str(hw.get("created_at", "")),
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 6. Get Homework Detail
# ─────────────────────────────

@router.get("/homework/{homework_id}")
def get_homework_detail(homework_id: str, user=Depends(require_role("teacher"))):
    """Get full details of a specific homework including questions."""
    hw = homework_collection.find_one({"_id": ObjectId(homework_id)})
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    if hw["teacher_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="You can only view your own homework")

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
        "due_date": hw.get("due_date"),
        "status": hw.get("status", ""),
        "student_count": len(hw.get("student_ids", [])),
        "created_at": str(hw.get("created_at", "")),
    }


# ══════════════════════════════════════════════
# ENROLLMENT REQUESTS — Accept / Reject Students
# ══════════════════════════════════════════════

@router.get("/enrollment-requests")
def get_enrollment_requests(user=Depends(require_role("teacher"))):
    """
    Get all pending enrollment requests for classes this teacher belongs to.
    Each teacher sees requests for their classes.
    """
    user_id = user["_id"]

    # Get all class IDs where this teacher teaches
    classes = list(classes_collection.find({"teachers.teacher_id": user_id}))
    class_ids = [cls["_id"] for cls in classes]

    if not class_ids:
        return {"requests": [], "count": 0}

    # Find all pending requests for those classes
    requests = list(enrollment_requests_collection.find({
        "class_id": {"$in": class_ids},
        "status": "pending"
    }).sort("requested_at", -1))

    # Build class lookup for quick access
    class_lookup = {cls["_id"]: cls for cls in classes}

    result = []
    for req in requests:
        cls = class_lookup.get(req.get("class_id"))
        # Find which subjects this teacher handles in this class
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
            "my_subjects": my_subjects,  # Teacher's subjects in this class
        })

    return {"requests": result, "count": len(result)}


@router.post("/enrollment-requests/{request_id}/accept")
def accept_enrollment_request(
    request_id: str,
    data: EnrollmentActionRequest,
    user=Depends(require_role("teacher"))
):
    """
    Accept a student's enrollment request.
    The teacher accepts for their specific subject.
    When accepted, the student is added to the class.
    """
    user_id = user["_id"]

    # Find the enrollment request
    req = enrollment_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Enrollment request not found")

    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req['status']}")

    class_id = req.get("class_id")
    if not class_id:
        raise HTTPException(status_code=400, detail="No class associated with this request yet")

    # Verify teacher is assigned to this class for this subject
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

    # Add student to the class
    classes_collection.update_one(
        {"_id": class_id},
        {"$addToSet": {"students": student_id}}
    )

    # Update student's school/grade to match the class
    users_collection.update_one(
        {"_id": student_id},
        {"$set": {"grade": cls["grade"], "school": cls["school"]}}
    )

    # Mark the enrollment request as accepted
    enrollment_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "accepted",
            "responded_by": user_id,
            "responded_at": datetime.utcnow(),
            "accepted_subject": data.subject,
        }}
    )

    # If student has a parent, auto-add parent to this class
    parents = users_collection.find({"children": student_id, "role": "parent"})
    for parent in parents:
        classes_collection.update_one(
            {"_id": class_id},
            {"$addToSet": {"parents": parent["_id"]}}
        )

    return {
        "message": f"Student '{req['student_name']}' accepted into {cls['school']} - Grade {cls['grade']} for {data.subject}",
        "student_id": str(student_id),
        "class_id": str(class_id),
    }


@router.post("/enrollment-requests/{request_id}/reject")
def reject_enrollment_request(
    request_id: str,
    user=Depends(require_role("teacher"))
):
    """
    Reject a student's enrollment request.
    The student can re-request later (same or different grade).
    """
    user_id = user["_id"]

    # Find the enrollment request
    req = enrollment_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Enrollment request not found")

    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req['status']}")

    class_id = req.get("class_id")

    # Verify teacher is in this class
    if class_id:
        cls = classes_collection.find_one({"_id": class_id})
        if cls:
            is_assigned = any(
                t["teacher_id"] == user_id
                for t in cls.get("teachers", [])
            )
            if not is_assigned:
                raise HTTPException(status_code=403, detail="You are not a teacher in this class")

    # Mark as rejected
    enrollment_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "rejected",
            "responded_by": user_id,
            "responded_at": datetime.utcnow(),
        }}
    )

    return {
        "message": f"Enrollment request from '{req['student_name']}' has been rejected",
        "request_id": request_id,
    }
