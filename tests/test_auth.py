import pytest

def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data

def test_register_duplicate_user(client):
    # First register a user
    client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "testpass123"}
    )
    # Try to register with same username
    response = client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test2@example.com", "password": "testpass123"}
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login(client):
    # First register a user
    client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "testpass123"}
    )
    # Then login
    response = client.post(
        "/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    response = client.post(
        "/auth/login",
        json={"username": "testuser", "password": "wrongpass"}
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]