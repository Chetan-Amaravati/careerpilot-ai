import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# Setup in-memory SQLite database for test runs
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """
    Creates and drops tables in the SQLite database for each unit test,
    ensuring a pristine database state.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """
    Returns a FastAPI TestClient configured to override the database session
    dependency with the in-memory SQLite session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def normal_user_token_headers(client):
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

@pytest.fixture(scope="function")
def admin_user_token_headers(client, db_session):
    """
    Registers and logs in an admin test user, returning the headers dict.
    """
    client.post(
        "/api/auth/register",
        json={"email": "admin@example.com", "password": "password123", "full_name": "Admin User"}
    )
    from app.models import User
    user = db_session.query(User).filter(User.email == "admin@example.com").first()
    if user:
        user.is_admin = True
        db_session.commit()
        
    login_response = client.post(
        "/api/auth/login",
        data={"username": "admin@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
