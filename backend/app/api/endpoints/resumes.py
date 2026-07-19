import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Resume
from app.schemas import ResumeResponse
from app.services.pdf_parser import extract_text_from_pdf_bytes
from app.services import gemini_service

router = APIRouter()

# Initialize upload directory path at project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a PDF resume, track versioning, run it through Gemini to extract skills/experience,
    and generate initial optimization suggestions (strengths & weaknesses).
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume uploads are supported at this time."
        )
    
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading file: {str(e)}"
        )
    
    raw_text = extract_text_from_pdf_bytes(pdf_bytes)
    
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )
    
    # Versioning: increment version and disable older resumes
    existing_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    version = len(existing_resumes) + 1
    
    for old_resume in existing_resumes:
        old_resume.is_active = False
        db.add(old_resume)

    try:
        # 1. Parse resume skills, experience, and education
        parsed_data = gemini_service.parse_resume(raw_text)
        parsed_skills = parsed_data.skills
        parsed_experience = [exp.model_dump() for exp in parsed_data.experience]
        parsed_education = [edu.model_dump() for edu in parsed_data.education]
        
        # 2. Perform AI Resume Review (strengths, weaknesses, layout tips)
        review_details = gemini_service.review_resume(raw_text)
        optimization_suggestions = {
            "strengths": review_details.strengths,
            "weaknesses": review_details.weaknesses,
            "formatting_tips": review_details.formatting_tips,
            "action_verb_suggestions": review_details.action_verb_suggestions
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse and review resume with Gemini AI: {str(e)}"
        )

    # Save metadata to Database
    new_resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        raw_text=raw_text,
        version=version,
        is_active=True,
        parsed_skills=parsed_skills,
        parsed_experience=parsed_experience,
        parsed_education=parsed_education,
        optimization_suggestions=optimization_suggestions,
        ats_keyword_suggestions={}
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    
    return new_resume


@router.get("/", response_model=List[ResumeResponse])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all resumes uploaded by the current user.
    """
    return db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.version.desc()).all()


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve details of a specific resume uploaded by the current user.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, 
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied."
        )
    return resume


@router.put("/{resume_id}/set-active", response_model=ResumeResponse)
def set_active_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a specific resume version as active and deactivate other versions.
    """
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    target_resume = None
    
    for r in resumes:
        if r.id == resume_id:
            r.is_active = True
            target_resume = r
        else:
            r.is_active = False
        db.add(r)
        
    if not target_resume:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    db.commit()
    db.refresh(target_resume)
    return target_resume


@router.post("/{resume_id}/rewrite-bullet")
def rewrite_bullet_point(
    resume_id: int,
    bullet_text: str,
    target_jd: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rewrite a resume bullet point using AI to optimized keywords of a target JD.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, 
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )

    try:
        rewritten = gemini_service.rewrite_resume_bullet(bullet_text, target_jd)
        return rewritten
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bullet rewriter failed: {str(e)}"
        )


@router.post("/{resume_id}/cover-letter")
def build_cover_letter(
    resume_id: int,
    job_description: str = Body(...),
    company: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a tailored cover letter from the selected resume and a job description.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, 
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )

    try:
        cover_letter = gemini_service.generate_cover_letter(
            resume_text=resume.raw_text,
            jd_text=job_description,
            company=company
        )
        return cover_letter
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cover letter generator failed: {str(e)}"
        )


@router.post("/{resume_id}/linkedin")
def optimize_linkedin_profile(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Optimize LinkedIn profile headline, summary, and experience sections.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, 
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )

    try:
        optimization = gemini_service.optimize_linkedin(resume.raw_text)
        return optimization
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LinkedIn optimizer failed: {str(e)}"
        )
