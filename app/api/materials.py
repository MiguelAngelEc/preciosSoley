from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..api.deps import get_current_user_dependency
from ..models.user import User
from ..schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate, CantidadQuery, CostosResponse
from ..services.material_service import (
    create_material, get_material, get_materials, update_material, delete_material, calculate_costs
)

router = APIRouter(prefix="/api/materials", tags=["materials"])

@router.post("/", response_model=MaterialResponse)
def create_material_route(material: MaterialCreate, db: Session = Depends(get_db)):
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
    return create_material(db, material, user)

@router.get("/", response_model=List[MaterialResponse])
def read_materials(skip: int = 0, limit: int = Query(default=100, le=100), db: Session = Depends(get_db)):
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []
    return get_materials(db, user, skip, limit)

@router.get("/{material_id}", response_model=MaterialResponse)
def read_material(material_id: int, current_user: User = Depends(get_current_user_dependency), db: Session = Depends(get_db)):
    return get_material(db, material_id, current_user)

@router.put("/{material_id}", response_model=MaterialResponse)
def update_material_route(material_id: int, material_update: MaterialUpdate, current_user: User = Depends(get_current_user_dependency), db: Session = Depends(get_db)):
    return update_material(db, material_id, material_update, current_user)

@router.delete("/{material_id}")
def delete_material_route(material_id: int, current_user: User = Depends(get_current_user_dependency), db: Session = Depends(get_db)):
    return delete_material(db, material_id, current_user)

@router.post("/{material_id}/costos", response_model=CostosResponse)
def read_costs(material_id: int, query: CantidadQuery, current_user: User = Depends(get_current_user_dependency), db: Session = Depends(get_db)):
    return calculate_costs(db, material_id, query, current_user)