# from dotenv import load_dotenv
# load_dotenv()
# from passlib.context import CryptContext
# from jose import jwt, JWTError
# from datetime import datetime, timedelta
# from fastapi import HTTPException, Security, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from core.database import users_collection
# from bson import ObjectId
# import os

# # ------------------------------------------------
# # Password Hashing Config
# # ------------------------------------------------

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # ------------------------------------------------
# # JWT Config
# # ------------------------------------------------

# SECRET_KEY = os.getenv("SECRET_KEY")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60

# # ------------------------------------------------
# # Bearer Token Security (Simple & Clean)
# # ------------------------------------------------

# security = HTTPBearer()

# # ------------------------------------------------
# # Password Utilities
# # ------------------------------------------------

# def hash_password(password: str):
#     return pwd_context.hash(password)


# def verify_password(plain_password: str, hashed_password: str):
#     return pwd_context.verify(plain_password, hashed_password)


# # ------------------------------------------------
# # JWT Token Creation
# # ------------------------------------------------

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

#     to_encode.update({
#         "exp": expire
#     })

#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt


# # ------------------------------------------------
# # Get Current User from JWT
# # ------------------------------------------------

# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Security(security)
# ):
#     token = credentials.credentials

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id: str = payload.get("sub")

#         if user_id is None:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid token"
#             )

#         user = users_collection.find_one({"_id": ObjectId(user_id)})

#         if user is None:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="User not found"
#             )

#         return user

#     except JWTError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid token"
#         )


# # ------------------------------------------------
# # Role-Based Access Control
# # ------------------------------------------------

# def require_role(required_role: str):
#     def role_checker(user: dict = Security(get_current_user)):
#         if user.get("role") != required_role:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Access forbidden: insufficient permissions"
#             )
#         return user
#     return role_checker
from dotenv import load_dotenv
load_dotenv()

from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.database import users_collection
from bson import ObjectId
import hashlib
import os

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ------------------------------------------------
# Google OAuth Config
# ------------------------------------------------

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


def verify_google_token(token: str) -> dict:
    """
    Verify the Google ID token received from the frontend.
    Returns the decoded user info (email, name, picture, etc.)
    Raises HTTPException if verification fails.
    """
    try:
        id_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Verify the issuer
        if id_info["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer"
            )

        return id_info

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )

# ------------------------------------------------
# Password Hashing Config
# ------------------------------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# ------------------------------------------------
# JWT Config
# ------------------------------------------------

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set in environment variables")

# ------------------------------------------------
# Bearer Token Security
# ------------------------------------------------

security = HTTPBearer()

# ------------------------------------------------
# Password Utilities (Fixed 72-byte bcrypt limit)
# ------------------------------------------------

def hash_password(password: str) -> str:
    """
    Hash password safely.
    Uses SHA256 pre-hashing to avoid bcrypt 72-byte limit.
    """
    sha256_hash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(sha256_hash)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against stored hash.
    """
    sha256_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(sha256_hash, hashed_password)


# ------------------------------------------------
# JWT Token Creation
# ------------------------------------------------

def create_access_token(data: dict) -> str:
    """
    Create JWT access token.
    """
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

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        user = users_collection.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
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