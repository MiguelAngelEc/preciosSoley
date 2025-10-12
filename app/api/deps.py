from typing import Optional
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.auth_service import get_current_user as get_user_from_token
from ..models.user import User

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    # Extract token from credentials
    token = credentials.credentials

    # Log token type and obfuscated value for debugging
    logging.debug(f"Token type: {type(token)}")
    logging.debug(f"Token value (first 10 chars): {token[:10] if isinstance(token, str) else 'Not a string'}...")

    # Call the synchronous auth service function
    user = get_user_from_token(token, db)

    # Type check to ensure we have a User object
    assert isinstance(user, User), f"Expected User object, got {type(user)}"

    # Log user type for debugging
    logging.debug(f"User type: {type(user)}")
    logging.debug(f"User value: {user}")

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user