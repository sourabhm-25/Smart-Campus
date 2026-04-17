"""
Notification Router
===================
In-app notification polling endpoints (MVP).
All endpoints are role-agnostic — any authenticated user can call them.

Endpoints:
  GET  /notifications                  List notifications (newest first)
  GET  /notifications/unread-count     Fast badge count
  POST /notifications/{id}/read        Mark one as read
  POST /notifications/read-all         Mark all as read
"""

from fastapi import APIRouter, Depends, HTTPException
from core.database import notifications_collection
from core.security import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _fmt(notif: dict) -> dict:
    created = notif.get("created_at")
    return {
        "id": str(notif["_id"]),
        "type": notif.get("type", ""),
        "payload": notif.get("payload", {}),
        "read": notif.get("read", False),
        "created_at": created.isoformat() if isinstance(created, datetime) else str(created),
    }


# ─────────────────────────────
# 1. List Notifications
# ─────────────────────────────

@router.get("")
def get_notifications(
    limit: int = 20,
    skip: int = 0,
    unread_only: bool = False,
    user=Depends(get_current_user)
):
    """Return the current user's notifications, newest first. Paginatable via skip/limit."""
    query = {"user_id": user["_id"]}
    if unread_only:
        query["read"] = False

    notifs = list(
        notifications_collection.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    total = notifications_collection.count_documents(query)

    return {
        "notifications": [_fmt(n) for n in notifs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


# ─────────────────────────────
# 2. Unread Count (badge)
# ─────────────────────────────

@router.get("/unread-count")
def unread_count(user=Depends(get_current_user)):
    """Return the number of unread notifications for the current user."""
    count = notifications_collection.count_documents({
        "user_id": user["_id"],
        "read": False
    })
    return {"unread_count": count}


# ─────────────────────────────
# 3. Mark One as Read
# ─────────────────────────────

@router.post("/{notification_id}/read")
def mark_read(notification_id: str, user=Depends(get_current_user)):
    """Mark a specific notification as read."""
    result = notifications_collection.update_one(
        {"_id": ObjectId(notification_id), "user_id": user["_id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


# ─────────────────────────────
# 4. Mark All as Read
# ─────────────────────────────

@router.post("/read-all")
def mark_all_read(user=Depends(get_current_user)):
    """Mark all of the current user's notifications as read."""
    result = notifications_collection.update_many(
        {"user_id": user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": f"Marked {result.modified_count} notifications as read"}
