from unittest.mock import MagicMock, patch
import pytest
from app.services.gemini_service import (
    ParsedResume, 
    ExperienceItem, 
    EducationItem, 
    SkillGapAnalysis, 
    Recommendations, 
    QuizAssessment, 
    QuizQuestion
)
from app.models import Resume, JobDescription, AnalysisResult, Assessment, Question

@pytest.fixture
def auth_header(client):
    """
    Registers and logs in a test user to return a Bearer authorization token header.
    """
    client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "password123", "full_name": "Auth User"}
    )
    login_response = client.post(
        "/api/auth/login",
        data={"username": "user@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@patch("app.api.endpoints.resumes.extract_text_from_pdf_bytes")
@patch("app.api.endpoints.resumes.parse_resume")
def test_upload_resume(mock_parse, mock_extract, client, auth_header):
    """Test uploading a resume PDF and storing parsed metadata from Gemini."""
    mock_extract.return_value = "Python Developer raw resume text."
    mock_parse.return_value = ParsedResume(
        skills=["Python", "FastAPI", "SQLAlchemy"],
        experience=[ExperienceItem(job_title="Dev", company="Google")],
        education=[EducationItem(degree="BS CS", institution="MIT")]
    )
    
    file_payload = {"file": ("resume.pdf", b"%PDF-1.4...", "application/pdf")}
    
    # Mock built-in open to prevent writing dummy file to host filesystem
    with patch("builtins.open", MagicMock()):
        response = client.post(
            "/api/resumes/upload",
            headers=auth_header,
            files=file_payload
        )
        
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "resume.pdf"
    assert data["parsed_skills"] == ["Python", "FastAPI", "SQLAlchemy"]


def test_analyze_skill_gap_endpoint(client, db_session, auth_header):
    """Test skill gap match analysis comparison between resume and job description."""
    # 1. Create a dummy resume directly in the database
    from app.models import User
    user = db_session.query(User).filter(User.email == "user@example.com").first()
    db_resume = Resume(
        user_id=user.id,
        filename="resume.pdf",
        file_path="/path/to/resume.pdf",
        raw_text="Extracted text",
        parsed_skills=["Python", "FastAPI"]
    )
    db_session.add(db_resume)
    db_session.commit()
    db_session.refresh(db_resume)
    
    # 2. Mock the analyze_skill_gap service call
    mock_gap_result = SkillGapAnalysis(
        matching_score=75.0,
        matched_skills=["Python"],
        missing_skills=["Docker", "Kubernetes"],
        recommendations=Recommendations(
            learning_path=["Learn Docker basics", "Learn K8s deployment"],
            certifications=["Certified Kubernetes Administrator"],
            project_ideas=["Deploy a microservices app to minikube"]
        )
    )
    
    with patch("app.api.endpoints.analysis.analyze_skill_gap", return_value=mock_gap_result):
        response = client.post(
            "/api/analysis/match",
            headers=auth_header,
            json={
                "resume_id": db_resume.id,
                "job_description_text": "We need a Python developer who knows Docker and Kubernetes.",
                "job_title": "Backend Engineer"
            }
        )
        
    assert response.status_code == 201
    data = response.json()
    assert data["matching_score"] == 75.0
    assert data["matched_skills"] == ["Python"]
    assert data["missing_skills"] == ["Docker", "Kubernetes"]
    assert "learning_path" in data["recommendations"]


@patch("app.api.endpoints.assessments.generate_quiz")
def test_generate_assessment_endpoint(mock_gen_quiz, client, db_session, auth_header):
    """Test generating a quiz assessment based on analysis missing skills."""
    from app.models import User, Resume, JobDescription, AnalysisResult
    user = db_session.query(User).filter(User.email == "user@example.com").first()
    
    db_resume = Resume(user_id=user.id, filename="resume.pdf", file_path="path", raw_text="text", parsed_skills=["Python"])
    db_session.add(db_resume)
    db_session.commit()
    
    db_jd = JobDescription(title="Dev", raw_text="text", parsed_skills=["Python"])
    db_session.add(db_jd)
    db_session.commit()
    
    db_analysis = AnalysisResult(
        resume_id=db_resume.id,
        job_description_id=db_jd.id,
        matching_score=80.0,
        matched_skills=["Python"],
        missing_skills=["Docker"],
        recommendations={"learning_path": ["Docker"]}
    )
    db_session.add(db_analysis)
    db_session.commit()
    db_session.refresh(db_analysis)
    
    # Mock Quiz Generation response from Gemini
    mock_quiz = QuizAssessment(
        title="Docker Basics Quiz",
        questions=[
            QuizQuestion(
                question_text="What is a Dockerfile?",
                options=["A text file", "A script", "A database", "An image"],
                correct_answer="A text file",
                explanation="A Dockerfile contains all instructions to build an image."
            )
        ]
    )
    mock_gen_quiz.return_value = mock_quiz
    
    response = client.post(
        f"/api/assessments/generate/{db_analysis.id}",
        headers=auth_header
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Docker Basics Quiz"
    assert len(data["questions"]) == 1
    assert data["questions"][0]["question_text"] == "What is a Dockerfile?"
    # Make sure correct_answer and explanation are NOT leaked in response
    assert "correct_answer" not in data["questions"][0]
    assert "explanation" not in data["questions"][0]


def test_submit_assessment_attempt(client, db_session, auth_header):
    """Test submitting assessment answers and grading the score."""
    from app.models import User, Resume, JobDescription, AnalysisResult, Assessment, Question
    user = db_session.query(User).filter(User.email == "user@example.com").first()
    
    db_resume = Resume(user_id=user.id, filename="resume.pdf", file_path="path", raw_text="text")
    db_session.add(db_resume)
    db_session.commit()
    
    db_jd = JobDescription(title="Dev", raw_text="text")
    db_session.add(db_jd)
    db_session.commit()
    
    db_analysis = AnalysisResult(
        resume_id=db_resume.id,
        job_description_id=db_jd.id,
        matching_score=80.0,
        matched_skills=[],
        missing_skills=[],
        recommendations={}
    )
    db_session.add(db_analysis)
    db_session.commit()
    
    db_assessment = Assessment(analysis_result_id=db_analysis.id, title="Docker Quiz")
    db_session.add(db_assessment)
    db_session.commit()
    db_session.refresh(db_assessment)
    
    db_q = Question(
        assessment_id=db_assessment.id,
        question_text="What is Docker?",
        options=["Platform", "Fruit", "Game", "Car"],
        correct_answer="Platform",
        explanation="Docker is a platform for containers."
    )
    db_session.add(db_q)
    db_session.commit()
    db_session.refresh(db_q)
    
    # Submit correct answer
    response = client.post(
        f"/api/assessments/{db_assessment.id}/submit",
        headers=auth_header,
        json={
            "answers": [
                {"question_id": db_q.id, "selected_option": "Platform"}
            ]
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 100.0
    assert data["answers"] == {str(db_q.id): "Platform"}
