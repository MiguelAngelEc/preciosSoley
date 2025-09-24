from typing import List
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..models.product import Product, ProductMaterial
from ..models.material import Material
from ..models.user import User
from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductMaterialCreate, ProductMaterialResponse,
    ProductSummaryResponse, CostosTotalesResponse
)
from ..schemas.material import MaterialResponse


def create_product(db: Session, product: ProductCreate, user: User) -> ProductResponse:
    # Validate product name
    if not product.nombre or not product.nombre.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name cannot be empty"
        )

    # Validate uniqueness per user
    existing = db.query(Product).filter(
        Product.nombre == product.nombre.strip(),
        Product.user_id == user.id,
        Product.is_active == True
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name already exists for this user"
        )

    # Validate that at least one material is provided
    # if not product.product_materials:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Product must have at least one material"
    #     )

    # Create product
    db_product = Product(
        user_id=user.id,
        nombre=product.nombre,
        iva_percentage=product.iva_percentage,
        margen_publico=product.margen_publico,
        margen_mayorista=product.margen_mayorista,
        margen_distribuidor=product.margen_distribuidor,
        costo_etiqueta=product.costo_etiqueta,
        costo_envase=product.costo_envase,
        costo_caja=product.costo_caja,
        costo_transporte=product.costo_transporte
    )
    db.add(db_product)
    db.flush()  # Get the product ID

    # Add materials to product
    if product.product_materials:
        for pm_data in product.product_materials:
            # Validate material exists and belongs to user
            material = db.query(Material).filter(
                Material.id == pm_data.material_id,
                Material.user_id == user.id,
                Material.is_active == True
            ).first()
            if not material:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Material with id {pm_data.material_id} not found"
                )

            # Check for duplicate materials in the same product
            existing_pm = db.query(ProductMaterial).filter(
                ProductMaterial.product_id == db_product.id,
                ProductMaterial.material_id == pm_data.material_id
            ).first()
            if existing_pm:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Material {material.nombre} is already added to this product"
                )

            db_pm = ProductMaterial(
                product_id=db_product.id,
                material_id=pm_data.material_id,
                cantidad=pm_data.cantidad
            )
            db.add(db_pm)

    db.commit()
    db.refresh(db_product)

    # Load relationships for response
    db_product = db.query(Product).options(
        joinedload(Product.product_materials).joinedload(ProductMaterial.material)
    ).filter(Product.id == db_product.id).first()

    return _build_product_response(db_product)


def get_product(db: Session, product_id: int, user: User) -> ProductResponse:
    product = db.query(Product).options(
        joinedload(Product.product_materials).joinedload(ProductMaterial.material)
    ).filter(
        Product.id == product_id,
        Product.user_id == user.id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return _build_product_response(product)


def get_products(db: Session, user: User, skip: int = 0, limit: int = 100) -> List[ProductResponse]:
    products = db.query(Product).options(
        joinedload(Product.product_materials).joinedload(ProductMaterial.material)
    ).filter(
        Product.user_id == user.id,
        Product.is_active == True
    ).offset(skip).limit(limit).all()

    return [_build_product_response(product) for product in products]


def update_product(db: Session, product_id: int, product_update: ProductUpdate, user: User) -> ProductResponse:
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == user.id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    if product_update.nombre is not None:
        # Check uniqueness if name is being changed
        if product_update.nombre != product.nombre:
            existing = db.query(Product).filter(
                Product.nombre == product_update.nombre,
                Product.user_id == user.id,
                Product.is_active == True,
                Product.id != product_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Product name already exists for this user"
                )
        product.nombre = product_update.nombre

    if product_update.iva_percentage is not None:
        product.iva_percentage = product_update.iva_percentage

    if product_update.margen_publico is not None:
        product.margen_publico = product_update.margen_publico

    if product_update.margen_mayorista is not None:
        product.margen_mayorista = product_update.margen_mayorista

    if product_update.margen_distribuidor is not None:
        product.margen_distribuidor = product_update.margen_distribuidor

    if product_update.costo_etiqueta is not None:
        product.costo_etiqueta = product_update.costo_etiqueta

    if product_update.costo_envase is not None:
        product.costo_envase = product_update.costo_envase

    if product_update.costo_caja is not None:
        product.costo_caja = product_update.costo_caja

    if product_update.costo_transporte is not None:
        product.costo_transporte = product_update.costo_transporte

    # Update materials if provided
    if product_update.product_materials is not None:
        # Remove existing materials
        db.query(ProductMaterial).filter(ProductMaterial.product_id == product_id).delete()

        # Add new materials
        for pm_data in product_update.product_materials:
            # Validate material exists and belongs to user
            material = db.query(Material).filter(
                Material.id == pm_data.material_id,
                Material.user_id == user.id,
                Material.is_active == True
            ).first()
            if not material:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Material with id {pm_data.material_id} not found"
                )

            # Check for duplicate materials in the same product
            existing_pm = db.query(ProductMaterial).filter(
                ProductMaterial.product_id == product_id,
                ProductMaterial.material_id == pm_data.material_id
            ).first()
            if existing_pm:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Material {material.nombre} is already added to this product"
                )

            db_pm = ProductMaterial(
                product_id=product_id,
                material_id=pm_data.material_id,
                cantidad=pm_data.cantidad
            )
            db.add(db_pm)

    db.commit()
    db.refresh(product)

    # Load relationships for response
    product = db.query(Product).options(
        joinedload(Product.product_materials).joinedload(ProductMaterial.material)
    ).filter(Product.id == product_id).first()

    return _build_product_response(product)


def delete_product(db: Session, product_id: int, user: User) -> bool:
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == user.id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Soft delete by setting is_active to False
    product.is_active = False
    db.commit()

    return True


def add_material_to_product(db: Session, product_id: int, material_data: ProductMaterialCreate, user: User) -> ProductMaterialResponse:
    # Validate product exists and belongs to user
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == user.id,
        Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Validate material exists and belongs to user
    material = db.query(Material).filter(
        Material.id == material_data.material_id,
        Material.user_id == user.id,
        Material.is_active == True
    ).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with id {material_data.material_id} not found"
        )

    # Check for duplicate materials in the same product
    existing_pm = db.query(ProductMaterial).filter(
        ProductMaterial.product_id == product_id,
        ProductMaterial.material_id == material_data.material_id
    ).first()
    if existing_pm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Material {material.nombre} is already added to this product"
        )

    db_pm = ProductMaterial(
        product_id=product_id,
        material_id=material_data.material_id,
        cantidad=material_data.cantidad
    )
    db.add(db_pm)
    db.commit()
    db.refresh(db_pm)

    # Load material for response
    db_pm = db.query(ProductMaterial).options(
        joinedload(ProductMaterial.material)
    ).filter(ProductMaterial.id == db_pm.id).first()

    return ProductMaterialResponse(
        id=db_pm.id,
        product_id=db_pm.product_id,
        material_id=db_pm.material_id,
        cantidad=db_pm.cantidad,
        costo=db_pm.calcular_costo(),
        material=db_pm.material
    )


def remove_material_from_product(db: Session, product_id: int, material_id: int, user: User) -> bool:
    # Validate product exists and belongs to user
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == user.id,
        Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Find and delete the product material
    pm = db.query(ProductMaterial).filter(
        ProductMaterial.product_id == product_id,
        ProductMaterial.material_id == material_id
    ).first()

    if not pm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found in this product"
        )

    db.delete(pm)
    db.commit()

    return True


def calculate_total_costs(db: Session, user: User) -> CostosTotalesResponse:
    products = db.query(Product).options(
        joinedload(Product.product_materials).joinedload(ProductMaterial.material)
    ).filter(
        Product.user_id == user.id,
        Product.is_active == True
    ).all()

    product_summaries = []
    total_general = Decimal('0')

    for product in products:
        costo_total = product.calcular_costo_total()
        total_general += costo_total

        product_summaries.append(ProductSummaryResponse(
            id=product.id,
            nombre=product.nombre,
            costo_total=costo_total,
            materiales_count=len(product.product_materials)
        ))

    return CostosTotalesResponse(
        productos=product_summaries,
        costo_total_general=total_general,
        total_productos=len(product_summaries)
    )


def _build_product_response(product: Product) -> ProductResponse:
    """Helper function to build ProductResponse with calculated costs"""
    product_materials = []
    for pm in product.product_materials:
        if pm.material and pm.material.is_active:
            # Convert SQLAlchemy material to Pydantic MaterialResponse
            material_response = MaterialResponse(
                id=pm.material.id,
                nombre=pm.material.nombre,
                precio_base=pm.material.precio_base,
                unidad_base=pm.material.unidad_base,
                precio_unidad_pequena=pm.material.precio_unidad_pequena,
                is_active=pm.material.is_active
            )

            product_materials.append(ProductMaterialResponse(
                id=pm.id,
                product_id=pm.product_id,
                material_id=pm.material_id,
                cantidad=pm.cantidad,
                costo=pm.calcular_costo(),
                material=material_response
            ))

    return ProductResponse(
        id=product.id,
        nombre=product.nombre,
        costo_total=product.calcular_costo_total(),
        costo_etiqueta=product.costo_etiqueta or Decimal('0'),
        costo_envase=product.costo_envase or Decimal('0'),
        costo_caja=product.costo_caja or Decimal('0'),
        costo_transporte=product.costo_transporte,
        iva_percentage=product.iva_percentage or 21.0,
        iva_publico=product.iva_publico,
        iva_mayorista=product.iva_mayorista,
        iva_distribuidor=product.iva_distribuidor,
        margen_publico=product.margen_publico,
        margen_mayorista=product.margen_mayorista,
        margen_distribuidor=product.margen_distribuidor,
        precio_publico=product.precio_publico,
        precio_mayorista=product.precio_mayorista,
        precio_distribuidor=product.precio_distribuidor,
        precio_publico_con_iva=product.precio_publico_con_iva,
        precio_mayorista_con_iva=product.precio_mayorista_con_iva,
        precio_distribuidor_con_iva=product.precio_distribuidor_con_iva,
        is_active=product.is_active,
        created_at=product.created_at,
        updated_at=product.updated_at,
        product_materials=product_materials
    )