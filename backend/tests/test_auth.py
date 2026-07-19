def test_register_user(client):
    """Test successful user registration."""
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "password" not in data

def test_register_duplicate_email(client):
    """Test registration failure on duplicate email addresses."""
    # Register first user
    client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password123", "full_name": "User One"}
    )
    # Register duplicate user
    response = client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password456", "full_name": "User Two"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "A user with this email address already exists."

def test_login_success(client):
    """Test successful login with form-data credentials."""
    client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "mypassword", "full_name": "Login User"}
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "login@example.com", "password": "mypassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_incorrect_password(client):
    """Test login failure with wrong password."""
    client.post(
        "/api/auth/register",
        json={"email": "wrongpass@example.com", "password": "correctpassword"}
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "wrongpass@example.com", "password": "incorrectpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_get_current_user_me(client):
    """Test retrieval of currently authenticated user profile."""
    client.post(
        "/api/auth/register",
        json={"email": "me@example.com", "password": "password123", "full_name": "Me User"}
    )
    login_response = client.post(
        "/api/auth/login",
        data={"username": "me@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["full_name"] == "Me User"

def test_get_me_unauthorized(client):
    """Test that unauthorized requests to /me fail with 401 status."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
