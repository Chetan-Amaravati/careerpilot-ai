from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator
from app.core.config import settings

# Create the SQLAlchemy Engine
# Note: create_engine is the core entry point for database connections.
# It establishes the connection pool and dialect rules.
engine = create_engine(
    settings.DATABASE_URL,
    # pool_pre_ping checks connection health before executing statements, preventing stale connection errors
    pool_pre_ping=True
)

# SessionLocal is a factory class that will generate DB sessions upon request.
# autoflush=False prevents automatic flush of modifications to DB before queries are executed.
# autocommit=False ensures transactions are explicitly committed.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for defining all database model classes
Base = declarative_base()

def get_db() -> Generator:
    """
    Dependency generator for acquiring database sessions.
    Guarantees session cleanup after the request lifecycle completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
