import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ==========================================
# AUTHENTICATION & USER SCHEMAS
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters.")

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    career_goals: Optional[Dict[str, Any]] = None  # e.g., {"target_roles": [], "salary_target": ""}
    preferred_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    experience_level: Optional[str] = None  # Junior, Mid, Senior
    education: Optional[Dict[str, Any]] = None
    achievements: Optional[List[str]] = None

class UserResponse(UserBase):
    id: int
    is_admin: bool
    career_goals: Optional[Dict[str, Any]] = None
    preferred_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    experience_level: Optional[str] = None
    education: Optional[Dict[str, Any]] = None
    achievements: Optional[List[str]] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# ==========================================
# RESUME SCHEMAS
# ==========================================

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_path: str
    raw_text: str
    version: int
    is_active: bool
    parsed_skills: Optional[List[str]] = None
    parsed_experience: Optional[List[Dict[str, Any]]] = None
    parsed_education: Optional[List[Dict[str, Any]]] = None
    optimization_suggestions: Optional[Dict[str, Any]] = None
    ats_keyword_suggestions: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# JOB DESCRIPTION SCHEMAS
# ==========================================

class JobDescriptionCreate(BaseModel):
    title: str
    company: Optional[str] = None
    raw_text: str

class JobDescriptionResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    company: Optional[str] = None
    raw_text: str
    parsed_skills: Optional[List[str]] = None
    salary_estimate: Optional[str] = None
    missing_experience_analysis: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SKILL GAP ANALYSIS SCHEMAS
# ==========================================

class AnalysisRequest(BaseModel):
    resume_id: int
    job_description_text: str
    job_title: str

class AnalysisResultResponse(BaseModel):
    id: int
    resume_id: int
    job_description_id: int
    matching_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: Optional[Dict[str, Any]] = None
    ats_keyword_suggestions: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ASSESSMENT & QUIZ SCHEMAS
# ==========================================

class QuestionResponse(BaseModel):
    id: int
    question_text: str
    options: List[str]

    model_config = ConfigDict(from_attributes=True)

class AssessmentResponse(BaseModel):
    id: int
    analysis_result_id: int
    title: str
    difficulty: str
    time_limit: int
    questions: List[QuestionResponse]
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: str

class AssessmentSubmitRequest(BaseModel):
    answers: List[AnswerSubmission]

class AssessmentAttemptResponse(BaseModel):
    id: int
    user_id: int
    assessment_id: int
    score: float
    answers: Dict[str, str]
    completed_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# INTERVIEW PREPARATION SCHEMAS
# ==========================================

class InterviewStartRequest(BaseModel):
    job_title: str
    type: str  # HR or Technical

class InterviewQuestionResponse(BaseModel):
    id: int
    question_text: str

    model_config = ConfigDict(from_attributes=True)

class InterviewAttemptResponse(BaseModel):
    id: int
    user_id: int
    job_title: str
    type: str
    score: float
    communication_score: float
    overall_feedback: Optional[str] = None
    improvement_suggestions: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
    questions: List[InterviewQuestionResponse]

    model_config = ConfigDict(from_attributes=True)

class InterviewAnswerSubmit(BaseModel):
    question_id: int
    user_answer: str

class InterviewGradingResponse(BaseModel):
    attempt_id: int
    score: float
    communication_score: float
    overall_feedback: str
    improvement_suggestions: Dict[str, Any]


# ==========================================
# LEARNING PLATFORM SCHEMAS
# ==========================================

class LearningProgressCreate(BaseModel):
    item_type: str  # Course, Project, Certification
    item_title: str
    item_link: Optional[str] = None
    weekly_goal: Optional[bool] = False

class LearningProgressUpdate(BaseModel):
    status: str  # Pending, In_Progress, Completed

class LearningProgressResponse(BaseModel):
    id: int
    user_id: int
    item_type: str
    item_title: str
    item_link: Optional[str] = None
    status: str
    weekly_goal: bool
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# NOTIFICATION SCHEMAS
# ==========================================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ADMIN SYSTEM STATS SCHEMAS
# ==========================================

class AdminSystemStats(BaseModel):
    total_users: int
    total_resumes: int
    total_matches: int
    total_quizzes_taken: int
    total_interviews_taken: int
    resume_stats: Dict[str, Any]  # e.g. {"average_skills_parsed": 12}
    skill_stats: Dict[str, Any]   # e.g. {"top_missing_skills": [], "top_matched_skills": []}
    ai_token_usage_estimate: int
