from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_

from ..models.inventory import Inventory
from ..models.product import Product
from ..models.inventory_egreso import InventoryEgreso
from ..models.user import User
from ..schemas.inventory_egreso import (
    InventoryEgresoCreate, InventoryEgresoUpdate, InventoryEgresoResponse
)


def _get_precio_by_tipo_cliente(product: Product, tipo_cliente: str) -> Decimal:
    """Helper function to get price based on client type"""
    price_mapping = {
        'publico': product.precio_publico_con_iva,
        'mayorista': product.precio_mayorista_con_iva,
        'distribuidor': product.precio_distribuidor_con_iva
    }

    precio = price_mapping.get(tipo_cliente)
    if precio is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tipo_cliente: {tipo_cliente}"
        )

    return precio


def create_egreso(db: Session, inventory_id: int, egreso_data: InventoryEgresoCreate, user: User) -> InventoryEgresoResponse:
    """Create a new inventory egress (sale/shipment)"""
    # Validate inventory exists and belongs to user
    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.user_id == user.id,
        Inventory.is_active == True
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory entry not found"
        )

    # Validate sufficient stock
    if inventory.stock_actual < egreso_data.cantidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {inventory.stock_actual}, Requested: {egreso_data.cantidad}"
        )

    # Get associated product
    product = db.query(Product).filter(
        Product.id == inventory.product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated product not found"
        )

    # Get price based on client type
    precio_unitario = _get_precio_by_tipo_cliente(product, egreso_data.tipo_cliente)
    valor_total = precio_unitario * egreso_data.cantidad

    # Create egress record
    db_egreso = InventoryEgreso(
        user_id=user.id,
        inventory_id=inventory_id,
        product_id=product.id,
        cantidad=egreso_data.cantidad,
        tipo_cliente=egreso_data.tipo_cliente,
        precio_unitario=precio_unitario,
        valor_total=valor_total,
        motivo=egreso_data.motivo,
        referencia=egreso_data.referencia,
        usuario_responsable=egreso_data.usuario_responsable
    )

    # Update inventory stock
    inventory.stock_actual -= egreso_data.cantidad

    # Commit both operations
    db.add(db_egreso)
    db.commit()
    db.refresh(db_egreso)

    # Load relationships for response
    db_egreso = db.query(InventoryEgreso).options(
        joinedload(InventoryEgreso.product)
    ).filter(InventoryEgreso.id == db_egreso.id).first()

    return _build_egreso_response(db_egreso)


def update_egreso(db: Session, egreso_id: int, egreso_data: InventoryEgresoUpdate, user: User) -> InventoryEgresoResponse:
    """Update an existing inventory egress"""
    # Get egress record
    egreso = db.query(InventoryEgreso).filter(
        InventoryEgreso.id == egreso_id,
        InventoryEgreso.user_id == user.id
    ).first()

    if not egreso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Egreso not found"
        )

    # Get associated inventory
    inventory = db.query(Inventory).filter(
        Inventory.id == egreso.inventory_id,
        Inventory.is_active == True
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated inventory not found"
        )

    # Get associated product
    product = db.query(Product).filter(
        Product.id == egreso.product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated product not found"
        )

    # Handle quantity changes
    cantidad_diff = Decimal('0')
    if egreso_data.cantidad is not None and egreso_data.cantidad != egreso.cantidad:
        cantidad_diff = egreso_data.cantidad - egreso.cantidad

        # If increasing quantity, check stock availability
        if cantidad_diff > 0 and inventory.stock_actual < cantidad_diff:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for quantity increase. Available: {inventory.stock_actual}, Needed: {cantidad_diff}"
            )

        # Update inventory stock
        inventory.stock_actual -= cantidad_diff
        egreso.cantidad = egreso_data.cantidad

    # Handle client type changes
    if egreso_data.tipo_cliente is not None and egreso_data.tipo_cliente != egreso.tipo_cliente:
        egreso.tipo_cliente = egreso_data.tipo_cliente
        # Recalculate price
        precio_unitario = _get_precio_by_tipo_cliente(product, egreso.tipo_cliente)
        egreso.precio_unitario = precio_unitario
        egreso.valor_total = precio_unitario * egreso.cantidad

    # Update other fields
    if egreso_data.motivo is not None:
        egreso.motivo = egreso_data.motivo
    if egreso_data.referencia is not None:
        egreso.referencia = egreso_data.referencia
    if egreso_data.usuario_responsable is not None:
        egreso.usuario_responsable = egreso_data.usuario_responsable

    # Update timestamp
    egreso.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(egreso)

    # Load relationships for response
    egreso = db.query(InventoryEgreso).options(
        joinedload(InventoryEgreso.product)
    ).filter(InventoryEgreso.id == egreso.id).first()

    return _build_egreso_response(egreso)


def delete_egreso(db: Session, egreso_id: int, user: User) -> bool:
    """Delete an inventory egress and restore stock"""
    # Get egress record
    egreso = db.query(InventoryEgreso).filter(
        InventoryEgreso.id == egreso_id,
        InventoryEgreso.user_id == user.id
    ).first()

    if not egreso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Egreso not found"
        )

    # Get associated inventory
    inventory = db.query(Inventory).filter(
        Inventory.id == egreso.inventory_id,
        Inventory.is_active == True
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated inventory not found"
        )

    # Restore stock
    inventory.stock_actual += egreso.cantidad

    # Delete egress record
    db.delete(egreso)
    db.commit()

    return True


def get_egresos_by_inventory(db: Session, inventory_id: int, user: User) -> List[InventoryEgresoResponse]:
    """Get all egresses for a specific inventory"""
    # Validate inventory belongs to user
    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.user_id == user.id,
        Inventory.is_active == True
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory entry not found"
        )

    # Get egresses with product info
    egresos = db.query(InventoryEgreso).options(
        joinedload(InventoryEgreso.product)
    ).filter(
        InventoryEgreso.inventory_id == inventory_id,
        InventoryEgreso.user_id == user.id
    ).order_by(InventoryEgreso.fecha_egreso.desc()).all()

    return [_build_egreso_response(egreso) for egreso in egresos]


def get_egresos_report(
    db: Session,
    user: User,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    tipo_cliente: Optional[str] = None
) -> List[InventoryEgresoResponse]:
    """Get egress report with optional filters"""
    query = db.query(InventoryEgreso).options(
        joinedload(InventoryEgreso.product),
        joinedload(InventoryEgreso.inventory)
    ).filter(InventoryEgreso.user_id == user.id)

    # Apply date filters
    if fecha_desde:
        query = query.filter(func.date(InventoryEgreso.fecha_egreso) >= fecha_desde)
    if fecha_hasta:
        query = query.filter(func.date(InventoryEgreso.fecha_egreso) <= fecha_hasta)

    # Apply client type filter
    if tipo_cliente:
        query = query.filter(InventoryEgreso.tipo_cliente == tipo_cliente)

    # Order by date descending
    egresos = query.order_by(InventoryEgreso.fecha_egreso.desc()).all()

    return [_build_egreso_response(egreso) for egreso in egresos]


def _build_egreso_response(egreso: InventoryEgreso) -> InventoryEgresoResponse:
    """Helper function to build InventoryEgresoResponse"""
    return InventoryEgresoResponse(
        id=egreso.id,
        user_id=egreso.user_id,
        inventory_id=egreso.inventory_id,
        product_id=egreso.product_id,
        cantidad=egreso.cantidad,
        tipo_cliente=egreso.tipo_cliente,
        precio_unitario=egreso.precio_unitario,
        valor_total=egreso.valor_total,
        fecha_egreso=egreso.fecha_egreso,
        motivo=egreso.motivo,
        referencia=egreso.referencia,
        usuario_responsable=egreso.usuario_responsable,
        created_at=egreso.created_at,
        updated_at=egreso.updated_at,
        product_nombre=egreso.product.nombre if egreso.product else None,
        tipo_cliente_display=egreso.tipo_cliente_display
    )