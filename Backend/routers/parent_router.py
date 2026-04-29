"""
Parent Router — Parent-Specific Endpoints
==========================================
- View connected children
- View child's class, subjects, teachers
- View child's homework, submissions, and progress
- Generate and view report cards
- Track child attendance
- Parent-child linking management
- Progress analytics and insights
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from core.database import (
    users_collection, classes_collection, homework_collection, 
    submissions_collection, notifications_collection
)
from core.security import require_role
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter(prefix="/parent", tags=["Parent"])


# ─────────────────────────────
# Request Models
# ─────────────────────────────

class LinkChildRequest(BaseModel):
    """Link a parent to a child using child's email."""
    child_email: EmailStr


class UpdateChildContactRequest(BaseModel):
    """Update contact info for a child."""
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None


# ─────────────────────────────
# 1. Parent Dashboard (All Children Overview)
# ─────────────────────────────

@router.get("/dashboard")
def parent_dashboard(user=Depends(require_role("parent"))):
    """
    Get parent dashboard overview:
    - List of all children with their class, grade, school
    - Each child's subjects and teachers
    - Pending homework for each child
    - Quick metrics (total pending homework, etc.)
    """
    children_ids = user.get("children", [])

    if not children_ids:
        return {
            "message": f"Welcome {user['name']}",
            "children": [],
            "total_children": 0,
            "total_pending_homework": 0,
        }

    children_data = []
    total_pending_hw = 0

    for child_id in children_ids:
        child = users_collection.find_one({"_id": child_id})
        if not child:
            continue

        # Find child's class
        cls = classes_collection.find_one({"students": child_id})

        subjects = []
        pending_hw = 0
        if cls:
            for t in cls.get("teachers", []):
                teacher = users_collection.find_one({"_id": t["teacher_id"]})
                hw_count = homework_collection.count_documents({
                    "class_id": cls["_id"],
                    "subject": t["subject"],
                    "status": "active"
                })
                pending_hw += hw_count

                subjects.append({
                    "subject": t["subject"],
                    "teacher_name": teacher.get("name", "Unknown") if teacher else "Unknown",
                    "pending_homework": hw_count,
                })

        total_pending_hw += pending_hw

        children_data.append({
            "id": str(child["_id"]),
            "name": child.get("name", ""),
            "email": child.get("email", ""),
            "school": child.get("school", ""),
            "grade": child.get("grade", ""),
            "class_id": str(cls["_id"]) if cls else None,
            "subjects": subjects,
            "total_pending_homework": pending_hw,
        })

    return {
        "message": f"Welcome {user['name']}",
        "children": children_data,
        "total_children": len(children_data),
        "total_pending_homework": total_pending_hw,
    }


# ─────────────────────────────
# 2. Get Child's Homework with Status
# ─────────────────────────────

@router.get("/child/{child_id}/homework")
def get_child_homework(child_id: str, user=Depends(require_role("parent"))):
    """Get all active and past homework for a specific child."""
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Find child's classes
    classes = list(classes_collection.find({"students": child_oid}))
    class_ids = [cls["_id"] for cls in classes]

    # Get all homework (active and past)
    homework_list = list(homework_collection.find({
        "class_id": {"$in": class_ids},
    }).sort("deadline", -1))

    result = []
    for hw in homework_list:
        # Check if child submitted
        submission = submissions_collection.find_one({
            "homework_id": hw["_id"],
            "student_id": child_oid
        })

        deadline = hw.get("deadline")
        is_late = False
        if submission and deadline and isinstance(deadline, datetime):
            is_late = submission.get("submitted_at", datetime.utcnow()) > deadline

        result.append({
            "id": str(hw["_id"]),
            "title": hw.get("title", ""),
            "subject": hw.get("subject", ""),
            "teacher_name": hw.get("teacher_name", ""),
            "description": hw.get("description", ""),
            "task_type": hw.get("task_type", "homework"),
            "deadline": deadline.isoformat() if isinstance(deadline, datetime) else deadline,
            "status": hw.get("status", "active"),
            "submission_status": "submitted" if submission else "pending",
            "is_late": is_late,
            "submission_score": submission.get("total_score") if submission else None,
            "max_score": submission.get("max_score") if submission else None,
            "created_at": str(hw.get("created_at", "")),
        })

    return {
        "child": {"id": child_id, "name": child.get("name", "")},
        "homework": result,
        "count": len(result),
    }


# ─────────────────────────────
# 3. Get Child's Submissions & Scores
# ─────────────────────────────

@router.get("/child/{child_id}/submissions")
def get_child_submissions(child_id: str, user=Depends(require_role("parent"))):
    """Get all homework submissions and scores for a specific child."""
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    subs = list(submissions_collection.find(
        {"student_id": child_oid}
    ).sort("submitted_at", -1))

    result = []
    for sub in subs:
        hw = homework_collection.find_one({"_id": sub["homework_id"]})
        submitted_at = sub.get("submitted_at")
        result.append({
            "submission_id": str(sub["_id"]),
            "homework_id": str(sub["homework_id"]),
            "homework_title": hw.get("title", "") if hw else "",
            "subject": hw.get("subject", "") if hw else sub.get("subject", ""),
            "status": sub.get("status", "pending"),
            "total_score": sub.get("total_score"),
            "max_score": sub.get("max_score"),
            "percentage": round((sub.get("total_score", 0) / sub.get("max_score", 1)) * 100, 1) if sub.get("max_score") else None,
            "feedback": sub.get("feedback", ""),
            "submitted_at": submitted_at.isoformat() if isinstance(submitted_at, datetime) else str(submitted_at),
        })

    return {
        "child": {"id": child_id, "name": child.get("name", "")},
        "submissions": result,
        "count": len(result),
    }


# ─────────────────────────────
# 4. Get Child's Progress by Subject
# ─────────────────────────────

@router.get("/child/{child_id}/progress")
def get_child_progress(child_id: str, user=Depends(require_role("parent"))):
    """Get aggregate scores and completion rate for a child, grouped by subject."""
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Get overall statistics
    pipeline = [
        {"$match": {"student_id": child_oid}},
        {"$group": {
            "_id": "$subject",
            "total_submissions": {"$sum": 1},
            "evaluated_submissions": {
                "$sum": {"$cond": [{"$eq": ["$status", "evaluated"]}, 1, 0]}
            },
            "total_scored": {"$sum": "$total_score"},
            "total_possible": {"$sum": "$max_score"},
            "avg_score": {"$avg": "$total_score"},
        }},
        {"$sort": {"_id": 1}},
    ]

    agg = list(submissions_collection.aggregate(pipeline))

    subjects = []
    overall_avg = None
    overall_total_score = 0
    overall_total_possible = 0
    overall_submissions = 0

    for row in agg:
        percentage = None
        if row.get("total_possible"):
            percentage = round(row["total_scored"] / row["total_possible"] * 100, 1)

        subjects.append({
            "subject": row["_id"],
            "total_submissions": row["total_submissions"],
            "evaluated_submissions": row["evaluated_submissions"],
            "total_scored": row["total_scored"],
            "total_possible": row["total_possible"],
            "average_score": round(row["avg_score"], 1) if row["avg_score"] is not None else None,
            "percentage": percentage,
            "completion_rate": round((row["evaluated_submissions"] / row["total_submissions"]) * 100, 1) if row["total_submissions"] > 0 else 0,
        })

        overall_total_score += row["total_scored"]
        overall_total_possible += row["total_possible"]
        overall_submissions += row["total_submissions"]

    if overall_total_possible > 0:
        overall_avg = round((overall_total_score / overall_total_possible) * 100, 1)

    return {
        "child": {"id": child_id, "name": child.get("name", "")},
        "overall_percentage": overall_avg,
        "total_submissions": overall_submissions,
        "progress_by_subject": subjects,
    }


# ─────────────────────────────
# 5. Generate Report Card
# ─────────────────────────────

@router.get("/child/{child_id}/report-card")
def generate_report_card(child_id: str, user=Depends(require_role("parent"))):
    """
    Generate a comprehensive report card for a child:
    - Overall performance across all subjects
    - Individual subject scores and grades
    - Attendance summary
    - Strengths and areas for improvement
    """
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Get class info
    cls = classes_collection.find_one({"students": child_oid})
    if not cls:
        raise HTTPException(status_code=404, detail="Child not enrolled in any class")

    # Get all submissions for this student
    pipeline = [
        {"$match": {"student_id": child_oid, "status": "evaluated"}},
        {"$group": {
            "_id": "$subject",
            "total_submissions": {"$sum": 1},
            "total_score": {"$sum": "$total_score"},
            "max_possible": {"$sum": "$max_score"},
            "avg_score": {"$avg": "$total_score"},
        }},
        {"$sort": {"_id": 1}},
    ]

    agg = list(submissions_collection.aggregate(pipeline))

    # Calculate letter grades
    def score_to_grade(percentage):
        if percentage >= 90:
            return "A"
        elif percentage >= 80:
            return "B"
        elif percentage >= 70:
            return "C"
        elif percentage >= 60:
            return "D"
        else:
            return "F"

    subjects_performance = []
    overall_total_score = 0
    overall_total_possible = 0

    for row in agg:
        percentage = (row["total_score"] / row["max_possible"] * 100) if row["max_possible"] > 0 else 0
        grade = score_to_grade(percentage)

        subjects_performance.append({
            "subject": row["_id"],
            "submissions": row["total_submissions"],
            "total_score": row["total_score"],
            "max_possible": row["max_possible"],
            "average": round(row["avg_score"], 2),
            "percentage": round(percentage, 1),
            "grade": grade,
        })

        overall_total_score += row["total_score"]
        overall_total_possible += row["max_possible"]

    overall_percentage = (overall_total_score / overall_total_possible * 100) if overall_total_possible > 0 else 0
    overall_grade = score_to_grade(overall_percentage)

    return {
        "report_card": {
            "child_name": child.get("name", ""),
            "child_id": child_id,
            "school": cls.get("school", ""),
            "grade": cls.get("grade", ""),
            "generated_at": datetime.utcnow().isoformat(),
            "overall_percentage": round(overall_percentage, 1),
            "overall_grade": overall_grade,
            "total_evaluated_submissions": sum(s["submissions"] for s in subjects_performance),
            "subjects": subjects_performance,
        }
    }


# ─────────────────────────────
# 6. Get Child's Class Info
# ─────────────────────────────

@router.get("/child/{child_id}/class")
def get_child_class(child_id: str, user=Depends(require_role("parent"))):
    """Get class information for a specific child."""
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    cls = classes_collection.find_one({"students": child_oid})
    if not cls:
        return {
            "message": f"{child.get('name', '')} is not enrolled in any class yet.",
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
                "email": teacher.get("email", ""),
            })

    classmates = []
    for sid in cls.get("students", []):
        if sid != child_oid:
            student = users_collection.find_one({"_id": sid})
            if student:
                classmates.append({
                    "id": str(student["_id"]),
                    "name": student.get("name", ""),
                })

    return {
        "child": {
            "id": str(child["_id"]),
            "name": child.get("name", ""),
        },
        "class": {
            "id": str(cls["_id"]),
            "school": cls.get("school", ""),
            "grade": cls.get("grade", ""),
            "teachers": teachers,
            "classmates": classmates,
            "classmate_count": len(classmates),
        }
    }


# ─────────────────────────────
# 7. Link a New Child
# ─────────────────────────────

@router.post("/link-child")
def link_child(request: LinkChildRequest, user=Depends(require_role("parent"))):
    """Link a parent to a child using the child's email."""
    parent_id = user["_id"]
    child_email = request.child_email

    # Find the child by email
    child = users_collection.find_one({"email": child_email, "role": "student"})
    if not child:
        raise HTTPException(status_code=404, detail=f"No student found with email '{child_email}'")

    child_id = child["_id"]

    # Check if already linked
    if child_id in user.get("children", []):
        raise HTTPException(status_code=400, detail="This child is already linked to your account")

    # Add child to parent's children array
    users_collection.update_one(
        {"_id": parent_id},
        {"$addToSet": {"children": child_id}}
    )

    # Add parent to child's class (if class exists)
    classes_collection.update_many(
        {"students": child_id},
        {"$addToSet": {"parents": parent_id}}
    )

    return {
        "success": True,
        "message": f"Successfully linked {child.get('name', '')} to your account",
        "child": {
            "id": str(child_id),
            "name": child.get("name", ""),
            "email": child.get("email", ""),
        }
    }


# ─────────────────────────────
# 8. Get Parent's Notifications
# ─────────────────────────────

@router.get("/notifications")
def get_parent_notifications(
    limit: int = Query(10, ge=1, le=50),
    user=Depends(require_role("parent"))
):
    """Get notifications for parent (homework assigned, submissions graded, etc.)"""
    parent_id = user["_id"]

    notifications = list(notifications_collection.find(
        {"user_id": parent_id}
    ).sort("created_at", -1).limit(limit))

    result = []
    for notif in notifications:
        result.append({
            "id": str(notif["_id"]),
            "title": notif.get("title", ""),
            "message": notif.get("message", ""),
            "type": notif.get("type", ""),
            "read": notif.get("read", False),
            "created_at": notif.get("created_at").isoformat() if isinstance(notif.get("created_at"), datetime) else str(notif.get("created_at")),
        })

    return {
        "notifications": result,
        "count": len(result),
    }


# ─────────────────────────────
# 9. Get Child's Teachers (Contact Info)
# ─────────────────────────────

@router.get("/child/{child_id}/teachers")
def get_child_teachers(child_id: str, user=Depends(require_role("parent"))):
    """Get list of teachers for a child with contact information."""
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Find child's class
    cls = classes_collection.find_one({"students": child_oid})
    if not cls:
        return {
            "child": {"id": child_id, "name": child.get("name", "")},
            "teachers": [],
            "message": "Child not enrolled in any class"
        }

    teachers = []
    for t in cls.get("teachers", []):
        teacher = users_collection.find_one({"_id": t["teacher_id"]})
        if teacher:
            teachers.append({
                "id": str(teacher["_id"]),
                "name": teacher.get("name", ""),
                "subject": t["subject"],
                "email": teacher.get("email", ""),
                "school": teacher.get("school", ""),
            })

    return {
        "child": {"id": child_id, "name": child.get("name", "")},
        "teachers": teachers,
        "count": len(teachers),
    }


# ─────────────────────────────
# 10. Get Child's Attendance Summary (Mock)
# ─────────────────────────────

@router.get("/child/{child_id}/attendance")
def get_child_attendance(child_id: str, user=Depends(require_role("parent"))):
    """
    Get attendance summary for a child.
    
    Note: This is a mock implementation. To fully implement:
    1. Add 'attendance' collection to database
    2. Integrate with school attendance system
    3. Sync daily attendance data
    """
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Find child's class for grade info
    cls = classes_collection.find_one({"students": child_oid})
    
    # Mock attendance data
    mock_attendance = {
        "child": {"id": child_id, "name": child.get("name", "")},
        "class": {
            "grade": cls.get("grade", "") if cls else "",
            "school": cls.get("school", "") if cls else "",
        },
        "attendance_summary": {
            "total_days": 180,
            "present_days": 165,
            "absent_days": 12,
            "leave_days": 3,
            "attendance_percentage": round((165 / 180) * 100, 1),
        },
        "monthly_breakdown": [
            {"month": "January", "present": 18, "absent": 2, "percentage": 90},
            {"month": "February", "present": 16, "absent": 2, "percentage": 88},
            {"month": "March", "present": 19, "absent": 1, "percentage": 95},
            {"month": "April", "present": 17, "absent": 2, "percentage": 89},
            {"month": "May", "present": 18, "absent": 2, "percentage": 90},
            {"month": "June", "present": 19, "absent": 1, "percentage": 95},
        ],
        "note": "Full attendance tracking requires integration with school management system",
    }

    return mock_attendance


# ─────────────────────────────
# 11. Get Child's Behavior/Conduct Notes (Mock)
# ─────────────────────────────

@router.get("/child/{child_id}/conduct")
def get_child_conduct(child_id: str, user=Depends(require_role("parent"))):
    """
    Get conduct/behavior summary from teachers.
    
    Note: This is a mock implementation. Teachers can add conduct notes via a separate endpoint.
    """
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Mock conduct data
    mock_conduct = {
        "child": {"id": child_id, "name": child.get("name", "")},
        "overall_conduct": "Excellent",
        "conduct_rating": 4.5,  # Out of 5
        "teacher_comments": [
            {
                "teacher": "Ms. Smith",
                "subject": "Mathematics",
                "comment": "Very attentive in class. Shows great problem-solving skills.",
                "date": "2026-04-25"
            },
            {
                "teacher": "Mr. Johnson",
                "subject": "English",
                "comment": "Participates well in discussions. Needs to work on punctuality.",
                "date": "2026-04-20"
            },
            {
                "teacher": "Dr. Lee",
                "subject": "Science",
                "comment": "Excellent practical work. Creative thinking demonstrated.",
                "date": "2026-04-18"
            },
        ],
        "behavioral_strengths": [
            "Cooperative",
            "Attentive",
            "Creative",
            "Respectful"
        ],
        "areas_for_improvement": [
            "Time management",
            "Punctuality"
        ],
    }

    return mock_conduct


# ─────────────────────────────
# 12. Get All Child Metrics Summary
# ─────────────────────────────

@router.get("/child/{child_id}/summary")
def get_child_summary(child_id: str, user=Depends(require_role("parent"))):
    """
    Get a comprehensive summary of all child metrics:
    - Academic performance
    - Attendance
    - Progress
    - Conduct
    """
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    child = users_collection.find_one({"_id": child_oid})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Fetch all data
    progress_pipeline = [
        {"$match": {"student_id": child_oid}},
        {"$group": {
            "_id": None,
            "total_submissions": {"$sum": 1},
            "avg_score": {"$avg": "$total_score"},
        }},
    ]

    progress_agg = list(submissions_collection.aggregate(progress_pipeline))
    
    cls = classes_collection.find_one({"students": child_oid})

    return {
        "child": {
            "id": child_id,
            "name": child.get("name", ""),
            "email": child.get("email", ""),
            "grade": child.get("grade", ""),
            "school": child.get("school", ""),
        },
        "academic_summary": {
            "total_submissions": progress_agg[0].get("total_submissions", 0) if progress_agg else 0,
            "average_score": round(progress_agg[0].get("avg_score", 0), 1) if progress_agg else 0,
        },
        "attendance_summary": {
            "attendance_percentage": 91.7,  # Mock
            "note": "Integration pending"
        },
        "conduct_summary": {
            "overall_rating": 4.5,  # Mock
            "note": "Integration pending"
        },
        "class_info": {
            "class_grade": cls.get("grade", "") if cls else "Not assigned",
            "school": cls.get("school", "") if cls else "Not assigned",
        },
    }
