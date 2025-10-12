import pytest
from unittest.mock import Mock, MagicMock
from fastapi import HTTPException

from app.services.auth_service import (
    create_user,
    authenticate_user,
    get_current_user,
    login_for_access_token,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.utils.security import get_password_hash, verify_password, create_access_token, verify_token


def test_create_user_success(mocker):
    mocker.patch("app.services.auth_service.get_password_hash", return_value="hashed_pass")
    mock_db = Mock()
    mock_query = Mock()
    mock_query.filter.return_value.first.return_value = None
    mock_db.query.return_value = mock_query

    user_create = UserCreate(
        username="testuser",
        email="test@example.com",
        password="password123",
    )

    result = create_user(mock_db, user_create)

    assert isinstance(result, User)
    assert result.username == "testuser"
    assert result.email == "test@example.com"
    assert result.hashed_password == "hashed_pass"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_create_user_username_exists(mocker):
    mock_db = Mock()
    mock_query = Mock()
    mock_existing_user = Mock()
    mock_query.filter.return_value.first.return_value = mock_existing_user
    mock_db.query.return_value = mock_query

    user_create = UserCreate(
        username="existing",
        email="existing@example.com",
        password="password",
    )

    with pytest.raises(HTTPException) as exc_info:
        create_user(mock_db, user_create)

    assert exc_info.value.status_code == 400
    assert "Username already registered" in exc_info.value.detail


def test_authenticate_user_success(mocker):
    mock_verify = mocker.patch("app.services.auth_service.verify_password", return_value=True)
    mock_db = Mock()
    mock_query = Mock()
    mock_user = User(
        id=1,
        username="testuser",
        hashed_password="hashed_pass",
        role="user",
    )
    mock_query.filter.return_value.first.return_value = mock_user
    mock_db.query.return_value = mock_query

    result = authenticate_user(mock_db, "testuser", "password123")

    assert result == mock_user
    mock_db.query.assert_called_once()
    mock_verify.assert_called_once_with(
        "password123", "hashed_pass"
    )


def test_authenticate_user_wrong_username(mocker):
    mock_db = Mock()
    mock_query = Mock()
    mock_query.filter.return_value.first.return_value = None
    mock_db.query.return_value = mock_query

    result = authenticate_user(mock_db, "wronguser", "password")

    assert result is False
    mock_db.query.assert_called_once()


def test_authenticate_user_wrong_password(mocker):
    mock_verify = mocker.patch("app.services.auth_service.verify_password", return_value=False)
    mock_db = Mock()
    mock_query = Mock()
    mock_user = User(username="testuser", hashed_password="wrong_hash")
    mock_query.filter.return_value.first.return_value = mock_user
    mock_db.query.return_value = mock_query

    result = authenticate_user(mock_db, "testuser", "wrongpass")

    assert result is False
    mock_verify.assert_called_once_with(
        "wrongpass", "wrong_hash"
    )


def test_get_current_user_success(mocker):
    mock_token_user = UserOut(id=1, username="testuser", email="test@example.com", role="user")
    mock_verify_token = mocker.patch("app.services.auth_service.verify_token", return_value=mock_token_user)

    mock_db = Mock()
    mock_query = Mock()
    mock_db_user = User(
        id=1,
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        role="user",
    )
    mock_query.filter.return_value.first.return_value = mock_db_user
    mock_db.query.return_value = mock_query

    result = get_current_user("valid_token", mock_db)

    assert result == mock_db_user
    mock_verify_token.assert_called_once_with("valid_token")
    mock_db.query.assert_called_once_with(User)


def test_get_current_user_invalid_token(mocker):
    mock_verify_token = mocker.patch("app.services.auth_service.verify_token", return_value=None)

    mock_db = Mock()

    with pytest.raises(HTTPException) as exc_info:
        get_current_user("invalid_token", mock_db)

    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in exc_info.value.detail
    mock_verify_token.assert_called_once_with("invalid_token")


def test_get_current_user_user_not_found(mocker):
    mock_token_user = UserOut(id=1, username="nonexistent", email="test@example.com", role="user")
    mocker.patch("app.services.auth_service.verify_token", return_value=mock_token_user)

    mock_db = Mock()
    mock_query = Mock()
    mock_query.filter.return_value.first.return_value = None
    mock_db.query.return_value = mock_query

    with pytest.raises(HTTPException) as exc_info:
        get_current_user("token", mock_db)

    assert exc_info.value.status_code == 404
    assert "User not found" in exc_info.value.detail


def test_login_for_access_token_success(mocker):
    mock_user = User(username="testuser")
    mock_auth = mocker.patch("app.services.auth_service.authenticate_user", return_value=mock_user)
    mock_token = mocker.patch("app.services.auth_service.create_access_token", return_value="jwt_token")

    mock_db = Mock()

    result = login_for_access_token(mock_db, "testuser", "password123")

    assert result == {"access_token": "jwt_token", "token_type": "bearer"}
    mock_auth.assert_called_once_with(
        mock_db, "testuser", "password123"
    )


def test_login_for_access_token_failure(mocker):
    mocker.patch("app.services.auth_service.authenticate_user", return_value=False)

    mock_db = Mock()

    with pytest.raises(HTTPException) as exc_info:
        login_for_access_token(mock_db, "testuser", "wrongpass")

    assert exc_info.value.status_code == 401
    assert "Incorrect username or password" in exc_info.value.detail