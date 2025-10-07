from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate, CantidadQuery, CostosResponse
from ..services.material_service import (
    create_material, get_material, get_materials, update_material, delete_material, calculate_costs
)

router = APIRouter(prefix="/api/materials", tags=["materials"])

@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_material_route(material: MaterialCreate, db: Session = Depends(get_db)):
    """Create a new material"""
    # For testing, get the first user or create one
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

    try:
        result = create_material(db, material, user)
        return jsonable_encoder(result)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/", response_model=List[MaterialResponse])
def read_materials(skip: int = 0, limit: int = Query(default=100, le=100), db: Session = Depends(get_db)):
    """Get all materials for the current user"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []
    results = get_materials(db, user, skip, limit)
    return jsonable_encoder(results)

@router.get("/{material_id}", response_model=MaterialResponse)
def read_material(material_id: int, db: Session = Depends(get_db)):
    """Get a specific material by ID"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    result = get_material(db, material_id, user)
    return jsonable_encoder(result)

@router.put("/{material_id}", response_model=MaterialResponse)
def update_material_route(material_id: int, material_update: MaterialUpdate, db: Session = Depends(get_db)):
    """Update an existing material"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    result = update_material(db, material_id, material_update, user)
    return jsonable_encoder(result)

@router.delete("/{material_id}")
def delete_material_route(material_id: int, db: Session = Depends(get_db)):
    """Delete a material (soft delete)"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    delete_material(db, material_id, user)
    return {"message": "Material deleted successfully"}

@router.post("/{material_id}/costos", response_model=CostosResponse)
def read_costs(material_id: int, query: CantidadQuery, db: Session = Depends(get_db)):
    """Calculate costs for specific quantities"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    result = calculate_costs(db, material_id, query, user)
    return jsonable_encoder(result)