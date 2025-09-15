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
def create_material_route(material: MaterialCreate, current_user: User = Depends(get_current_user_dependency), db: Session = Depends(get_db)):
    return create_material(db, material, current_user)

@router.get("/", response_model=List[MaterialResponse])
def read_materials(skip: int = 0, limit: int = Query(default=100, le=100), current_user: User = Depends(get_current_user_dependency), db: Session = Depends(get_db)):
    return get_materials(db, current_user, skip, limit)

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