from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import User


from ..api.deps import get_current_user
from ..database import get_db
from ..schemas.user import UserCreate, UserOut, UserLogin
from ..services.auth_service import create_user, login_for_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db=db, user=user)

@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    return login_for_access_token(db, user_login.username, user_login.password)

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
