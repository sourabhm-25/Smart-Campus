from dotenv import load_dotenv
load_dotenv()
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.database import users_collection
from bson import ObjectId
import os

# ------------------------------------------------
# Password Hashing Config
# ------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ------------------------------------------------
# JWT Config
# ------------------------------------------------

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ------------------------------------------------
# Bearer Token Security (Simple & Clean)
# ------------------------------------------------

security = HTTPBearer()

# ------------------------------------------------
# Password Utilities
# ------------------------------------------------

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


# ------------------------------------------------
# JWT Token Creation
# ------------------------------------------------

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ------------------------------------------------
# Get Current User from JWT
# ------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        user = users_collection.find_one({"_id": ObjectId(user_id)})

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


# ------------------------------------------------
# Role-Based Access Control
# ------------------------------------------------

def require_role(required_role: str):
    def role_checker(user: dict = Security(get_current_user)):
        if user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: insufficient permissions"
            )
        return user
    return role_checker

print("SECRET_KEY:", SECRET_KEY)