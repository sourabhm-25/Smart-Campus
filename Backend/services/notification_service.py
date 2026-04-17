"""
Notification Service
====================
Centralised helper for writing to the `notifications` collection.

Usage (from any router):
    from services.notification_service import notify_users, create_notification

Always call from a FastAPI BackgroundTask so it never blocks the request path.
"""

from bson import ObjectId
from datetime import datetime
from typing import List, Any

from core.database import notifications_collection


def create_notification(user_id: Any, ntype: str, payload: dict) -> None:
    """
    Write a single notification document.

    Args:
        user_id:  MongoDB ObjectId of the recipient (student, teacher, or parent).
        ntype:    One of: homework_assigned | submission_graded |
                          enrollment_accepted | enrollment_rejected
        payload:  Dict with at minimum a "message" key plus relevant IDs.
    """
    notifications_collection.insert_one({
        "user_id": user_id if isinstance(user_id, ObjectId) else ObjectId(str(user_id)),
        "type": ntype,
        "payload": payload,
        "read": False,
        "created_at": datetime.utcnow(),
    })


def notify_users(user_ids: List[Any], ntype: str, payload: dict) -> None:
    """
    Write a notification for each user in user_ids.
    Designed to be called inside a BackgroundTask so it never blocks requests.

    Time complexity: O(n) writes — acceptable for typical class sizes (< 100 students).
    For very large fan-outs, swap this for an insert_many batch write.
    """
    if not user_ids:
        return

    now = datetime.utcnow()
    docs = []
    for uid in user_ids:
        oid = uid if isinstance(uid, ObjectId) else ObjectId(str(uid))
        docs.append({
            "user_id": oid,
            "type": ntype,
            "payload": payload,
            "read": False,
            "created_at": now,
        })

    if docs:
        notifications_collection.insert_many(docs, ordered=False)
