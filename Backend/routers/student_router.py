"""
Student Router — Student-Specific Endpoints
============================================
- Dashboard with class + teacher info
- View subjects (derived from class teachers)
- View homework assigned per subject
- View class details
- Enrollment status & re-request
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.database import users_collection, classes_collection, homework_collection, enrollment_requests_collection
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