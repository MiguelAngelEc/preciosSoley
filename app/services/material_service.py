from typing import List
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import exists, select

from ..models.material import Material
from ..models.user import User
from ..models.product import ProductMaterial, Product
from ..models.audit_log import AuditLog
from ..schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse, CantidadQuery, CostosResponse
from ..utils.calculator import calcular_precio_unidad_pequena

def _validate_material_uniqueness(db: Session, nombre: str, user_id: int, exclude_id: int = None) -> None:
    """
    Validate that a material name is unique for the user among active materials.
    """
    query = db.query(Material).filter(
        Material.nombre == nombre,
        Material.user_id == user_id,
        Material.is_active == True
    )
    if exclude_id:
        query = query.filter(Material.id != exclude_id)

    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Material name already exists for this user"
        )


def _create_audit_log(db: Session, user_id: int, material_id: int, action: str, description: str) -> None:
    """
    Create an audit log entry for material operations.
    """
    audit_log = AuditLog(
        user_id=user_id,
        material_id=material_id,
        action=action,
        description=description
    )
    db.add(audit_log)


def create_material(db: Session, material: MaterialCreate, user: User) -> MaterialResponse:
    """
    Create a new material with validation and audit logging.
    """
    # Validate uniqueness
    _validate_material_uniqueness(db, material.nombre, user.id)

    # Calculate derived price
    precio_unidad_pequena = calcular_precio_unidad_pequena(material.precio_base, material.unidad_base)

    # Create material
    db_material = Material(
        user_id=user.id,
        nombre=material.nombre,
        precio_base=material.precio_base,
        unidad_base=material.unidad_base,
        precio_unidad_pequena=precio_unidad_pequena
    )
    db.add(db_material)

    # Create audit log
    _create_audit_log(
        db, user.id, None, "create_material",
        f"Created material '{material.nombre}' with price {material.precio_base}"
    )

    db.commit()
    db.refresh(db_material)

    # Update audit log with material ID
    db.query(AuditLog).filter(
        AuditLog.user_id == user.id,
        AuditLog.material_id.is_(None),
        AuditLog.action == "create_material"
    ).update({"material_id": db_material.id})

    db.commit()
    return db_material

def get_material(db: Session, material_id: int, user: User) -> MaterialResponse:
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == user.id, Material.is_active == True).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return material

def get_materials(db: Session, user: User, skip: int = 0, limit: int = 100) -> List[Material]:
    return db.query(Material).filter(Material.user_id == user.id, Material.is_active == True).offset(skip).limit(limit).all()

def update_material(db: Session, material_id: int, material_update: MaterialUpdate, user: User) -> MaterialResponse:
    """
    Update an existing material with validation and audit logging.
    """
    # Get material for update
    material = db.query(Material).with_for_update().filter(
        Material.id == material_id,
        Material.user_id == user.id,
        Material.is_active == True
    ).first()

    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    # Validate uniqueness if name is being changed
    if material_update.nombre is not None and material_update.nombre != material.nombre:
        _validate_material_uniqueness(db, material_update.nombre, user.id, material_id)

    # Apply updates
    updated_fields = []
    if material_update.nombre is not None:
        material.nombre = material_update.nombre
        updated_fields.append("nombre")

    if material_update.precio_base is not None:
        material.precio_base = material_update.precio_base
        material.precio_unidad_pequena = calcular_precio_unidad_pequena(
            material_update.precio_base, material.unidad_base
        )
        updated_fields.append("precio_base")

    if material_update.unidad_base is not None:
        material.unidad_base = material_update.unidad_base
        material.precio_unidad_pequena = calcular_precio_unidad_pequena(
            material.precio_base, material_update.unidad_base
        )
        updated_fields.append("unidad_base")

    # Update version
    material.version += 1

    # Create audit log
    _create_audit_log(
        db, user.id, material.id, "update_material",
        f"Updated material '{material.nombre}' - fields: {', '.join(updated_fields)}"
    )

    db.commit()
    db.refresh(material)
    return material

def _check_material_usage_in_active_products(db: Session, material_id: int, user: User) -> bool:
    """
    Check if a material is being used in any active products.
    Uses an efficient EXISTS query instead of loading full objects.
    """
    # Create a subquery for the EXISTS clause
    subquery = select(ProductMaterial).join(Product).where(
        ProductMaterial.material_id == material_id,
        Product.user_id == user.id,
        Product.is_active == True
    )

    # Use exists() with the subquery
    return db.query(exists(subquery)).scalar()


def _soft_delete_material(db: Session, material: Material, user: User) -> None:
    """
    Perform soft delete on a material with audit logging.
    """
    # Soft delete
    material.is_active = False
    material.deleted_at = datetime.utcnow()
    material.version += 1

    # Audit log
    audit_log = AuditLog(
        user_id=user.id,
        material_id=material.id,
        action="delete_material",
        description=f"Soft deleted material '{material.nombre}'"
    )
    db.add(audit_log)


def delete_material(db: Session, material_id: int, user: User) -> bool:
    """
    Delete a material with proper validation and audit logging.

    Steps:
    1. Check if material exists and belongs to user
    2. Verify material is not used in active products
    3. Perform soft delete with audit trail
    """
    # Step 1: Get material for update (without complex joins)
    material = db.query(Material).with_for_update().filter(
        Material.id == material_id,
        Material.user_id == user.id,
        Material.is_active == True
    ).first()

    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    # Step 2: Check usage in active products (efficient query)
    if _check_material_usage_in_active_products(db, material_id, user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete material that is used in active products"
        )

    # Step 3: Perform soft delete
    _soft_delete_material(db, material, user)

    db.commit()
    return True

def calculate_costs(db: Session, material_id: int, query: CantidadQuery, user: User) -> CostosResponse:
    material = get_material(db, material_id, user)
    costos = {}
    for cantidad in query.cantidades:
        costos[str(cantidad)] = material.calcular_precio_cantidad(cantidad)
    return CostosResponse(material=material, costos=costos)