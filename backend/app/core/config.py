import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # DATABASE_URL is loaded from environment; we provide a fallback default
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/resume_analyzer")
    
    # JWT Auth settings
    JWT_SECRET_KEY: str = Field(default="supersecretjwtkeythatshouldbechangedinproduction12345!")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    
    # Google Gemini settings
    GEMINI_API_KEY: str = Field(default="")

    # Configuration specifying that settings should be read from the .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate a singleton config object to import across the application
settings = Settings()
