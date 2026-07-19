from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Resume, JobDescription, AnalysisResult, AssessmentAttempt, InterviewAttempt
from app.schemas import AdminSystemStats

router = APIRouter()

@router.get("/stats", response_model=AdminSystemStats)
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get system-wide platform statistics. Restricted to administrator accounts.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )

    # Base counts
    total_users = db.query(User).count()
    total_resumes = db.query(Resume).count()
    total_matches = db.query(AnalysisResult).count()
    total_quizzes = db.query(AssessmentAttempt).count()
    total_interviews = db.query(InterviewAttempt).count()

    # Average statistics
    avg_score = db.query(func.avg(AnalysisResult.matching_score)).scalar() or 0.0
    
    # Calculate some mock placeholder metrics for AI token counters
    ai_token_estimate = (total_resumes * 1500) + (total_matches * 1200) + (total_quizzes * 800) + (total_interviews * 2000)

    # Extrapolate top skills from parsed resume JSON lists
    top_missing_skills = []
    top_matched_skills = []
    
    # Simple query extraction
    analyses = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).limit(20).all()
    missing_freq = {}
    matched_freq = {}
    
    for a in analyses:
        for ms in a.missing_skills:
            missing_freq[ms] = missing_freq.get(ms, 0) + 1
        for mt in a.matched_skills:
            matched_freq[mt] = matched_freq.get(mt, 0) + 1
            
    sorted_missing = sorted(missing_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    sorted_matched = sorted(matched_freq.items(), key=lambda x: x[1], reverse=True)[:5]

    return AdminSystemStats(
        total_users=total_users,
        total_resumes=total_resumes,
        total_matches=total_matches,
        total_quizzes_taken=total_quizzes,
        total_interviews_taken=total_interviews,
        resume_stats={
            "average_compatibility_score": round(avg_score, 1),
            "total_saved_job_descriptions": db.query(JobDescription).count()
        },
        skill_stats={
            "top_missing_skills": [item[0] for item in sorted_missing],
            "top_matched_skills": [item[0] for item in sorted_matched]
        },
        ai_token_usage_estimate=ai_token_estimate
    )
