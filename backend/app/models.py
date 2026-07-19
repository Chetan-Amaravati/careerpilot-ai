import datetime
from typing import List, Optional
from sqlalchemy import String, Text, DateTime, JSON, Float, ForeignKey, Integer, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Career profile fields
    career_goals: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # e.g., {"target_roles": [], "salary_target": ""}
    preferred_roles: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # list of strings
    preferred_locations: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # list of strings
    experience_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., Junior, Mid, Senior
    education: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # structure for schooling
    achievements: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # list of strings
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    # Relationships
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    attempts: Mapped[List["AssessmentAttempt"]] = relationship("AssessmentAttempt", back_populates="user", cascade="all, delete-orphan")
    interviews: Mapped[List["InterviewAttempt"]] = relationship("InterviewAttempt", back_populates="user", cascade="all, delete-orphan")
    saved_jobs: Mapped[List["JobDescription"]] = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    learning_progress: Mapped[List["LearningProgress"]] = relationship("LearningProgress", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    parsed_skills: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    parsed_experience: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    parsed_education: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    optimization_suggestions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # strengths, weaknesses, tips
    ats_keyword_suggestions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="resumes")
    analysis_results: Mapped[List["AnalysisResult"]] = relationship("AnalysisResult", back_populates="resume", cascade="all, delete-orphan")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_skills: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    salary_estimate: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    missing_experience_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped[Optional["User"]] = relationship("User", back_populates="saved_jobs")
    analysis_results: Mapped[List["AnalysisResult"]] = relationship("AnalysisResult", back_populates="job_description", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_description_id: Mapped[int] = mapped_column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    matching_score: Mapped[float] = mapped_column(Float, nullable=False)
    matched_skills: Mapped[dict] = mapped_column(JSON, nullable=False)  # JSON list
    missing_skills: Mapped[dict] = mapped_column(JSON, nullable=False)  # JSON list
    recommendations: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ats_keyword_suggestions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    resume: Mapped["Resume"] = relationship("Resume", back_populates="analysis_results")
    job_description: Mapped["JobDescription"] = relationship("JobDescription", back_populates="analysis_results")
    assessments: Mapped[List["Assessment"]] = relationship("Assessment", back_populates="analysis_result", cascade="all, delete-orphan")


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_result_id: Mapped[int] = mapped_column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)  # Easy, Medium, Hard
    time_limit: Mapped[int] = mapped_column(Integer, default=600, nullable=False)  # time in seconds
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    analysis_result: Mapped["AnalysisResult"] = relationship("AnalysisResult", back_populates="assessments")
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    attempts: Mapped[List["AssessmentAttempt"]] = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assessment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict] = mapped_column(JSON, nullable=False)  # JSON list
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="questions")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    answers: Mapped[dict] = mapped_column(JSON, nullable=False)  # JSON {question_id: selected_option}
    completed_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="attempts")
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="attempts")


class InterviewAttempt(Base):
    __tablename__ = "interview_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # HR or Technical
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    communication_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    overall_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    improvement_suggestions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="interviews")
    questions: Mapped[List["InterviewQuestion"]] = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    interview_id: Mapped[int] = mapped_column(Integer, ForeignKey("interview_attempts.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    user_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evaluation_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    interview: Mapped["InterviewAttempt"] = relationship("InterviewAttempt", back_populates="questions")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Course, Project, Certification
    item_title: Mapped[str] = mapped_column(String(255), nullable=False)
    item_link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)  # Pending, In_Progress, Completed
    weekly_goal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="learning_progress")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="Reminder", nullable=False)  # Reminder, Alert
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="notifications")
