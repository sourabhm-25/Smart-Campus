"""
Class Router — The Central Connection Hub
==========================================
Class is the SINGLE SOURCE OF TRUTH connecting:
  - Teachers (assigned by subject)
  - Students (enrolled in the class)
  - Parents (auto-linked via children)

A class is identified by (school + grade).
Multiple teachers can be in one class, each owning a subject.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from core.database import users_collection, classes_collection
from core.security import get_current_user, require_role
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/class", tags=["Classroom"])


# ─────────────────────────────
# Request Models
# ─────────────────────────────

class CreateClassRequest(BaseModel):
    school: str
    grade: str


class AddStudentRequest(BaseModel):
    class_id: str
    student_email: str


class AssignTeacherRequest(BaseModel):
    class_id: str
    teacher_email: str
    subject: str


class LinkParentRequest(BaseModel):
    parent_email: str
    student_email: str
    class_id: Optional[str] = None  # Auto-detect if not provided


class RemoveStudentRequest(BaseModel):
    class_id: str
    student_id: str


# ─────────────────────────────
# Helpers
# ─────────────────────────────

def _serialize_class(cls):
    """Serialize a class document for API response."""
    return {
        "id": str(cls["_id"]),
        "school": cls.get("school", ""),
        "grade": cls.get("grade", ""),
        "teachers": [
            {
                "teacher_id": str(t["teacher_id"]),
                "subject": t["subject"]
            }
            for t in cls.get("teachers", [])
        ],
        "students": [str(s) for s in cls.get("students", [])],
        "parents": [str(p) for p in cls.get("parents", [])],
        "created_at": str(cls.get("created_at", "")),
    }


def _populate_class(cls):
    """Populate a class with full user details."""
    # Populate teachers
    teachers_populated = []
    for t in cls.get("teachers", []):
        teacher = users_collection.find_one({"_id": t["teacher_id"]})
        if teacher:
            teachers_populated.append({
                "id": str(teacher["_id"]),
                "name": teacher.get("name", ""),
                "email": teacher.get("email", ""),
                "subject": t["subject"],
                "subjects": teacher.get("subjects", []),
            })

    # Populate students
    students_populated = []
    for sid in cls.get("students", []):
        student = users_collection.find_one({"_id": sid})
        if student:
            students_populated.append({
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "email": student.get("email", ""),
                "grade": student.get("grade", ""),
            })

    # Populate parents
    parents_populated = []
    for pid in cls.get("parents", []):
        parent = users_collection.find_one({"_id": pid})
        if parent:
            children_names = []
            for cid in parent.get("children", []):
                child = users_collection.find_one({"_id": cid})
                if child:
                    children_names.append({"id": str(child["_id"]), "name": child.get("name", "")})

            parents_populated.append({
                "id": str(parent["_id"]),
                "name": parent.get("name", ""),
                "email": parent.get("email", ""),
                "children": children_names,
            })

    return {
        "id": str(cls["_id"]),
        "school": cls.get("school", ""),
        "grade": cls.get("grade", ""),
        "teachers": teachers_populated,
        "students": students_populated,
        "parents": parents_populated,
        "created_at": str(cls.get("created_at", "")),
    }


# ──────────────────────────────────────────────
# 1. Create Class
# ──────────────────────────────────────────────

@router.post("/create")
def create_class(data: CreateClassRequest, user=Depends(get_current_user)):
    """
    Create a new class for a school + grade.
    Only teachers can create classes.
    The creating teacher is automatically assigned to the class
    for their first subject.
    """
    if user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create classes")

    # Check if class already exists for this school + grade
    existing = classes_collection.find_one({
        "school": data.school,
        "grade": data.grade
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Class already exists for {data.school} - Grade {data.grade}. Use the existing class."
        )

    # Auto-assign this teacher with their first subject
    teacher_subjects = user.get("subjects", [])
    initial_teachers = []
    for subj in teacher_subjects:
        initial_teachers.append({
            "teacher_id": user["_id"],
            "subject": subj
        })

    new_class = {
        "school": data.school,
        "grade": data.grade,
        "teachers": initial_teachers,
        "students": [],
        "parents": [],
        "created_at": datetime.utcnow(),
        "created_by": user["_id"],
    }

    result = classes_collection.insert_one(new_class)

    return {
        "message": f"Class created for {data.school} - Grade {data.grade}",
        "class_id": str(result.inserted_id),
        "class": _serialize_class({**new_class, "_id": result.inserted_id})
    }


# ──────────────────────────────────────────────
# 2. Add Student to Class
# ──────────────────────────────────────────────

@router.post("/add-student")
def add_student(data: AddStudentRequest, user=Depends(get_current_user)):
    """
    Add a student to a class by their email.
    Only teachers can add students.
    Also updates the student's grade to match the class.
    """
    if user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can add students")

    # Find class
    cls = classes_collection.find_one({"_id": ObjectId(data.class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Find student
    student = users_collection.find_one({"email": data.student_email, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail=f"No student found with email '{data.student_email}'")

    # Check if already in class
    if student["_id"] in cls.get("students", []):
        raise HTTPException(status_code=400, detail="Student is already in this class")

    # Add student to class
    classes_collection.update_one(
        {"_id": cls["_id"]},
        {"$addToSet": {"students": student["_id"]}}
    )

    # Update student's grade & school to match the class
    users_collection.update_one(
        {"_id": student["_id"]},
        {"$set": {"grade": cls["grade"], "school": cls["school"]}}
    )

    # If student has a parent, auto-add parent to this class
    parents = users_collection.find({"children": student["_id"], "role": "parent"})
    for parent in parents:
        classes_collection.update_one(
            {"_id": cls["_id"]},
            {"$addToSet": {"parents": parent["_id"]}}
        )

    return {
        "message": f"Student '{student['name']}' added to {cls['school']} - Grade {cls['grade']}",
        "student_id": str(student["_id"])
    }


# ──────────────────────────────────────────────
# 3. Assign Teacher to Class (by Subject)
# ──────────────────────────────────────────────

@router.post("/assign-teacher")
def assign_teacher(data: AssignTeacherRequest, user=Depends(get_current_user)):
    """
    Assign a teacher to a class for a specific subject.
    Only teachers can assign other teachers.
    """
    if user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can assign teachers")

    # Find class
    cls = classes_collection.find_one({"_id": ObjectId(data.class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Find teacher
    teacher = users_collection.find_one({"email": data.teacher_email, "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail=f"No teacher found with email '{data.teacher_email}'")

    # Check if subject already has a teacher in this class
    for t in cls.get("teachers", []):
        if t["subject"].lower() == data.subject.lower():
            existing_teacher = users_collection.find_one({"_id": t["teacher_id"]})
            raise HTTPException(
                status_code=400,
                detail=f"Subject '{data.subject}' already has teacher '{existing_teacher.get('name', 'Unknown')}' in this class"
            )

    # Check if teacher already assigned for another subject
    for t in cls.get("teachers", []):
        if t["teacher_id"] == teacher["_id"] and t["subject"].lower() == data.subject.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Teacher '{teacher['name']}' is already assigned for '{data.subject}' in this class"
            )

    # Assign teacher
    classes_collection.update_one(
        {"_id": cls["_id"]},
        {"$push": {"teachers": {"teacher_id": teacher["_id"], "subject": data.subject}}}
    )

    return {
        "message": f"Teacher '{teacher['name']}' assigned to {cls['school']} - Grade {cls['grade']} for '{data.subject}'",
        "teacher_id": str(teacher["_id"]),
        "subject": data.subject
    }


# ──────────────────────────────────────────────
# 4. Link Parent to Student
# ──────────────────────────────────────────────

@router.post("/link-parent")
def link_parent(data: LinkParentRequest, user=Depends(get_current_user)):
    """
    Link a parent to a student.
    - Adds student to parent.children[]
    - Adds parent to the student's class.parents[]
    """
    # Find parent
    parent = users_collection.find_one({"email": data.parent_email, "role": "parent"})
    if not parent:
        raise HTTPException(status_code=404, detail=f"No parent found with email '{data.parent_email}'")

    # Find student
    student = users_collection.find_one({"email": data.student_email, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail=f"No student found with email '{data.student_email}'")

    # Add student to parent's children
    users_collection.update_one(
        {"_id": parent["_id"]},
        {"$addToSet": {"children": student["_id"]}}
    )

    # Add parent to student's class(es)
    if data.class_id:
        classes_collection.update_one(
            {"_id": ObjectId(data.class_id)},
            {"$addToSet": {"parents": parent["_id"]}}
        )
    else:
        # Auto-detect: add parent to ALL classes the student is in
        classes_collection.update_many(
            {"students": student["_id"]},
            {"$addToSet": {"parents": parent["_id"]}}
        )

    return {
        "message": f"Parent '{parent['name']}' linked to student '{student['name']}'",
        "parent_id": str(parent["_id"]),
        "student_id": str(student["_id"])
    }


# ──────────────────────────────────────────────
# 5. Get My Classes (for any authenticated user)
# ──────────────────────────────────────────────

@router.get("/my-classes")
def get_my_classes(user=Depends(get_current_user)):
    """
    Get all classes for the current user.
    - Teacher: classes where they teach
    - Student: classes they're enrolled in
    - Parent: classes their children are in
    """
    role = user.get("role")
    user_id = user["_id"]

    if role == "teacher":
        classes = list(classes_collection.find({"teachers.teacher_id": user_id}))
    elif role == "student":
        classes = list(classes_collection.find({"students": user_id}))
    elif role == "parent":
        classes = list(classes_collection.find({"parents": user_id}))
    else:
        classes = []

    return {
        "classes": [_serialize_class(c) for c in classes],
        "count": len(classes)
    }


# ──────────────────────────────────────────────
# 6. Get Class Details (populated)
# ──────────────────────────────────────────────

@router.get("/{class_id}")
def get_class(class_id: str, user=Depends(get_current_user)):
    """Get full class details with populated teacher/student/parent info."""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    return {"class": _populate_class(cls)}


# ──────────────────────────────────────────────
# 7. Get Students in a Class
# ──────────────────────────────────────────────

@router.get("/{class_id}/students")
def get_class_students(class_id: str, user=Depends(get_current_user)):
    """Get all students in a class."""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

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

    return {"students": students, "count": len(students)}


# ──────────────────────────────────────────────
# 8. Get Teacher for a Specific Subject in Class
# ──────────────────────────────────────────────

@router.get("/{class_id}/teacher/{subject}")
def get_subject_teacher(class_id: str, subject: str, user=Depends(get_current_user)):
    """Get the teacher assigned for a specific subject in a class."""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    for t in cls.get("teachers", []):
        if t["subject"].lower() == subject.lower():
            teacher = users_collection.find_one({"_id": t["teacher_id"]})
            if teacher:
                return {
                    "teacher": {
                        "id": str(teacher["_id"]),
                        "name": teacher.get("name", ""),
                        "email": teacher.get("email", ""),
                        "subject": t["subject"],
                    }
                }

    raise HTTPException(
        status_code=404,
        detail=f"No teacher assigned for '{subject}' in this class"
    )


# ──────────────────────────────────────────────
# 9. Remove Student from Class
# ──────────────────────────────────────────────

@router.post("/remove-student")
def remove_student(data: RemoveStudentRequest, user=Depends(get_current_user)):
    """Remove a student from a class. Only teachers can do this."""
    if user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can remove students")

    cls = classes_collection.find_one({"_id": ObjectId(data.class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    student_id = ObjectId(data.student_id)

    classes_collection.update_one(
        {"_id": cls["_id"]},
        {"$pull": {"students": student_id}}
    )

    return {"message": "Student removed from class"}


# ──────────────────────────────────────────────
# 10. Get All Classes for a School
# ──────────────────────────────────────────────

@router.get("/school/{school_name}")
def get_school_classes(school_name: str, user=Depends(get_current_user)):
    """Get all classes in a school."""
    classes = list(classes_collection.find({"school": school_name}))
    return {
        "school": school_name,
        "classes": [_serialize_class(c) for c in classes],
        "count": len(classes)
    }
