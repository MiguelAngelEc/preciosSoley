from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from app.api.deps import get_current_user
from ..models.user import User
from ..schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate, CantidadQuery, CostosResponse
from ..services.material_service import (
    create_material, get_material, get_materials, update_material, delete_material, calculate_costs
)

router = APIRouter(prefix="/api/materials", tags=["materials"])

@router.post("/", response_model=MaterialResponse)
async def create_material_route(material: MaterialCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Type check to ensure current_user is a User object
        assert isinstance(current_user, User), f"Expected User object, got {type(current_user)}"
        return create_material(db, material, current_user)
    except Exception as e:
        db.rollback()
        # Log the actual error for debugging
        import logging
        logging.error(f"Error creating material: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# Temporary endpoint for testing without auth
@router.post("/test", response_model=MaterialResponse)
def create_material_test(material: MaterialCreate, db: Session = Depends(get_db)):
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    try:
        return create_material(db, material, user)
    except Exception as e:
        db.rollback()
        import logging
        logging.error(f"Error creating material: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/", response_model=List[MaterialResponse])
def read_materials(skip: int = 0, limit: int = Query(default=100, le=100), db: Session = Depends(get_db)):
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []
    return get_materials(db, user, skip, limit)

@router.get("/{material_id}", response_model=MaterialResponse)
async def read_material(material_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_material(db, material_id, current_user)

@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material_route(material_id: int, material_update: MaterialUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return update_material(db, material_id, material_update, current_user)

@router.delete("/{material_id}")
async def delete_material_route(material_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return delete_material(db, material_id, current_user)

@router.post("/{material_id}/costos", response_model=CostosResponse)
async def read_costs(material_id: int, query: CantidadQuery, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return calculate_costs(db, material_id, query, current_user)