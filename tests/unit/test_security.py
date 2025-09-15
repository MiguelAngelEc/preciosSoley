import pytest
from datetime import timedelta
from jose import jwt
from passlib.context import CryptContext

from app.config import settings
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
)
from app.schemas.user import UserOut


def test_get_password_hash():
    password = "testpassword"
    hashed = get_password_hash(password)
    assert isinstance(hashed, str)
    assert hashed.startswith("$2b$")


def test_verify_password_correct():
    password = "testpassword"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    password = "testpassword"
    wrong_password = "wrongpassword"
    hashed = get_password_hash(password)
    assert verify_password(wrong_password, hashed) is False


def test_create_access_token():
    data = {"sub": "testuser"}
    token = create_access_token(data)
    assert isinstance(token, str)
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["sub"] == "testuser"
    assert "exp" in payload


def test_verify_token_valid():
    data = {"sub": "testuser"}
    expires_delta = timedelta(minutes=15)
    token = create_access_token(data, expires_delta)
    user = verify_token(token)
    assert user is not None
    assert user.username == "testuser"


def test_verify_token_invalid():
    token = "invalid.token.here"
    user = verify_token(token)
    assert user is None


def test_verify_token_expired():
    data = {"sub": "testuser"}
    expires_delta = timedelta(seconds=-1)  # expired
    token = create_access_token(data, expires_delta)
    user = verify_token(token)
    assert user is None