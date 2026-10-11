from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, engine, Base
import app.models  # Ensure models are loaded for table creation
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create tables if they do not exist on startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database table creation on startup skipped or failed: {e}")
    yield

app = FastAPI(
    title="AI Resume Analyzer & Skill Gap Assessment API",
    description="Backend services for analyzing resumes, parsing skill gaps, and generating assessment modules.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS (Cross-Origin Resource Sharing)
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router under /api prefix and also at root level as a fallback
app.include_router(api_router, prefix="/api")
app.include_router(api_router)


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
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

