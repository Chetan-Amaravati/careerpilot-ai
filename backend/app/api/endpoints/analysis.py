from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Resume, JobDescription, AnalysisResult
from app.schemas import AnalysisRequest, AnalysisResultResponse, JobDescriptionResponse
from app.services import gemini_service

router = APIRouter()

@router.post("/match", response_model=AnalysisResultResponse, status_code=status.HTTP_201_CREATED)
def match_resume_to_jd(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Match a user's resume against a job description.
    Integrates multiple resume uploads, saving JDs, salary estimations, and keywords.
    """
    # 1. Fetch resume and verify ownership
    resume = db.query(Resume).filter(
        Resume.id == request.resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied."
        )
    
    # 2. Call Gemini Service to analyze the gap
    try:
        analysis = gemini_service.analyze_skill_gap(
            resume_skills=resume.parsed_skills or [],
            job_description_text=request.job_description_text,
            job_title=request.job_title
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to perform skill gap analysis with Gemini AI: {str(e)}"
        )
    
    # Create salary estimation based on job title
    salary_est = "$85,000 - $120,000"
    if "senior" in request.job_title.lower() or "lead" in request.job_title.lower() or "principal" in request.job_title.lower():
        salary_est = "$130,000 - $180,000"
    elif "junior" in request.job_title.lower() or "entry" in request.job_title.lower():
        salary_est = "$55,000 - $75,000"
        
    # 3. Create and save JobDescription record
    jd_skills = list(set(analysis.matched_skills + analysis.missing_skills))
    
    db_jd = JobDescription(
        user_id=current_user.id,
        title=request.job_title,
        raw_text=request.job_description_text,
        parsed_skills=jd_skills,
        salary_estimate=salary_est,
        missing_experience_analysis="Focus on gaining experience in: " + ", ".join(analysis.missing_skills[:3])
    )
    db.add(db_jd)
    db.commit()
    db.refresh(db_jd)
    
    # 4. Create and save AnalysisResult record
    db_analysis = AnalysisResult(
        resume_id=resume.id,
        job_description_id=db_jd.id,
        matching_score=analysis.matching_score,
        matched_skills=analysis.matched_skills,
        missing_skills=analysis.missing_skills,
        recommendations=analysis.recommendations.model_dump(),
        ats_keyword_suggestions={"keywords": getattr(analysis, 'ats_keyword_suggestions', [])}
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    
    return db_analysis


@router.get("/jobs", response_model=List[JobDescriptionResponse])
def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all job descriptions saved by the candidate.
    """
    return db.query(JobDescription).filter(
        JobDescription.user_id == current_user.id
    ).order_by(JobDescription.created_at.desc()).all()


@router.delete("/jobs/{id}")
def delete_saved_job(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a saved job description.
    """
    job = db.query(JobDescription).filter(
        JobDescription.id == id,
        JobDescription.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved job description not found."
        )
        
    db.delete(job)
    db.commit()
    return {"message": "Job description removed successfully."}


@router.get("/history", response_model=List[AnalysisResultResponse])
def get_match_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve user's historical matching results.
    """
    return db.query(AnalysisResult).join(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(AnalysisResult.created_at.desc()).all()


@router.get("/{analysis_id}", response_model=AnalysisResultResponse)
def get_analysis_result(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve details of a specific skill gap analysis result.
    """
    analysis = db.query(AnalysisResult).join(Resume).filter(
        AnalysisResult.id == analysis_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result not found or access denied."
        )
    return analysis
