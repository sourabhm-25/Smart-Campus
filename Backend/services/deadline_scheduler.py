"""
Deadline Scheduler
==================
APScheduler background job that runs every 5 minutes.

Job: close_expired_homework()
  - Finds all homework with deadline < now and status == "active"
  - Sets their status to "closed"
  - Marks any students in student_ids who have NOT submitted as "missed"

Wire into FastAPI via the lifespan event in main.py.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

from core.database import homework_collection, submissions_collection

scheduler = BackgroundScheduler()


def close_expired_homework():
    """Close all homework past their deadline and mark non-submitting students as 'missed'."""
    now = datetime.utcnow()

    # Find all expired active homework
    expired = list(homework_collection.find({
        "deadline": {"$lt": now, "$ne": None},
        "status": "active"
    }))

    if not expired:
        return

    for hw in expired:
        hw_id = hw["_id"]

        # Who already submitted?
        submitted_ids = set(
            sub["student_id"]
            for sub in submissions_collection.find(
                {"homework_id": hw_id},
                {"student_id": 1}
            )
        )

        # Who was supposed to submit?
        all_student_ids = set(hw.get("student_ids", []))
        missed_ids = all_student_ids - submitted_ids

        # Insert "missed" placeholder submissions for non-submitters
        if missed_ids:
            missed_docs = [
                {
                    "homework_id": hw_id,
                    "student_id": sid,
                    "class_id": hw.get("class_id"),
                    "subject": hw.get("subject", ""),
                    "answers": [],
                    "total_score": 0,
                    "max_score": None,
                    "submitted_at": None,
                    "status": "missed",
                }
                for sid in missed_ids
            ]
            try:
                submissions_collection.insert_many(missed_docs, ordered=False)
            except Exception:
                pass  # Ignore duplicate key errors for students who submitted late

        # Close the homework
        homework_collection.update_one(
            {"_id": hw_id},
            {"$set": {"status": "closed"}}
        )

        print(f"✅ Closed homework '{hw.get('title', hw_id)}' — {len(missed_ids)} missed submissions marked")


def start_scheduler():
    """Start the APScheduler. Call from FastAPI startup event."""
    if not scheduler.running:
        scheduler.add_job(
            close_expired_homework,
            trigger="interval",
            minutes=5,
            id="close_expired_homework",
            replace_existing=True,
        )
        scheduler.start()
        print("✅ Deadline scheduler started (runs every 5 minutes)")


def stop_scheduler():
    """Stop the scheduler. Call from FastAPI shutdown event."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("⏹  Deadline scheduler stopped")
