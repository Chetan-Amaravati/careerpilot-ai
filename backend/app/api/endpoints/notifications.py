from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Notification
from app.schemas import NotificationResponse

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all notifications (smart reminders, alerts) for the logged-in candidate.
    """
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()


@router.put("/{id}/read", response_model=NotificationResponse)
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a notification alert as read.
    """
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )

    notif.is_read = True
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/trigger-reminders")
def trigger_smart_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates trigger check for smart reminders (e.g., resume update checks, learning streaks).
    Creates demo notifications if none exist.
    """
    notif_count = db.query(Notification).filter(Notification.user_id == current_user.id).count()
    
    if notif_count == 0:
        demo_notifs = [
            Notification(
                user_id=current_user.id,
                title="Weekly Quiz Challenge",
                message="Test your skills on missing technologies today in the Quiz Arena!",
                type="Reminder"
            ),
            Notification(
                user_id=current_user.id,
                title="Mock Interview Practice",
                message="Prepare for technical interview challenges. Schedule a mock session now.",
                type="Reminder"
            ),
            Notification(
                user_id=current_user.id,
                title="Optimize Resume Profile",
                message="Add missing skills (Docker, Kubernetes) to your active resume to increase compatibility score.",
                type="Alert"
            )
        ]
        db.add_all(demo_notifs)
        db.commit()
    
    return {"message": "Smart reminders triggered successfully."}
