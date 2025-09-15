import pytest
from app.schemas.user import UserCreate, UserOut, UserLogin

def test_register_user(client, session):
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    }
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 200
    user = response.json()
    assert user["username"] == "testuser"
    assert user["email"] == "test@example.com"
    assert "id" in user
    assert "role" in user


def test_register_duplicate_user(client, session):
    user_data = {
        "username": "duplicate",
        "email": "duplicate@example.com",
        "password": "pass"
    }
    # Register first time
    client.post("/auth/register", json=user_data)
    # Try again
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]


def test_login_success(client, session):
    # Register first
    user_data = {
        "username": "loginuser",
        "email": "login@example.com",
        "password": "loginpass"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "loginuser",
        "password": "loginpass"
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"


def test_login_wrong_credentials(client, session):
    login_data = {
        "username": "nonexistent",
        "password": "wrongpass"
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]