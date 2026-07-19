from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, AnalysisResult, Assessment, Question, AssessmentAttempt, Resume
from app.schemas import AssessmentResponse, AssessmentSubmitRequest, AssessmentAttemptResponse
from app.services import gemini_service

router = APIRouter()

@router.post("/generate/{analysis_id}", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def generate_assessment(
    analysis_id: int,
    difficulty: str = Query("Medium", description="Easy, Medium, Hard"),
    time_limit: int = Query(600, description="Time limit in seconds"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a timed technical quiz targeting identified skill gaps, with custom difficulty.
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
    
    try:
        quiz_data = gemini_service.generate_quiz(
            missing_skills=analysis.missing_skills or [],
            job_title=analysis.job_description.title,
            difficulty=difficulty
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate quiz with Gemini AI: {str(e)}"
        )
        
    db_assessment = Assessment(
        analysis_result_id=analysis.id,
        title=quiz_data.title,
        difficulty=difficulty,
        time_limit=time_limit
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    
    for q in quiz_data.questions:
        db_question = Question(
            assessment_id=db_assessment.id,
            question_text=q.question_text,
            options=q.options,
            correct_answer=q.correct_answer,
            explanation=q.explanation
        )
        db.add(db_question)
        
    db.commit()
    db.refresh(db_assessment)
    
    return db_assessment


@router.get("/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the top scoring users across all quiz assessments.
    """
    results = db.query(
        User.full_name,
        User.email,
        func.max(AssessmentAttempt.score).label("high_score"),
        func.count(AssessmentAttempt.id).label("total_quizzes")
    ).join(AssessmentAttempt, User.id == AssessmentAttempt.user_id).group_by(User.id).order_by(func.max(AssessmentAttempt.score).desc()).limit(10).all()
    
    leaderboard = []
    for r in results:
        leaderboard.append({
            "name": r.full_name or r.email,
            "score": round(r.high_score, 1),
            "total_quizzes": r.total_quizzes
        })
        
    return leaderboard


@router.get("/weak-topics")
def get_weak_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyzes historical quiz answers to detect weak concepts or topics.
    """
    attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.user_id == current_user.id).all()
    if not attempts:
        return {"weak_topics": [], "message": "No quiz history yet. Take a quiz to analyze weak topics!"}

    weak_topics = {}
    
    for attempt in attempts:
        assessment = db.query(Assessment).filter(Assessment.id == attempt.assessment_id).first()
        if not assessment:
            continue
            
        questions_map = {str(q.id): q for q in assessment.questions}
        for q_id, selected in attempt.answers.items():
            question = questions_map.get(q_id)
            if not question:
                continue
            
            # If the answer is incorrect
            if selected.strip().lower() != question.correct_answer.strip().lower():
                # Extract potential key topics from question text
                for word in question.question_text.split():
                    if len(word) > 5 and word[0].isupper():
                        clean_word = "".join(filter(str.isalnum, word))
                        if clean_word:
                            weak_topics[clean_word] = weak_topics.get(clean_word, 0) + 1

    sorted_weak = sorted(weak_topics.items(), key=lambda x: x[1], reverse=True)[:5]
    return {
        "weak_topics": [item[0] for item in sorted_weak],
        "message": "Focus on studying these topics to improve compatibility score."
    }


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve questions for a specific assessment.
    """
    assessment = db.query(Assessment).join(AnalysisResult).join(Resume).filter(
        Assessment.id == assessment_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found or access denied."
        )
        
    return assessment


@router.post("/{assessment_id}/submit", response_model=AssessmentAttemptResponse)
def submit_assessment(
    assessment_id: int,
    submission: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit answers for a quiz and grade it.
    """
    assessment = db.query(Assessment).join(AnalysisResult).join(Resume).filter(
        Assessment.id == assessment_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found or access denied."
        )
        
    questions_map = {q.id: q for q in assessment.questions}
    if not questions_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assessment has no questions."
        )
        
    correct_count = 0
    total_questions = len(questions_map)
    user_answers_dict = {}
    
    for ans in submission.answers:
        q_id = ans.question_id
        if q_id not in questions_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question ID {q_id} does not belong to this assessment."
            )
        
        db_question = questions_map[q_id]
        selected = ans.selected_option
        user_answers_dict[str(q_id)] = selected
        
        if selected.strip().lower() == db_question.correct_answer.strip().lower():
            correct_count += 1
            
    score = (correct_count / total_questions) * 100.0 if total_questions > 0 else 0.0
    
    attempt = AssessmentAttempt(
        user_id=current_user.id,
        assessment_id=assessment.id,
        score=score,
        answers=user_answers_dict
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return attempt


@router.get("/attempts/history", response_model=List[AssessmentAttemptResponse])
def get_attempts_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all user attempts and scores.
    """
    return db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id
    ).order_by(AssessmentAttempt.completed_at.desc()).all()
