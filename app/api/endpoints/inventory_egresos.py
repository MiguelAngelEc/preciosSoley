from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date

from ...database import get_db
from ...models.user import User
from ...schemas.inventory_egreso import (
    InventoryEgresoCreate, InventoryEgresoUpdate, InventoryEgresoResponse
)
from ...services.inventory_egreso_service import (
    create_egreso, update_egreso, delete_egreso,
    get_egresos_by_inventory, get_egresos_report
)
from ...api.deps import get_current_user


router = APIRouter(prefix="/api/inventory/egresos", tags=["Inventory Egresos"])


@router.post("/{inventory_id}", response_model=InventoryEgresoResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_egreso(
    inventory_id: int,
    egreso: InventoryEgresoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new inventory egress (sale/shipment)"""
    result = create_egreso(db, inventory_id, egreso, current_user)
    return result.model_dump()


@router.put("/{egreso_id}", response_model=InventoryEgresoResponse)
def update_inventory_egreso(
    egreso_id: int,
    egreso: InventoryEgresoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing inventory egress"""
    result = update_egreso(db, egreso_id, egreso, current_user)
    return result.model_dump()


@router.delete("/{egreso_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_egreso(
    egreso_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an inventory egress and restore stock"""
    delete_egreso(db, egreso_id, current_user)
    return None


@router.get("/inventory/{inventory_id}", response_model=List[InventoryEgresoResponse])
def get_egresos_for_inventory(
    inventory_id: int,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all egresses for a specific inventory entry"""
    results = get_egresos_by_inventory(db, inventory_id, current_user)
    # Apply pagination
    paginated_results = results[skip:skip + limit]
    return [result.model_dump() for result in paginated_results]


@router.get("/report", response_model=List[InventoryEgresoResponse])
def get_egresos_report_endpoint(
    fecha_desde: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    fecha_hasta: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    tipo_cliente: Optional[str] = Query(None, description="Client type filter: 'publico', 'mayorista', 'distribuidor'"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get egress report with optional filters"""
    # Validate tipo_cliente if provided
    if tipo_cliente and tipo_cliente not in ['publico', 'mayorista', 'distribuidor']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tipo_cliente must be one of: 'publico', 'mayorista', 'distribuidor'"
        )

    results = get_egresos_report(db, current_user, fecha_desde, fecha_hasta, tipo_cliente)
    # Apply pagination
    paginated_results = results[skip:skip + limit]
    return [result.model_dump() for result in paginated_results]