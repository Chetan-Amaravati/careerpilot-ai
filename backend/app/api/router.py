from fastapi import APIRouter
from app.api.endpoints import auth, resumes, analysis, assessments, profile, interviews, learning, notifications, admin

api_router = APIRouter()

# Register sub-routers with logical prefixes and Swagger documentation tags
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Skill Gap Analysis"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["Interviews"])
api_router.include_router(learning.router, prefix="/learning", tags=["Learning Platform"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Panel"])
