import pytest
from fastapi.testclient import TestClient

def test_get_and_update_profile(client: TestClient, normal_user_token_headers):
    # Get initial profile
    response = client.get("/api/profile/", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    
    # Update profile
    update_data = {
        "full_name": "Updated Name",
        "experience_level": "Senior",
        "preferred_roles": ["Backend Developer", "DevOps Engineer"],
        "career_goals": {"target_salary": "120k"}
    }
    response = client.put("/api/profile/", json=update_data, headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["experience_level"] == "Senior"
    assert "DevOps Engineer" in data["preferred_roles"]


def test_learning_progress(client: TestClient, normal_user_token_headers):
    # Add learning milestone
    item_data = {
        "item_type": "Course",
        "item_title": "FastAPI Masterclass",
        "item_link": "https://example.com/fastapi",
        "weekly_goal": True
    }
    response = client.post("/api/learning/items", json=item_data, headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["item_title"] == "FastAPI Masterclass"
    assert data["status"] == "Pending"
    item_id = data["id"]
    
    # Update item status
    response = client.put(f"/api/learning/items/{item_id}", json={"status": "Completed"}, headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Completed"
    assert data["completed_at"] is not None

    # Get progress history
    response = client.get("/api/learning/progress", headers=normal_user_token_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # Get stats
    response = client.get("/api/learning/stats", headers=normal_user_token_headers)
    assert response.status_code == 200
    stats = response.json()
    assert stats["completed_items"] >= 1


def test_notifications_flow(client: TestClient, normal_user_token_headers):
    # Trigger smart reminders to populate notifications
    response = client.post("/api/notifications/trigger-reminders", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    # Get notifications
    response = client.get("/api/notifications/", headers=normal_user_token_headers)
    assert response.status_code == 200
    notifs = response.json()
    assert len(notifs) >= 1
    notif_id = notifs[0]["id"]
    
    # Mark notification as read
    response = client.put(f"/api/notifications/{notif_id}/read", headers=normal_user_token_headers)
    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_admin_restrictions(client: TestClient, normal_user_token_headers):
    # Normal user should be forbidden from admin endpoints
    response = client.get("/api/admin/stats", headers=normal_user_token_headers)
    assert response.status_code == 403
