from typing import List, Optional
from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from ..models.inventory import Inventory, InventoryMovement
from ..models.product import Product
from ..models.user import User
from ..schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryMovementCreate, InventoryMovementResponse,
    InventorySummaryResponse, InventoryDashboardResponse
)


def create_inventory_entry(db: Session, inventory: InventoryCreate, user: User) -> InventoryResponse:
    # Validate product exists and belongs to user
    product = db.query(Product).filter(
        Product.id == inventory.product_id,
        Product.user_id == user.id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Calculate unit cost from product cost
    costo_unitario = product.calcular_costo_por_gramo_ajustado()
    costo_total = costo_unitario * inventory.cantidad_producida

    # Create inventory entry
    db_inventory = Inventory(
        user_id=user.id,
        product_id=inventory.product_id,
        fecha_produccion=inventory.fecha_produccion,
        cantidad_producida=inventory.cantidad_producida,
        costo_unitario=costo_unitario,
        costo_total=costo_total,
        stock_actual=inventory.cantidad_producida,  # Initialize with produced quantity
        stock_minimo=inventory.stock_minimo,
        ubicacion=inventory.ubicacion,
        lote=inventory.lote,
        notas=inventory.notas
    )

    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)

    # Load relationships for response
    db_inventory = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.inventory_movements)
    ).filter(Inventory.id == db_inventory.id).first()

    return _build_inventory_response(db_inventory)


def get_inventory(db: Session, inventory_id: int, user: User) -> InventoryResponse:
    inventory = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.inventory_movements)
    ).filter(
        Inventory.id == inventory_id,
        Inventory.user_id == user.id,
        Inventory.is_active == True
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory entry not found"
        )

    return _build_inventory_response(inventory)


def get_inventories(
    db: Session,
    user: User,
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = None,
    lote: Optional[str] = None,
    stock_status: Optional[str] = None
) -> List[InventoryResponse]:
    query = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.inventory_movements)
    ).filter(
        Inventory.user_id == user.id,
        Inventory.is_active == True
    )

    if product_id:
        query = query.filter(Inventory.product_id == product_id)

    if lote:
        query = query.filter(Inventory.lote.ilike(f"%{lote}%"))

    if stock_status:
        if stock_status == 'low':
            query = query.filter(
                Inventory.stock_minimo.isnot(None),
                Inventory.stock_actual <= Inventory.stock_minimo
            )
        elif stock_status == 'ok':
            query = query.filter(
                or_(
                    Inventory.stock_minimo.is_(None),
                    Inventory.stock_actual > Inventory.stock_minimo
                )
            )

    inventories = query.offset(skip).limit(limit).all()

    return [_build_inventory_response(inv) for inv in inventories]


def update_inventory(
    db: Session,
    inventory_id: int,
    inventory_update: InventoryUpdate,
    user: User
) -> InventoryResponse:
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

    # Update fields
    if inventory_update.product_id is not None:
        # Validate new product exists and belongs to user
        product = db.query(Product).filter(
            Product.id == inventory_update.product_id,
            Product.user_id == user.id,
            Product.is_active == True
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        inventory.product_id = inventory_update.product_id

    if inventory_update.fecha_produccion is not None:
        inventory.fecha_produccion = inventory_update.fecha_produccion

    if inventory_update.cantidad_producida is not None:
        inventory.cantidad_producida = inventory_update.cantidad_producida
        # Recalculate costs
        if inventory.product:
            inventory.costo_unitario = inventory.product.calcular_costo_por_gramo_ajustado()
            inventory.costo_total = inventory.costo_unitario * inventory.cantidad_producida

    if inventory_update.stock_minimo is not None:
        inventory.stock_minimo = inventory_update.stock_minimo

    if inventory_update.ubicacion is not None:
        inventory.ubicacion = inventory_update.ubicacion

    if inventory_update.lote is not None:
        inventory.lote = inventory_update.lote

    if inventory_update.notas is not None:
        inventory.notas = inventory_update.notas

    db.commit()
    db.refresh(inventory)

    # Load relationships for response
    inventory = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.inventory_movements)
    ).filter(Inventory.id == inventory_id).first()

    return _build_inventory_response(inventory)


def delete_inventory(db: Session, inventory_id: int, user: User) -> bool:
    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.user_id == user.id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory entry not found"
        )

    # Soft delete
    inventory.is_active = False
    db.commit()

    return True


def register_stock_movement(
    db: Session,
    inventory_id: int,
    movement: InventoryMovementCreate,
    user: User,
    usuario_responsable: str
) -> InventoryMovementResponse:
    # Get inventory entry
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

    stock_anterior = inventory.stock_actual

    # Calculate new stock based on movement type
    if movement.tipo_movimiento == 'entrada':
        stock_posterior = stock_anterior + movement.cantidad
    elif movement.tipo_movimiento == 'salida':
        if stock_anterior < movement.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock for this movement"
            )
        stock_posterior = stock_anterior - movement.cantidad
    elif movement.tipo_movimiento == 'ajuste':
        # For adjustments, cantidad can be positive (increase) or negative (decrease)
        stock_posterior = stock_anterior + movement.cantidad
        if stock_posterior < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock adjustment would result in negative stock"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid movement type"
        )

    # Create movement record
    db_movement = InventoryMovement(
        user_id=user.id,
        inventory_id=inventory_id,
        tipo_movimiento=movement.tipo_movimiento,
        cantidad=movement.cantidad,
        motivo=movement.motivo,
        referencia=movement.referencia,
        stock_anterior=stock_anterior,
        stock_posterior=stock_posterior,
        usuario_responsable=usuario_responsable
    )

    # Update inventory stock
    inventory.stock_actual = stock_posterior

    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)

    return InventoryMovementResponse(
        id=db_movement.id,
        user_id=db_movement.user_id,
        inventory_id=db_movement.inventory_id,
        tipo_movimiento=db_movement.tipo_movimiento,
        cantidad=db_movement.cantidad,
        motivo=db_movement.motivo,
        referencia=db_movement.referencia,
        stock_anterior=db_movement.stock_anterior,
        stock_posterior=db_movement.stock_posterior,
        usuario_responsable=db_movement.usuario_responsable,
        created_at=db_movement.created_at,
        movimiento_display=db_movement.movimiento_display
    )


def get_inventory_movements(
    db: Session,
    inventory_id: int,
    user: User,
    skip: int = 0,
    limit: int = 100
) -> List[InventoryMovementResponse]:
    movements = db.query(InventoryMovement).filter(
        InventoryMovement.inventory_id == inventory_id,
        InventoryMovement.user_id == user.id
    ).order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()

    return [
        InventoryMovementResponse(
            id=movement.id,
            user_id=movement.user_id,
            inventory_id=movement.inventory_id,
            tipo_movimiento=movement.tipo_movimiento,
            cantidad=movement.cantidad,
            motivo=movement.motivo,
            referencia=movement.referencia,
            stock_anterior=movement.stock_anterior,
            stock_posterior=movement.stock_posterior,
            usuario_responsable=movement.usuario_responsable,
            created_at=movement.created_at,
            movimiento_display=movement.movimiento_display
        )
        for movement in movements
    ]


def get_inventory_summary(db: Session, user: User) -> InventoryDashboardResponse:
    # Get total products in inventory
    total_products = db.query(func.count(Inventory.id)).filter(
        Inventory.user_id == user.id,
        Inventory.is_active == True
    ).scalar() or 0

    # Get total inventory value
    total_value_result = db.query(func.sum(Inventory.stock_actual * Inventory.costo_unitario)).filter(
        Inventory.user_id == user.id,
        Inventory.is_active == True
    ).scalar()
    total_inventory_value = total_value_result or Decimal('0')

    # Get low stock count
    low_stock_count = db.query(func.count(Inventory.id)).filter(
        Inventory.user_id == user.id,
        Inventory.is_active == True,
        Inventory.stock_minimo.isnot(None),
        Inventory.stock_actual <= Inventory.stock_minimo
    ).scalar() or 0

    # Get today's production
    today = date.today()
    today_production_result = db.query(func.sum(Inventory.cantidad_producida)).filter(
        Inventory.user_id == user.id,
        Inventory.is_active == True,
        func.date(Inventory.fecha_produccion) == today
    ).scalar()
    today_production = today_production_result or Decimal('0')

    # Get recent movements (last 10)
    recent_movements = db.query(InventoryMovement).filter(
        InventoryMovement.user_id == user.id
    ).order_by(InventoryMovement.created_at.desc()).limit(10).all()

    recent_movements_response = [
        InventoryMovementResponse(
            id=movement.id,
            user_id=movement.user_id,
            inventory_id=movement.inventory_id,
            tipo_movimiento=movement.tipo_movimiento,
            cantidad=movement.cantidad,
            motivo=movement.motivo,
            referencia=movement.referencia,
            stock_anterior=movement.stock_anterior,
            stock_posterior=movement.stock_posterior,
            usuario_responsable=movement.usuario_responsable,
            created_at=movement.created_at,
            movimiento_display=movement.movimiento_display
        )
        for movement in recent_movements
    ]

    return InventoryDashboardResponse(
        total_products=total_products,
        total_inventory_value=total_inventory_value,
        low_stock_count=low_stock_count,
        today_production=today_production,
        recent_movements=recent_movements_response
    )


def get_inventory_by_product(db: Session, product_id: int, user: User) -> List[InventorySummaryResponse]:
    inventories = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.inventory_movements)
    ).filter(
        Inventory.product_id == product_id,
        Inventory.user_id == user.id,
        Inventory.is_active == True
    ).all()

    summaries = []
    for inventory in inventories:
        # Get last movement date
        last_movement = db.query(func.max(InventoryMovement.created_at)).filter(
            InventoryMovement.inventory_id == inventory.id
        ).scalar()

        summaries.append(InventorySummaryResponse(
            id=inventory.id,
            product_id=inventory.product_id,
            product_name=inventory.product.nombre if inventory.product else "Unknown",
            lote=inventory.lote,
            stock_actual=inventory.stock_actual,
            stock_minimo=inventory.stock_minimo,
            fecha_produccion=inventory.fecha_produccion,
            costo_unitario=inventory.costo_unitario,
            stock_status=inventory.stock_status,
            last_movement_date=last_movement
        ))

    return summaries


def check_low_stock(db: Session, user: User) -> List[InventorySummaryResponse]:
    inventories = db.query(Inventory).options(
        joinedload(Inventory.product)
    ).filter(
        Inventory.user_id == user.id,
        Inventory.is_active == True,
        Inventory.stock_minimo.isnot(None),
        Inventory.stock_actual <= Inventory.stock_minimo
    ).all()

    summaries = []
    for inventory in inventories:
        # Get last movement date
        last_movement = db.query(func.max(InventoryMovement.created_at)).filter(
            InventoryMovement.inventory_id == inventory.id
        ).scalar()

        summaries.append(InventorySummaryResponse(
            id=inventory.id,
            product_id=inventory.product_id,
            product_name=inventory.product.nombre if inventory.product else "Unknown",
            lote=inventory.lote,
            stock_actual=inventory.stock_actual,
            stock_minimo=inventory.stock_minimo,
            fecha_produccion=inventory.fecha_produccion,
            costo_unitario=inventory.costo_unitario,
            stock_status=inventory.stock_status,
            last_movement_date=last_movement
        ))

    return summaries


def _build_inventory_response(inventory: Inventory) -> InventoryResponse:
    """Helper function to build InventoryResponse with calculated fields"""
    # Convert SQLAlchemy Product to Pydantic ProductResponse
    product_response = None
    if inventory.product:
        from ..schemas.product import ProductResponse
        product_response = ProductResponse(
            id=inventory.product.id,
            nombre=inventory.product.nombre,
            costo_total=str(inventory.product.calcular_costo_total()),
            costo_etiqueta=str(inventory.product.costo_etiqueta or Decimal('0')),
            costo_envase=str(inventory.product.costo_envase or Decimal('0')),
            costo_caja=str(inventory.product.costo_caja or Decimal('0')),
            costo_transporte=str(inventory.product.costo_transporte),
            costo_mano_obra=str(inventory.product.costo_mano_obra or Decimal('0')),
            costo_energia=str(inventory.product.costo_energia or Decimal('0')),
            costo_depreciacion=str(inventory.product.costo_depreciacion or Decimal('0')),
            costo_mantenimiento=str(inventory.product.costo_mantenimiento or Decimal('0')),
            costo_administrativo=str(inventory.product.costo_administrativo or Decimal('0')),
            costo_comercializacion=str(inventory.product.costo_comercializacion or Decimal('0')),
            costo_financiero=str(inventory.product.costo_financiero or Decimal('0')),
            iva_percentage=inventory.product.iva_percentage or 21.0,
            iva_publico=str(inventory.product.iva_publico),
            iva_mayorista=str(inventory.product.iva_mayorista),
            iva_distribuidor=str(inventory.product.iva_distribuidor),
            margen_publico=inventory.product.margen_publico,
            margen_mayorista=inventory.product.margen_mayorista,
            margen_distribuidor=inventory.product.margen_distribuidor,
            precio_publico=str(inventory.product.precio_publico),
            precio_mayorista=str(inventory.product.precio_mayorista),
            precio_distribuidor=str(inventory.product.precio_distribuidor),
            precio_publico_con_iva=str(inventory.product.precio_publico_con_iva),
            precio_mayorista_con_iva=str(inventory.product.precio_mayorista_con_iva),
            precio_distribuidor_con_iva=str(inventory.product.precio_distribuidor_con_iva),
            peso_ingredientes_base=inventory.product.peso_ingredientes_base,
            peso_final_producido=inventory.product.peso_final_producido,
            peso_empaque=inventory.product.peso_empaque,
            costo_paquete=str(inventory.product.calcular_precios_por_empaque()['costo_paquete']),
            precio_publico_paquete=str(inventory.product.calcular_precios_por_empaque()['precio_publico_paquete']),
            precio_mayorista_paquete=str(inventory.product.calcular_precios_por_empaque()['precio_mayorista_paquete']),
            precio_distribuidor_paquete=str(inventory.product.calcular_precios_por_empaque()['precio_distribuidor_paquete']),
            precio_publico_con_iva_paquete=str(inventory.product.calcular_precios_por_empaque()['precio_publico_con_iva_paquete']),
            precio_mayorista_con_iva_paquete=str(inventory.product.calcular_precios_por_empaque()['precio_mayorista_con_iva_paquete']),
            precio_distribuidor_con_iva_paquete=str(inventory.product.calcular_precios_por_empaque()['precio_distribuidor_con_iva_paquete']),
            costo_por_gramo=str(inventory.product.calcular_costo_por_gramo_ajustado()),
            is_active=inventory.product.is_active,
            created_at=inventory.product.created_at,
            updated_at=inventory.product.updated_at,
            product_materials=[]  # We'll skip this for now to avoid complexity
        )

    # Build movement responses
    movements = []
    for movement in inventory.inventory_movements:
        movements.append(InventoryMovementResponse(
            id=movement.id,
            user_id=movement.user_id,
            inventory_id=movement.inventory_id,
            tipo_movimiento=movement.tipo_movimiento,
            cantidad=movement.cantidad,
            motivo=movement.motivo,
            referencia=movement.referencia,
            stock_anterior=movement.stock_anterior,
            stock_posterior=movement.stock_posterior,
            usuario_responsable=movement.usuario_responsable,
            created_at=movement.created_at,
            movimiento_display=movement.movimiento_display
        ))

    return InventoryResponse(
        id=inventory.id,
        user_id=inventory.user_id,
        product_id=inventory.product_id,
        fecha_produccion=inventory.fecha_produccion,
        cantidad_producida=inventory.cantidad_producida,
        costo_unitario=inventory.costo_unitario,
        costo_total=inventory.costo_total,
        stock_actual=inventory.stock_actual,
        stock_minimo=inventory.stock_minimo,
        ubicacion=inventory.ubicacion,
        lote=inventory.lote,
        notas=inventory.notas,
        is_active=inventory.is_active,
        created_at=inventory.created_at,
        updated_at=inventory.updated_at,
        product=product_response,
        inventory_movements=movements,
        stock_status=inventory.stock_status
    )