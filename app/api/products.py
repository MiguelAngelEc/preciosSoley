from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_current_user


from ..database import get_db
from ..models.user import User
from ..models.product import Product, ProductMaterial
from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductMaterialCreate, ProductMaterialResponse,
    CostosTotalesResponse
)
from ..services.product_service import (
    create_product, get_product, get_products, update_product, delete_product,
    add_material_to_product, remove_material_from_product, calculate_total_costs,
    duplicate_product
)
from ..utils.unit_converter import calculate_cost_for_quantity
# from .deps import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_new_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product with associated materials"""
    result = create_product(db, product, current_user)
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


@router.get("/{product_id}/cost-calculator")
def calculate_cost_by_unit(
    product_id: int,
    quantity: float,
    unit: str,
    db: Session = Depends(get_db)
):
    """Calculate cost for specific quantity and unit"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    # Get the SQLAlchemy Product model, not the response
    product = db.query(Product).options(
        joinedload(Product.product_materials).joinedload(ProductMaterial.material)
    ).filter(
        Product.id == product_id,
        Product.user_id == user.id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get adjusted cost per gram
    cost_per_gram = product.calcular_costo_por_gramo_ajustado()

    # Calculate cost for the specified quantity and unit
    total_cost = calculate_cost_for_quantity(cost_per_gram, quantity, unit)

    # Calculate prices with margins and IVA
    costo_total = product.calcular_costo_total()
    precio_publico = product.precio_publico
    precio_mayorista = product.precio_mayorista
    precio_distribuidor = product.precio_distribuidor
    iva_publico = product.iva_publico
    iva_mayorista = product.iva_mayorista
    iva_distribuidor = product.iva_distribuidor

    return {
        "product_id": product_id,
        "quantity": quantity,
        "unit": unit,
        "cost_per_gram_adjusted": str(cost_per_gram),
        "total_cost": str(total_cost),
        "precio_publico": str(precio_publico),
        "precio_mayorista": str(precio_mayorista),
        "precio_distribuidor": str(precio_distribuidor),
        "iva_publico": str(iva_publico),
        "iva_mayorista": str(iva_mayorista),
        "iva_distribuidor": str(iva_distribuidor),
        "precio_publico_con_iva": str(product.precio_publico_con_iva),
        "precio_mayorista_con_iva": str(product.precio_mayorista_con_iva),
        "precio_distribuidor_con_iva": str(product.precio_distribuidor_con_iva)
    }


@router.post("/{product_id}/duplicate")
def duplicate_product_endpoint(
    product_id: int,
    duplicate_data: dict,  # {nombre: str, peso_empaque: float}
    db: Session = Depends(get_db)
):
    """Duplicate existing product with new package weight"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    result = duplicate_product(
        db,
        product_id,
        duplicate_data["nombre"],
        duplicate_data["peso_empaque"],
        user
    )
    return result.model_dump()