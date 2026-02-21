from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from core.database import users_collection
from core.security import hash_password, verify_password, create_access_token

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