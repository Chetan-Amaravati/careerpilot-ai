from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas import UserResponse, UserProfileUpdate

router = APIRouter()

@router.get("/", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """
    Get the authenticated user's profile information.
    """
    return current_user

@router.put("/", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update profile details for the logged-in candidate.
    """
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.career_goals is not None:
        current_user.career_goals = profile_data.career_goals
    if profile_data.preferred_roles is not None:
        current_user.preferred_roles = profile_data.preferred_roles
    if profile_data.preferred_locations is not None:
        current_user.preferred_locations = profile_data.preferred_locations
    if profile_data.experience_level is not None:
        current_user.experience_level = profile_data.experience_level
    if profile_data.education is not None:
        current_user.education = profile_data.education
    if profile_data.achievements is not None:
        current_user.achievements = profile_data.achievements

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
