from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductMaterialCreate, ProductMaterialResponse,
    CostosTotalesResponse
)
from ..services.product_service import (
    create_product, get_product, get_products, update_product, delete_product,
    add_material_to_product, remove_material_from_product, calculate_total_costs
)
# from .deps import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_new_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product with associated materials"""
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
    result = create_product(db, product, user)
    return result.model_dump()


@router.get("/")
def read_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all products for the current user"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []
    results = get_products(db, user, skip, limit)
    return [result.model_dump() for result in results]


@router.get("/costs/total")
def get_total_costs(
    db: Session = Depends(get_db)
):
    """Calculate total costs for all products"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return {"productos": [], "costo_total_general": "0", "total_productos": 0}
    result = calculate_total_costs(db, user)
    return result.model_dump()


@router.get("/{product_id}")
def read_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific product by ID"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    result = get_product(db, product_id, user)
    return result.model_dump()


@router.put("/{product_id}")
def update_existing_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing product"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    result = update_product(db, product_id, product, user)
    return result.model_dump()


@router.delete("/{product_id}")
def delete_existing_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Delete a product (soft delete)"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    delete_product(db, product_id, user)
    return {"message": "Product deleted successfully"}


@router.post("/{product_id}/materials")
def add_material_to_existing_product(
    product_id: int,
    material_data: ProductMaterialCreate,
    db: Session = Depends(get_db)
):
    """Add a material to an existing product"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    result = add_material_to_product(db, product_id, material_data, user)
    return result.model_dump()


@router.delete("/{product_id}/materials/{material_id}")
def remove_material_from_existing_product(
    product_id: int,
    material_id: int,
    db: Session = Depends(get_db)
):
    """Remove a material from a product"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    remove_material_from_product(db, product_id, material_id, user)
    return {"message": "Material removed from product successfully"}