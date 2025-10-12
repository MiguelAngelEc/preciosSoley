from typing import List
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from sqlalchemy.types import Integer

from ..models.proforma import Proforma, ProformaItem
from ..models.product import Product
from ..models.user import User
from ..schemas.proforma import (
    ProformaCreate, ProformaResponse, ProformaItemResponse,
    ProformaListResponse, ProformaItemCreate
)
from ..services.product_service import _build_product_response


def generate_proforma_number(db: Session, user_id: int) -> str:
    """Generate a unique proforma number for the user"""
    # Get the current year
    year = datetime.utcnow().year

    # Find the maximum existing number for this user this year
    max_number = db.query(
        func.max(func.cast(func.substr(Proforma.numero_proforma, -4), Integer))
    ).filter(
        Proforma.user_id == user_id,
        Proforma.numero_proforma.like(f"PRF-{year}-%")
    ).scalar()

    if max_number is None:
        max_number = 0

    # Generate next number
    next_number = max_number + 1
    return f"PRF-{year}-{next_number:04d}"


def get_price_for_client_type(product: Product, tipo_cliente: str) -> Decimal:
    """Get appropriate price without IVA based on client type"""
    # If product has package weight set, use package prices instead of unit prices
    if product.peso_empaque:
        precios_empaque = product.calcular_precios_por_empaque()
        if tipo_cliente == 'publico':
            return precios_empaque['precio_publico_paquete']
        elif tipo_cliente == 'mayorista':
            return precios_empaque['precio_mayorista_paquete']
        elif tipo_cliente == 'distribuidor':
            return precios_empaque['precio_distribuidor_paquete']
        else:
            return precios_empaque['precio_publico_paquete']
    else:
        # Use unit prices for products without package weight
        if tipo_cliente == 'publico':
            return product.precio_publico
        elif tipo_cliente == 'mayorista':
            return product.precio_mayorista
        elif tipo_cliente == 'distribuidor':
            return product.precio_distribuidor
        else:
            return product.precio_publico


def create_proforma(db: Session, proforma_data: ProformaCreate, user: User) -> ProformaResponse:
    """Create a new proforma with automatic calculations"""

    # Validate that all products exist and belong to user
    product_ids = [item.product_id for item in proforma_data.items]
    products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.user_id == user.id,
        Product.is_active == True
    ).all()

    if len(products) != len(product_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more products not found"
        )

    # Create product lookup for easy access
    product_lookup = {p.id: p for p in products}

    # Auto-generate proforma number
    numero_proforma = generate_proforma_number(db, user.id)

    # Calculate validity date (+15 days)
    fecha_validez = datetime.utcnow() + timedelta(days=15)

    # Create proforma
    proforma = Proforma(
        user_id=user.id,
        numero_proforma=numero_proforma,
        tipo_cliente=proforma_data.tipo_cliente,
        cliente_nombre=proforma_data.cliente_nombre,
        cliente_empresa=proforma_data.cliente_empresa,
        cliente_ruc=proforma_data.cliente_ruc,
        cliente_direccion=proforma_data.cliente_direccion,
        cliente_telefono=proforma_data.cliente_telefono,
        cliente_email=proforma_data.cliente_email,
        fecha_emision=datetime.utcnow(),
        fecha_validez=fecha_validez,
        iva_aplicado=proforma_data.iva_aplicado,
        subtotal=Decimal('0'),
        total_iva=Decimal('0'),
        total_final=Decimal('0')
    )

    db.add(proforma)
    db.flush()  # Get proforma ID

    # Add products and calculate totals
    subtotal = Decimal('0')
    for item_data in proforma_data.items:
        product = product_lookup[item_data.product_id]
        precio_unitario = get_price_for_client_type(product, proforma_data.tipo_cliente)
        subtotal_item = precio_unitario * item_data.cantidad

        proforma_item = ProformaItem(
            proforma_id=proforma.id,
            product_id=item_data.product_id,
            cantidad=item_data.cantidad,
            precio_unitario=precio_unitario,
            subtotal_item=subtotal_item
        )
        db.add(proforma_item)
        subtotal += subtotal_item

    # Calculate IVA and totals
    proforma.subtotal = subtotal
    proforma.total_iva = subtotal * (proforma_data.iva_aplicado / 100)
    proforma.total_final = subtotal + proforma.total_iva

    db.commit()
    db.refresh(proforma)

    # Load relationships for response
    proforma = db.query(Proforma).options(
        joinedload(Proforma.proforma_items).joinedload(ProformaItem.product)
    ).filter(Proforma.id == proforma.id).first()

    return _build_proforma_response(proforma)


def get_proforma(db: Session, proforma_id: int, user: User) -> ProformaResponse:
    """Get a specific proforma by ID"""
    proforma = db.query(Proforma).options(
        joinedload(Proforma.proforma_items).joinedload(ProformaItem.product)
    ).filter(
        Proforma.id == proforma_id,
        Proforma.user_id == user.id
    ).first()

    if not proforma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proforma not found"
        )

    return _build_proforma_response(proforma)


def get_proformas(db: Session, user: User, skip: int = 0, limit: int = 100) -> List[ProformaResponse]:
    """Get all proformas for a user"""
    proformas = db.query(Proforma).options(
        joinedload(Proforma.proforma_items).joinedload(ProformaItem.product)
    ).filter(
        Proforma.user_id == user.id
    ).order_by(Proforma.created_at.desc()).offset(skip).limit(limit).all()

    return [_build_proforma_response(proforma) for proforma in proformas]


def delete_proforma(db: Session, proforma_id: int, user: User) -> bool:
    """Delete a proforma (soft delete by removing it)"""
    proforma = db.query(Proforma).filter(
        Proforma.id == proforma_id,
        Proforma.user_id == user.id
    ).first()

    if not proforma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proforma not found"
        )

    # Delete proforma items first (cascade should handle this, but being explicit)
    db.query(ProformaItem).filter(ProformaItem.proforma_id == proforma_id).delete()

    # Delete proforma
    db.delete(proforma)
    db.commit()

    return True


def _build_proforma_response(proforma: Proforma) -> ProformaResponse:
    """Helper function to build ProformaResponse with calculated data"""
    proforma_items = []
    for item in proforma.proforma_items:
        if item.product:
            proforma_items.append(ProformaItemResponse(
                id=item.id,
                proforma_id=item.proforma_id,
                product_id=item.product_id,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal_item=item.subtotal_item,
                product=_build_product_response(item.product)
            ))

    return ProformaResponse(
        id=proforma.id,
        numero_proforma=proforma.numero_proforma,
        tipo_cliente=proforma.tipo_cliente,
        cliente_nombre=proforma.cliente_nombre,
        cliente_empresa=proforma.cliente_empresa,
        cliente_ruc=proforma.cliente_ruc,
        cliente_direccion=proforma.cliente_direccion,
        cliente_telefono=proforma.cliente_telefono,
        cliente_email=proforma.cliente_email,
        fecha_emision=proforma.fecha_emision,
        fecha_validez=proforma.fecha_validez,
        iva_aplicado=proforma.iva_aplicado,
        subtotal=proforma.subtotal,
        total_iva=proforma.total_iva,
        total_final=proforma.total_final,
        proforma_items=proforma_items
    )