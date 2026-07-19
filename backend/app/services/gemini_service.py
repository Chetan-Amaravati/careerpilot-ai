from typing import List, Optional, Dict, Any
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import settings

# Initialize Gemini Client safely
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
else:
    client = genai.Client()


# ==========================================================
# PYDANTIC SCHEMAS FOR STRUCTURED GEMINI OUTPUT
# ==========================================================

class ExperienceItem(BaseModel):
    job_title: str = Field(..., description="Job title or role held")
    company: str = Field(..., description="Name of company or organization")
    start_date: Optional[str] = Field(None, description="Start date (e.g. Month Year or Year)")
    end_date: Optional[str] = Field(None, description="End date or 'Present'")
    description: Optional[str] = Field(None, description="Key responsibilities and achievements")

class EducationItem(BaseModel):
    degree: str = Field(..., description="Degree obtained, major, or certification")
    institution: str = Field(..., description="Name of school, university, or issuer")
    graduation_year: Optional[str] = Field(None, description="Graduation year or completion date")

class ParsedResume(BaseModel):
    skills: List[str] = Field(..., description="List of technical, tool, and soft skills identified")
    experience: List[ExperienceItem] = Field(..., description="List of past jobs and roles")
    education: List[EducationItem] = Field(..., description="List of academic degrees and certifications")


class Recommendations(BaseModel):
    learning_path: List[str] = Field(..., description="Recommended list of topics or skills to learn next")
    certifications: List[str] = Field(..., description="Recommended certifications to pursue")
    project_ideas: List[str] = Field(..., description="Hands-on project ideas to build and demonstrate missing skills")

class SkillGapAnalysis(BaseModel):
    matching_score: float = Field(..., description="Overall compatibility score from 0.0 to 100.0")
    matched_skills: List[str] = Field(..., description="Skills from the resume that match the job description")
    missing_skills: List[str] = Field(..., description="Required skills from the job description that are missing or weak in the resume")
    recommendations: Recommendations = Field(..., description="Actionable learning paths, certifications, and projects")
    ats_keyword_suggestions: List[str] = Field(..., description="Specific keywords and phrases from the JD that should be added to the resume")


class QuizQuestion(BaseModel):
    question_text: str = Field(..., description="The multiple choice question text")
    options: List[str] = Field(..., description="Exactly 4 distinct multiple choice options")
    correct_answer: str = Field(..., description="The correct option, which must match one of the options list items EXACTLY")
    explanation: str = Field(..., description="Brief explanation of why the correct answer is right")

class QuizAssessment(BaseModel):
    title: str = Field(..., description="Title of the quiz")
    questions: List[QuizQuestion] = Field(..., description="List of technical multiple choice questions")


# New AI Features Structures
class ResumeReviewDetails(BaseModel):
    strengths: List[str] = Field(..., description="List of major strengths identified in the resume")
    weaknesses: List[str] = Field(..., description="List of major areas of improvement or weaknesses")
    formatting_tips: List[str] = Field(..., description="Formatting, grammar, or layout improvement suggestions")
    action_verb_suggestions: List[str] = Field(..., description="Suggested stronger action verbs to replace passive or weak ones")

class GeneratedCoverLetter(BaseModel):
    subject: str = Field(..., description="Subject line for the cover letter")
    salutation: str = Field(..., description="Professional salutation")
    introduction: str = Field(..., description="Opening paragraph expressing interest and hooks")
    body: str = Field(..., description="Main body paragraph aligning skills with job description")
    closing: str = Field(..., description="Closing paragraph with call to action")
    sign_off: str = Field(..., description="Professional sign-off")

class LinkedInSuggestions(BaseModel):
    headline: str = Field(..., description="Optimized, professional headline")
    about_summary: str = Field(..., description="A compelling About/Summary section for LinkedIn profile")
    experience_enhancements: List[str] = Field(..., description="Specific bullet point improvements for past experience sections")

class SingleInterviewQuestion(BaseModel):
    question_text: str = Field(..., description="A realistic behavioral or technical interview question")
    ideal_concepts: List[str] = Field(..., description="Key concepts or keywords expected in a good answer")

class InterviewGrading(BaseModel):
    score: float = Field(..., description="Overall technical accuracy score from 0.0 to 100.0")
    communication_score: float = Field(..., description="Communication quality, clarity, and tone score from 0.0 to 100.0")
    overall_feedback: str = Field(..., description="Detailed written review of the answers")
    improvement_suggestions: List[str] = Field(..., description="Actionable points to improve answers")

class ResumeBulletRewrite(BaseModel):
    original_bullet: str = Field(..., description="The original bullet point input")
    rewritten_bullet: str = Field(..., description="The rewritten bullet point containing target ATS keywords")
    explanation: str = Field(..., description="Explanation of what keywords were incorporated and why it stands out")


# ==========================================================
# SERVICE FUNCTIONS
# ==========================================================

def parse_resume(raw_text: str) -> ParsedResume:
    prompt = (
        "Analyze the following resume text. Extract all identified skills, "
        "work experience items, and educational degrees or certifications. "
        "Return the output as structured JSON.\n\n"
        f"--- RESUME TEXT ---\n{raw_text}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ParsedResume,
            temperature=0.1
        )
    )
    return ParsedResume.model_validate_json(response.text)


def analyze_skill_gap(resume_skills: List[str], job_description_text: str, job_title: str) -> SkillGapAnalysis:
    skills_list_str = ", ".join(resume_skills) if resume_skills else "None listed"
    
    prompt = (
        f"You are a senior recruiter analyzing a candidate for a '{job_title}' position.\n"
        f"Compare the candidate's skills: [{skills_list_str}] against the job description below.\n"
        "1. Identify matched skills.\n"
        "2. Identify missing/gap skills required for the role.\n"
        "3. Calculate a matching score from 0.0 to 100.0 based on how well their skills match the JD requirements.\n"
        "4. Provide constructive recommendations including a learning path, certifications, and project ideas.\n"
        "5. List ATS keyword suggestions that should be added to their resume.\n\n"
        f"--- JOB DESCRIPTION ---\n{job_description_text}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SkillGapAnalysis,
            temperature=0.2
        )
    )
    return SkillGapAnalysis.model_validate_json(response.text)


def generate_quiz(missing_skills: List[str], job_title: str, difficulty: str = "Medium") -> QuizAssessment:
    gaps_str = ", ".join(missing_skills) if missing_skills else "General technical skills"
    
    prompt = (
        f"You are a technical interviewer preparing a screening quiz for a '{job_title}' role.\n"
        f"Generate a quiz with exactly 5 multiple choice questions targeting these specific areas: {gaps_str}.\n"
        f"The quiz difficulty level should be: {difficulty}.\n"
        "Each question should test basic to intermediate conceptual knowledge of the missing skills. "
        "Make sure the options are realistic and that the correct_answer is one of the options."
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=QuizAssessment,
            temperature=0.4
        )
    )
    return QuizAssessment.model_validate_json(response.text)


def review_resume(raw_text: str) -> ResumeReviewDetails:
    prompt = (
        "Provide a comprehensive, senior-level review of the following resume text. "
        "Identify major strengths, weaknesses, formatting suggestions, and stronger action verbs.\n\n"
        f"--- RESUME TEXT ---\n{raw_text}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ResumeReviewDetails,
            temperature=0.3
        )
    )
    return ResumeReviewDetails.model_validate_json(response.text)


def generate_cover_letter(resume_text: str, jd_text: str, company: Optional[str] = None) -> GeneratedCoverLetter:
    company_str = company if company else "the Hiring Company"
    prompt = (
        f"Generate a professional, compelling cover letter for a candidate applying to a job at '{company_str}'.\n"
        "Use the candidate's resume details and align their matching skills with the job description below.\n\n"
        f"--- RESUME ---\n{resume_text}\n\n"
        f"--- JOB DESCRIPTION ---\n{jd_text}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeneratedCoverLetter,
            temperature=0.5
        )
    )
    return GeneratedCoverLetter.model_validate_json(response.text)


def optimize_linkedin(resume_text: str) -> LinkedInSuggestions:
    prompt = (
        "Analyze the following resume text and generate highly optimized LinkedIn profile sections, "
        "including a powerful headline, an engaging 'About/Summary' section, and experience bullets.\n\n"
        f"--- RESUME TEXT ---\n{resume_text}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=LinkedInSuggestions,
            temperature=0.5
        )
    )
    return LinkedInSuggestions.model_validate_json(response.text)


def generate_interview_question(job_title: str, type: str, history: List[Dict[str, str]]) -> SingleInterviewQuestion:
    history_str = ""
    for idx, exchange in enumerate(history):
        history_str += f"Q{idx+1}: {exchange.get('question')}\nAnswer: {exchange.get('answer')}\n\n"
    
    prompt = (
        f"You are conducting a live mock interview for a '{job_title}' role. "
        f"This is a {type} interview. Generates a single, realistic question.\n\n"
        "Review the history of previous questions and answers in this session to make the next question "
        "progress logically and probe further into their skills. Do not repeat previous topics:\n"
        f"--- CONVERSATION HISTORY ---\n{history_str}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SingleInterviewQuestion,
            temperature=0.5
        )
    )
    return SingleInterviewQuestion.model_validate_json(response.text)


def grade_interview_session(history: List[Dict[str, str]]) -> InterviewGrading:
    conversation = ""
    for idx, exchange in enumerate(history):
        conversation += f"Question: {exchange.get('question')}\nCandidate Answer: {exchange.get('answer')}\n\n"
        
    prompt = (
        "You are a principal technical recruiter. Review the transcript of the candidate's interview session below. "
        "Evaluate the answers for technical accuracy and depth (technical score) and review the grammar, clarity, "
        "confidence, and professional tone (communication score). Provide a detailed written review and "
        "clear improvement suggestions.\n\n"
        f"--- INTERVIEW TRANSCRIPT ---\n{conversation}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=InterviewGrading,
            temperature=0.3
        )
    )
    return InterviewGrading.model_validate_json(response.text)


def rewrite_resume_bullet(bullet: str, target_jd: str) -> ResumeBulletRewrite:
    prompt = (
        "You are an expert resume writer. Rewrite the following resume work-experience bullet point "
        "so that it organically incorporates key keywords and skills found in the target job description. "
        "Make it sound impactful and action-oriented.\n\n"
        f"--- ORIGINAL BULLET ---\n{bullet}\n\n"
        f"--- TARGET JOB DESCRIPTION ---\n{target_jd}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ResumeBulletRewrite,
            temperature=0.4
        )
    )
    return ResumeBulletRewrite.model_validate_json(response.text)
