import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    # DATABASE_URL is loaded from environment; we provide a fallback default
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/resume_analyzer")
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    # JWT Auth settings
    JWT_SECRET_KEY: str = Field(default="supersecretjwtkeythatshouldbechangedinproduction12345!")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    
    # Google Gemini settings
    GEMINI_API_KEY: str = Field(default="")

    # CORS settings (comma-separated origins)
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://127.0.0.1:5173")

    # Configuration specifying that settings should be read from the .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate a singleton config object to import across the application
settings = Settings()
