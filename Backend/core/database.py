from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import OperationFailure
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URI")

if not MONGO_URL:
    raise Exception("MONGO_URL not found in environment variables")

client = MongoClient(MONGO_URL)
db = client["smart_campus"]

# ── Core User Collections ──
users_collection = db["users"]
students_collection = db["students"]
teachers_collection = db["teachers"]
parents_collection = db["parents"]
assignments_collection = db["assignments"]
reports_collection = db["reports"]

# ── Classroom Connection System ──
classes_collection = db["classes"]                          # Central model: connects teacher + students + parents
homework_collection = db["homework"]                        # Subject-based homework assigned by teachers
enrollment_requests_collection = db["enrollment_requests"]  # Student join requests (pending/accepted/rejected)
submissions_collection = db["submissions"]                  # Student homework submissions + scores
notifications_collection = db["notifications"]              # In-app notification feed
questions_collection = db["questions"]                      # AI-generated questions saved by /save-questions


def _create_indexes():
    """
    Create all compound indexes needed for performance and correctness.
    Called once at startup. Safe to re-run — MongoDB ignores existing indexes.
    """
    try:
        # ── users ──
        users_collection.create_index([("email", ASCENDING)], unique=True, background=True)
        users_collection.create_index([("role", ASCENDING)], background=True)
        users_collection.create_index([("children", ASCENDING)], background=True)

        # ── classes ──
        classes_collection.create_index(
            [("school", ASCENDING), ("grade", ASCENDING)],
            unique=True, background=True
        )
        classes_collection.create_index([("teachers.teacher_id", ASCENDING)], background=True)
        classes_collection.create_index([("students", ASCENDING)], background=True)

        # ── enrollment_requests ──
        enrollment_requests_collection.create_index(
            [("student_id", ASCENDING), ("status", ASCENDING)], background=True
        )
        enrollment_requests_collection.create_index(
            [("class_id", ASCENDING), ("status", ASCENDING)], background=True
        )

        # ── homework ──
        homework_collection.create_index(
            [("class_id", ASCENDING), ("subject", ASCENDING), ("status", ASCENDING)],
            background=True
        )
        homework_collection.create_index([("teacher_id", ASCENDING)], background=True)
        homework_collection.create_index([("deadline", ASCENDING)], background=True)

        # ── submissions — CRITICAL: enforce one submission per student per homework ──
        submissions_collection.create_index(
            [("homework_id", ASCENDING), ("student_id", ASCENDING)],
            unique=True, background=True,
            name="unique_submission_per_student"
        )
        submissions_collection.create_index([("student_id", ASCENDING)], background=True)

        # ── notifications ──
        notifications_collection.create_index(
            [("user_id", ASCENDING), ("read", ASCENDING), ("created_at", DESCENDING)],
            background=True
        )

        # ── questions ──
        questions_collection.create_index([("question", ASCENDING)], background=True)
        questions_collection.create_index([("topic", ASCENDING)], background=True)

        print("✅ MongoDB indexes created/verified")
    except OperationFailure as e:
        print(f"⚠️  Index creation warning (non-fatal): {e}")


# Create indexes on module import (runs once when FastAPI starts)
_create_indexes()


def get_collection(name: str):
    """Shim for legacy callers — prefer importing the collection directly."""
    return db[name]