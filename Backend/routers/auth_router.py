from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from core.database import users_collection
from core.security import hash_password, verify_password, create_access_token, verify_google_token
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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str
    role: str


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

    user = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role
    }

    result = users_collection.insert_one(user)

    return {
        "message": "User created successfully",
        "user_id": str(result.inserted_id)
    }


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

    # 🔥 IMPORTANT FIX HERE
    token = create_access_token({
        "sub": str(user["_id"]),   # MUST be "sub"
        "role": user["role"]
    })

    return {
        "access_token": token,
        "role": user["role"]
    }


# -----------------------------
# Google OAuth — Login Only
# -----------------------------

@router.post("/google/login")
def google_login(data: GoogleAuthRequest):
    """
    Login an existing user via Google OAuth.
    - Verifies the Google ID token
    - If user exists → logs them in
    - If user doesn't exist → returns error (must register first)
    """
    # 1️⃣ Verify the Google token
    google_user = verify_google_token(data.credential)

    email = google_user.get("email")
    name = google_user.get("name", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # 2️⃣ Check if user exists
    existing_user = users_collection.find_one({"email": email})

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this Google email. Please register first."
        )

    # 3️⃣ User exists → create JWT and login
    token = create_access_token({
        "sub": str(existing_user["_id"]),
        "role": existing_user["role"]
    })

    return {
        "access_token": token,
        "role": existing_user["role"],
        "name": existing_user.get("name", name),
        "email": email
    }


# -----------------------------
# Google OAuth — Register Only
# -----------------------------

@router.post("/google/register")
def google_register(data: GoogleAuthRequest):
    """
    Register a new user via Google OAuth.
    - Verifies the Google ID token
    - If user doesn't exist → creates account and logs them in
    - If user already exists → returns error (must login instead)
    """
    # 1️⃣ Verify the Google token
    google_user = verify_google_token(data.credential)

    email = google_user.get("email")
    name = google_user.get("name", "")
    picture = google_user.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # 2️⃣ Validate role
    if data.role not in ["student", "teacher", "parent"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # 3️⃣ Check if user already exists
    existing_user = users_collection.find_one({"email": email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Please login instead."
        )

    # 4️⃣ Create new user with Google info
    new_user = {
        "name": name,
        "email": email,
        "password": hash_password(secrets.token_hex(32)),  # random password for Google users
        "role": data.role,
        "auth_provider": "google",
        "picture": picture
    }

    result = users_collection.insert_one(new_user)

    token = create_access_token({
        "sub": str(result.inserted_id),
        "role": data.role
    })

    return {
        "access_token": token,
        "role": data.role,
        "name": name,
        "email": email
    }