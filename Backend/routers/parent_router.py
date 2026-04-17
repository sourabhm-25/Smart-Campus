"""
Parent Router — Parent-Specific Endpoints
==========================================
- View connected children
- View child's class, subjects, teachers
- View child's homework, submissions, and progress
"""

from fastapi import APIRouter, Depends, HTTPException
from core.database import users_collection, classes_collection, homework_collection, submissions_collection
from core.security import require_role
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/parent", tags=["Parent"])


# ─────────────────────────────
# 1. Parent Dashboard
# ─────────────────────────────

@router.get("/dashboard")
def parent_dashboard(user=Depends(require_role("parent"))):
    """
    Get parent dashboard:
    - List of children with their class, grade, school
    - Each child's subjects and teachers
    - Pending homework for each child
    """
    children_ids = user.get("children", [])

    children_data = []
    for child_id in children_ids:
        child = users_collection.find_one({"_id": child_id})
        if not child:
            continue

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
    }


# ─────────────────────────────
# 2. Get Child's Homework
# ─────────────────────────────

@router.get("/child/{child_id}/homework")
def get_child_homework(child_id: str, user=Depends(require_role("parent"))):
    """Get all homework for a specific child."""
    child_oid = ObjectId(child_id)

    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    classes = list(classes_collection.find({"students": child_oid}))
    class_ids = [cls["_id"] for cls in classes]

    homework_list = list(homework_collection.find({
        "class_id": {"$in": class_ids},
        "status": "active"
    }).sort("created_at", -1))

    result = []
    for hw in homework_list:
        deadline = hw.get("deadline")
        result.append({
            "id": str(hw["_id"]),
            "title": hw.get("title", ""),
            "subject": hw.get("subject", ""),
            "teacher_name": hw.get("teacher_name", ""),
            "task_type": hw.get("task_type", "homework"),
            "deadline": deadline.isoformat() if isinstance(deadline, datetime) else deadline,
            "created_at": str(hw.get("created_at", "")),
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 3. Get Child's Submissions
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
            "subject": sub.get("subject", ""),
            "status": sub.get("status", ""),
            "total_score": sub.get("total_score"),
            "max_score": sub.get("max_score"),
            "submitted_at": submitted_at.isoformat() if isinstance(submitted_at, datetime) else str(submitted_at),
        })

    return {
        "child": {"id": child_id, "name": child.get("name", "")},
        "submissions": result,
        "count": len(result),
    }


# ─────────────────────────────
# 4. Get Child's Progress (aggregate by subject)
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

    pipeline = [
        {"$match": {"student_id": child_oid, "status": "evaluated"}},
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
        "child": {"id": child_id, "name": child.get("name", "")},
        "progress_by_subject": subjects,
    }


# ─────────────────────────────
# 5. Get Child's Class Info
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
# 1. Parent Dashboard
# ─────────────────────────────

@router.get("/dashboard")
def parent_dashboard(user=Depends(require_role("parent"))):
    """
    Get parent dashboard:
    - List of children with their class, grade, school
    - Each child's subjects and teachers
    - Pending homework for each child
    """
    children_ids = user.get("children", [])

    children_data = []
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
    }


# ─────────────────────────────
# 2. Get Child's Homework
# ─────────────────────────────

@router.get("/child/{child_id}/homework")
def get_child_homework(child_id: str, user=Depends(require_role("parent"))):
    """Get all homework for a specific child."""
    child_oid = ObjectId(child_id)

    # Verify this child belongs to this parent
    if child_oid not in user.get("children", []):
        raise HTTPException(status_code=403, detail="This is not your child's account")

    # Find child's classes
    classes = list(classes_collection.find({"students": child_oid}))
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
            "subject": hw.get("subject", ""),
            "teacher_name": hw.get("teacher_name", ""),
            "task_type": hw.get("task_type", "homework"),
            "due_date": hw.get("due_date"),
            "created_at": str(hw.get("created_at", "")),
        })

    return {"homework": result, "count": len(result)}


# ─────────────────────────────
# 3. Get Child's Class Info
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
