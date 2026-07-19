from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, InterviewAttempt, InterviewQuestion
from app.schemas import InterviewStartRequest, InterviewAttemptResponse, InterviewQuestionResponse, InterviewAnswerSubmit, InterviewGradingResponse
from app.services import gemini_service

router = APIRouter()

@router.post("/start", response_model=InterviewAttemptResponse)
def start_interview(
    req: InterviewStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new mock interview session and generate the first question.
    """
    # Create new attempt
    attempt = InterviewAttempt(
        user_id=current_user.id,
        job_title=req.job_title,
        type=req.type,
        score=0.0,
        communication_score=0.0
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    try:
        # Generate first question using Gemini
        ai_question = gemini_service.generate_interview_question(
            job_title=req.job_title,
            type=req.type,
            history=[]
        )
        
        # Save question to DB
        question = InterviewQuestion(
            interview_id=attempt.id,
            question_text=ai_question.question_text,
            user_answer=""
        )
        db.add(question)
        db.commit()
        db.refresh(attempt)
    except Exception as e:
        db.delete(attempt)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview question: {str(e)}"
        )

    return attempt


@router.post("/{id}/submit-answer")
def submit_answer(
    id: int,
    payload: InterviewAnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit answer for a question and retrieve the next question.
    Generates up to 5 questions in total.
    """
    attempt = db.query(InterviewAttempt).filter(
        InterviewAttempt.id == id,
        InterviewAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found."
        )

    # Save user's answer
    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == payload.question_id,
        InterviewQuestion.interview_id == id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found."
        )

    question.user_answer = payload.user_answer
    db.add(question)
    db.commit()

    # Get history of completed questions
    completed_questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == id,
        InterviewQuestion.user_answer != ""
    ).all()

    # If we have reached 5 answered questions, mark as complete and return
    if len(completed_questions) >= 5:
        return {"completed": True, "next_question": None}

    # Generate next question
    history_payload = [
        {"question": q.question_text, "answer": q.user_answer}
        for q in completed_questions
    ]

    try:
        ai_question = gemini_service.generate_interview_question(
            job_title=attempt.job_title,
            type=attempt.type,
            history=history_payload
        )
        
        # Save next question to DB
        next_q = InterviewQuestion(
            interview_id=id,
            question_text=ai_question.question_text
        )
        db.add(next_q)
        db.commit()
        db.refresh(next_q)
        
        return {
            "completed": False,
            "next_question": {
                "id": next_q.id,
                "question_text": next_q.question_text
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate next interview question: {str(e)}"
        )


@router.post("/{id}/finalize", response_model=InterviewGradingResponse)
def finalize_interview(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finalize the interview session, grading all responses with Gemini.
    """
    attempt = db.query(InterviewAttempt).filter(
        InterviewAttempt.id == id,
        InterviewAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found."
        )

    questions = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == id).all()
    history_payload = [
        {"question": q.question_text, "answer": q.user_answer or "No answer provided."}
        for q in questions
    ]

    try:
        evaluation = gemini_service.grade_interview_session(history_payload)
        
        # Update attempt fields
        attempt.score = evaluation.score
        attempt.communication_score = evaluation.communication_score
        attempt.overall_feedback = evaluation.overall_feedback
        attempt.improvement_suggestions = {"suggestions": evaluation.improvement_suggestions}
        
        db.add(attempt)
        db.commit()
        
        return InterviewGradingResponse(
            attempt_id=attempt.id,
            score=attempt.score,
            communication_score=attempt.communication_score,
            overall_feedback=attempt.overall_feedback,
            improvement_suggestions=attempt.improvement_suggestions
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grading session failed: {str(e)}"
        )


@router.get("/history", response_model=List[InterviewAttemptResponse])
def get_interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user's mock interview history.
    """
    return db.query(InterviewAttempt).filter(
        InterviewAttempt.user_id == current_user.id
    ).order_by(InterviewAttempt.created_at.desc()).all()
