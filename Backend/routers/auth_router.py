from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from core.database import users_collection, classes_collection, enrollment_requests_collection
from core.security import hash_password, verify_password, create_access_token, verify_google_token
from bson import ObjectId
from datetime import datetime
import secrets

router = APIRouter(prefix="/auth", tags=["Auth"])


# -----------------------------
# Request Models
# -----------------------------

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

    # Student & Teacher
    school: Optional[str] = None

    # Student: single grade | Teacher: multiple grades
    grade: Optional[str] = None           # Student only
    grades: Optional[List[str]] = None    # Teacher only (multi-grade)

    # Teacher only
    subjects: Optional[List[str]] = None

    # Parent only — provide child's email to auto-link
    child_email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str
    role: str

    # Same optional fields for Google registration
    school: Optional[str] = None
    grade: Optional[str] = None
    grades: Optional[List[str]] = None
    subjects: Optional[List[str]] = None
    child_email: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    """For existing users to complete their profile."""
    school: Optional[str] = None
    grade: Optional[str] = None
    grades: Optional[List[str]] = None
    subjects: Optional[List[str]] = None
    child_email: Optional[str] = None


# ─────────────────────────────────────────────
# Helper: Build user document with role fields
# ─────────────────────────────────────────────

def _build_user_doc(name, email, hashed_password, role, data, auth_provider="local", picture=""):
    """Build user document with role-specific fields."""
    user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role,
        "auth_provider": auth_provider,
    }

    if picture:
        user["picture"] = picture

    if role in ["student", "teacher"]:
        user["school"] = data.school or ""
    if role == "student":
        user["grade"] = data.grade or ""
    if role == "teacher":
        user["subjects"] = data.subjects or []
        user["grades"] = data.grades or []    # NEW: multi-grade support
    if role == "parent":
        user["children"] = []  # Will be filled on linking

    return user


def _link_parent_to_child(parent_id, child_email):
    """
    Link a parent to their child:
    1. Find the child user by email
    2. Add child's _id to parent.children[]
    3. Add parent to the child's class.parents[]
    """
    if not child_email:
        return None

    child = users_collection.find_one({"email": child_email, "role": "student"})
    if not child:
        return {"warning": f"No student found with email '{child_email}'. You can link later."}

    child_id = child["_id"]

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

    return {"linked": True, "child_name": child["name"]}


def _serialize_user(user):
    """Serialize user document for API response."""
    result = {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", ""),
        "school": user.get("school", ""),
    }
    if user.get("role") == "student":
        result["grade"] = user.get("grade", "")
    if user.get("role") == "teacher":
        result["subjects"] = user.get("subjects", [])
        result["grades"] = user.get("grades", [])
    if user.get("role") == "parent":
        result["children"] = [str(c) for c in user.get("children", [])]
    if user.get("picture"):
        result["picture"] = user["picture"]
    return result


# ─────────────────────────────────────────────
# Helper: Auto-setup teacher into classes
# ─────────────────────────────────────────────

def _auto_setup_teacher_classes(teacher_id, school, grades, subjects):
    """
    For each grade the teacher selected:
    1. Find or create a class for (school, grade)
    2. Assign the teacher for each of their subjects in that class
    3. Check for orphaned enrollment requests and attach them
    """
    created_classes = []

    for grade in grades:
        # Find or create the class
        cls = classes_collection.find_one({"school": school, "grade": grade})

        if not cls:
            # Create new class
            new_class = {
                "school": school,
                "grade": grade,
                "teachers": [],
                "students": [],
                "parents": [],
                "created_at": datetime.utcnow(),
                "created_by": teacher_id,
            }
            result = classes_collection.insert_one(new_class)
            cls = classes_collection.find_one({"_id": result.inserted_id})

        class_id = cls["_id"]

        # Assign teacher for each subject (skip if already assigned)
        existing_teacher_subjects = [
            (t["teacher_id"], t["subject"].lower())
            for t in cls.get("teachers", [])
        ]

        for subj in subjects:
            if (teacher_id, subj.lower()) not in existing_teacher_subjects:
                classes_collection.update_one(
                    {"_id": class_id},
                    {"$push": {"teachers": {"teacher_id": teacher_id, "subject": subj}}}
                )

        # Attach orphaned enrollment requests (requests with no class_id for this school+grade)
        enrollment_requests_collection.update_many(
            {
                "school": school,
                "grade": grade,
                "class_id": None,
                "status": "pending"
            },
            {"$set": {"class_id": class_id}}
        )

        created_classes.append({
            "class_id": str(class_id),
            "school": school,
            "grade": grade,
        })

    return created_classes


# ─────────────────────────────────────────────
# Helper: Auto-create enrollment request for student
# ─────────────────────────────────────────────

def _auto_create_enrollment_request(student_id, student_name, student_email, school, grade):
    """
    When a student registers, find the class for (school, grade)
    and create a pending enrollment request.
    If no class exists, create with class_id=None (orphaned — will attach when teacher registers).
    """
    # Check if student already has a pending/accepted request for this school+grade
    existing = enrollment_requests_collection.find_one({
        "student_id": student_id,
        "school": school,
        "grade": grade,
        "status": {"$in": ["pending", "accepted"]}
    })
    if existing:
        return {"status": "already_requested"}

    # Find the class
    cls = classes_collection.find_one({"school": school, "grade": grade})
    class_id = cls["_id"] if cls else None

    request_doc = {
        "student_id": student_id,
        "student_name": student_name,
        "student_email": student_email,
        "school": school,
        "grade": grade,
        "class_id": class_id,
        "status": "pending",
        "requested_at": datetime.utcnow(),
        "responded_by": None,
        "responded_at": None,
    }

    result = enrollment_requests_collection.insert_one(request_doc)

    return {
        "status": "pending",
        "request_id": str(result.inserted_id),
        "class_found": class_id is not None,
    }


# -----------------------------
# Register
# -----------------------------

@router.post("/register")
def register(data: RegisterRequest):

    existing_user = users_collection.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if data.role not in ["student", "teacher", "parent"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Validate role-specific required fields
    if data.role in ["student", "teacher"] and not data.school:
        raise HTTPException(status_code=400, detail="School is required for students and teachers")

    if data.role == "student" and not data.grade:
        raise HTTPException(status_code=400, detail="Grade is required for students")

    if data.role == "teacher" and (not data.subjects or len(data.subjects) == 0):
        raise HTTPException(status_code=400, detail="At least one subject is required for teachers")

    if data.role == "teacher" and (not data.grades or len(data.grades) == 0):
        raise HTTPException(status_code=400, detail="At least one grade is required for teachers")

    # Build user document
    user = _build_user_doc(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        data=data
    )

    result = users_collection.insert_one(user)
    user_id = result.inserted_id

    # ── Post-registration actions ──

    # Teacher: auto-create/join classes for each grade
    class_setup = None
    if data.role == "teacher":
        class_setup = _auto_setup_teacher_classes(
            teacher_id=user_id,
            school=data.school,
            grades=data.grades,
            subjects=data.subjects,
        )

    # Student: auto-create enrollment request
    enrollment_result = None
    if data.role == "student":
        enrollment_result = _auto_create_enrollment_request(
            student_id=user_id,
            student_name=data.name,
            student_email=data.email,
            school=data.school,
            grade=data.grade,
        )

    # Parent: link to child
    link_result = None
    if data.role == "parent" and data.child_email:
        link_result = _link_parent_to_child(user_id, data.child_email)

    token = create_access_token({
        "sub": str(user_id),
        "role": data.role
    })

    response = {
        "message": "User created successfully",
        "user_id": str(user_id),
        "access_token": token,
        "role": data.role,
        "user": _serialize_user({**user, "_id": user_id})
    }

    if class_setup:
        response["class_setup"] = class_setup
    if enrollment_result:
        response["enrollment_request"] = enrollment_result
    if link_result:
        response["parent_link"] = link_result

    return response


# -----------------------------
# Login
# -----------------------------

@router.post("/login")
def login(data: LoginRequest):

    user = users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user["_id"]),
        "role": user["role"]
    })

    return {
        "access_token": token,
        "role": user["role"],
        "user": _serialize_user(user)
    }


# -----------------------------
# Complete Profile (for existing users)
# -----------------------------

@router.put("/profile")
def update_profile(data: ProfileUpdateRequest, user=None):
    """
    Allows existing users to complete their profile
    with school, grade, subjects, or link a child.
    NOTE: Requires authentication — wire up get_current_user dependency.
    """
    from core.security import get_current_user
    from fastapi import Depends
    # This is a placeholder — the actual dependency injection
    # happens at the route level. See the working version below.
    pass


# Proper profile update with auth
from fastapi import Depends
from core.security import get_current_user

@router.put("/profile/update")
def update_user_profile(data: ProfileUpdateRequest, user=Depends(get_current_user)):
    """Update profile with role-specific fields."""
    update_fields = {}

    if data.school is not None:
        update_fields["school"] = data.school
    if data.grade is not None:
        update_fields["grade"] = data.grade
    if data.grades is not None:
        update_fields["grades"] = data.grades
    if data.subjects is not None:
        update_fields["subjects"] = data.subjects

    if update_fields:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": update_fields}
        )

    # Link parent to child
    link_result = None
    if data.child_email and user.get("role") == "parent":
        link_result = _link_parent_to_child(user["_id"], data.child_email)

    updated_user = users_collection.find_one({"_id": user["_id"]})

    response = {
        "message": "Profile updated successfully",
        "user": _serialize_user(updated_user)
    }
    if link_result:
        response["parent_link"] = link_result

    return response


# Get current user profile
@router.get("/me")
def get_me(user=Depends(get_current_user)):
    """Get current authenticated user's profile."""
    return {"user": _serialize_user(user)}


# -----------------------------
# Google OAuth — Login Only
# -----------------------------

@router.post("/google/login")
def google_login(data: GoogleAuthRequest):
    """
    Login an existing user via Google OAuth.
    """
    google_user = verify_google_token(data.credential)

    email = google_user.get("email")
    name = google_user.get("name", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    existing_user = users_collection.find_one({"email": email})

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this Google email. Please register first."
        )

    token = create_access_token({
        "sub": str(existing_user["_id"]),
        "role": existing_user["role"]
    })

    return {
        "access_token": token,
        "role": existing_user["role"],
        "user": _serialize_user(existing_user)
    }


# -----------------------------
# Google OAuth — Register Only
# -----------------------------

@router.post("/google/register")
def google_register(data: GoogleAuthRequest):
    """
    Register a new user via Google OAuth.
    """
    google_user = verify_google_token(data.credential)

    email = google_user.get("email")
    name = google_user.get("name", "")
    picture = google_user.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    if data.role not in ["student", "teacher", "parent"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing_user = users_collection.find_one({"email": email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Please login instead."
        )

    # Build user with role-specific fields
    new_user = _build_user_doc(
        name=name,
        email=email,
        hashed_password=hash_password(secrets.token_hex(32)),
        role=data.role,
        data=data,
        auth_provider="google",
        picture=picture
    )

    result = users_collection.insert_one(new_user)
    user_id = result.inserted_id

    # ── Post-registration actions (same as regular register) ──

    class_setup = None
    if data.role == "teacher" and data.grades and data.subjects:
        class_setup = _auto_setup_teacher_classes(
            teacher_id=user_id,
            school=data.school,
            grades=data.grades,
            subjects=data.subjects,
        )

    enrollment_result = None
    if data.role == "student" and data.school and data.grade:
        enrollment_result = _auto_create_enrollment_request(
            student_id=user_id,
            student_name=name,
            student_email=email,
            school=data.school,
            grade=data.grade,
        )

    link_result = None
    if data.role == "parent" and data.child_email:
        link_result = _link_parent_to_child(user_id, data.child_email)

    token = create_access_token({
        "sub": str(user_id),
        "role": data.role
    })

    response = {
        "access_token": token,
        "role": data.role,
        "user": _serialize_user({**new_user, "_id": user_id})
    }

    if class_setup:
        response["class_setup"] = class_setup
    if enrollment_result:
        response["enrollment_request"] = enrollment_result
    if link_result:
        response["parent_link"] = link_result

    return response