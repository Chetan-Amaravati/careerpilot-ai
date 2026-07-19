from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.api.router import api_router

app = FastAPI(
    title="AI Resume Analyzer & Skill Gap Assessment API",
    description="Backend services for analyzing resumes, parsing skill gaps, and generating assessment modules.",
    version="1.0.0"
)

# Configure CORS (Cross-Origin Resource Sharing)
# Since the frontend will run on a different port/host (e.g., http://localhost:5173),
# CORS middleware permits the frontend application to execute requests to our API.
origins = [
    "http://localhost:5173",  # Default Vite local development port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Resume Analyzer & Skill Gap Assessment API!"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Service health check endpoint verifying connection status to database.
    """
    try:
        # Execute a simple raw SQL query to verify connection status
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
