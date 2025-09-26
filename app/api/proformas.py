from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.proforma import (
    ProformaCreate, ProformaResponse, ProformaListResponse
)
from ..services.proforma_service import (
    create_proforma, get_proforma, get_proformas, delete_proforma
)

router = APIRouter(prefix="/api/proformas", tags=["proformas"])


@router.post("/", response_model=ProformaResponse, status_code=status.HTTP_201_CREATED)
def create_new_proforma(
    proforma: ProformaCreate,
    db: Session = Depends(get_db)
):
    """Create a new proforma"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        # Create a test user if none exists
        from sqlalchemy import Column, String, Enum as SQLEnum
        from ..models.user import Role
        from ..utils.security import get_password_hash

        test_user = User(
            username="test",
            email="test@test.com",
            hashed_password=get_password_hash("test"),
            role=Role.USER
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        user = test_user

    result = create_proforma(db, proforma, user)
    return result.model_dump()


@router.get("/")
def read_proformas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all proformas for the current user"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return {"proformas": [], "total_count": 0}

    results = get_proformas(db, user, skip, limit)
    return {
        "proformas": [result.model_dump() for result in results],
        "total_count": len(results)
    }


@router.get("/{proforma_id}")
def read_proforma(
    proforma_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific proforma by ID"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    result = get_proforma(db, proforma_id, user)
    return result.model_dump()


@router.delete("/{proforma_id}")
def delete_existing_proforma(
    proforma_id: int,
    db: Session = Depends(get_db)
):
    """Delete a proforma"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    delete_proforma(db, proforma_id, user)
    return {"message": "Proforma deleted successfully"}