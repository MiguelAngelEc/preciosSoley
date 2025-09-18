from typing import List
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.material import Material
from ..models.user import User
from ..schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse, CantidadQuery, CostosResponse
from ..utils.calculator import calcular_precio_unidad_pequena

def create_material(db: Session, material: MaterialCreate, user: User) -> MaterialResponse:
    # Validate uniqueness per user (only check active materials)
    existing = db.query(Material).filter(Material.nombre == material.nombre, Material.user_id == user.id, Material.is_active == True).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Material name already exists for this user")
    
    precio_unidad_pequena = calcular_precio_unidad_pequena(material.precio_base, material.unidad_base)
    
    db_material = Material(
        user_id=user.id,
        nombre=material.nombre,
        precio_base=material.precio_base,
        unidad_base=material.unidad_base,
        precio_unidad_pequena=precio_unidad_pequena
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

def get_material(db: Session, material_id: int, user: User) -> MaterialResponse:
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == user.id, Material.is_active == True).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return material

def get_materials(db: Session, user: User, skip: int = 0, limit: int = 100) -> List[Material]:
    return db.query(Material).filter(Material.user_id == user.id, Material.is_active == True).offset(skip).limit(limit).all()

def update_material(db: Session, material_id: int, material_update: MaterialUpdate, user: User) -> MaterialResponse:
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == user.id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    if material_update.nombre is not None:
        material.nombre = material_update.nombre
    if material_update.precio_base is not None:
        material.precio_base = material_update.precio_base
        material.precio_unidad_pequena = calcular_precio_unidad_pequena(material_update.precio_base, material.unidad_base)
    if material_update.unidad_base is not None:
        material.unidad_base = material_update.unidad_base
        material.precio_unidad_pequena = calcular_precio_unidad_pequena(material.precio_base, material_update.unidad_base)
    
    db.commit()
    db.refresh(material)
    return material

def delete_material(db: Session, material_id: int, user: User) -> bool:
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == user.id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    db.delete(material)
    db.commit()
    return True

def calculate_costs(db: Session, material_id: int, query: CantidadQuery, user: User) -> CostosResponse:
    material = get_material(db, material_id, user)
    costos = {}
    for cantidad in query.cantidades:
        costos[str(cantidad)] = material.calcular_precio_cantidad(cantidad)
    return CostosResponse(material=material, costos=costos)