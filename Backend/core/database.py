from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URI")

if not MONGO_URL:
    raise Exception("MONGO_URL not found in environment variables")

client = MongoClient(MONGO_URL)
db = client["smart_campus"]

# Collections
users_collection = db["users"]
students_collection = db["students"]
teachers_collection = db["teachers"]
parents_collection = db["parents"]
assignments_collection = db["assignments"]
submissions_collection = db["submissions"]
reports_collection = db["reports"]

# ── Classroom Connection System ──
classes_collection = db["classes"]       # Central model: connects teacher + students + parents
homework_collection = db["homework"]     # Subject-based homework assigned by teachers
enrollment_requests_collection = db["enrollment_requests"]  # Student join requests (pending/accepted/rejected)