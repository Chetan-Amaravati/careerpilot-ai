from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, LearningProgress
from app.schemas import LearningProgressResponse, LearningProgressCreate, LearningProgressUpdate

router = APIRouter()

@router.get("/progress", response_model=List[LearningProgressResponse])
def get_learning_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all learning path items (courses, projects, certifications) for the candidate.
    """
    return db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id
    ).order_by(LearningProgress.created_at.desc()).all()


@router.post("/items", response_model=LearningProgressResponse)
def add_learning_item(
    item_in: LearningProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a new learning item (e.g. from recommendation or manual entry) to progress tracker.
    """
    item = LearningProgress(
        user_id=current_user.id,
        item_type=item_in.item_type,
        item_title=item_in.item_title,
        item_link=item_in.item_link,
        status="Pending",
        weekly_goal=item_in.weekly_goal
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{id}", response_model=LearningProgressResponse)
def update_learning_item(
    id: int,
    item_up: LearningProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the status of a specific learning milestone.
    """
    item = db.query(LearningProgress).filter(
        LearningProgress.id == id,
        LearningProgress.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning progress item not found."
        )

    item.status = item_up.status
    if item_up.status == "Completed":
        item.completed_at = datetime.datetime.utcnow()
    else:
        item.completed_at = None

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/stats")
def get_learning_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for learning milestones, including total goals and progress.
    """
    items = db.query(LearningProgress).filter(LearningProgress.user_id == current_user.id).all()
    
    total = len(items)
    completed = len([i for i in items if i.status == "Completed"])
    in_progress = len([i for i in items if i.status == "In_Progress"])
    pending = len([i for i in items if i.status == "Pending"])
    
    weekly_items = [i for i in items if i.weekly_goal]
    weekly_total = len(weekly_items)
    weekly_completed = len([i for i in weekly_items if i.status == "Completed"])

    return {
        "total_items": total,
        "completed_items": completed,
        "in_progress_items": in_progress,
        "pending_items": pending,
        "weekly_goals_total": weekly_total,
        "weekly_goals_completed": weekly_completed,
        "completion_rate": (completed / total * 100) if total > 0 else 0.0,
        "weekly_completion_rate": (weekly_completed / weekly_total * 100) if weekly_total > 0 else 0.0
    }
