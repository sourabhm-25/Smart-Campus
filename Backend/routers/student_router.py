from fastapi import APIRouter, Depends
from core.security import require_role

router = APIRouter(
    prefix="/student",
    tags=["Student"]
)

@router.get("/dashboard")
def student_dashboard(user=Depends(require_role("student"))):
    return {
        "message": f"Welcome {user['name']} to Student Dashboard"
    }