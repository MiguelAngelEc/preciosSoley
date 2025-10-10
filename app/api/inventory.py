from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryMovementCreate, InventoryMovementResponse,
    InventorySummaryResponse, InventoryDashboardResponse
)
from ..services.inventory_service import (
    create_inventory_entry, get_inventory, get_inventories, update_inventory, delete_inventory,
    register_stock_movement, get_inventory_movements, get_inventory_summary,
    get_inventory_by_product, check_low_stock
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.post("/", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_new_inventory_entry(
    inventory: InventoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new inventory entry (production record)"""
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

    result = create_inventory_entry(db, inventory, user)
    return result.model_dump()


@router.get("/", response_model=List[InventoryResponse])
def read_inventories(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    lote: Optional[str] = Query(None, description="Filter by batch/lot number"),
    stock_status: Optional[str] = Query(None, description="Filter by stock status: 'low' or 'ok'"),
    db: Session = Depends(get_db)
):
    """Get all inventory entries for the current user with optional filters"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []

    results = get_inventories(db, user, skip, limit, product_id, lote, stock_status)
    return [result.model_dump() for result in results]


@router.get("/summary", response_model=InventoryDashboardResponse)
def get_inventory_dashboard_summary(
    db: Session = Depends(get_db)
):
    """Get inventory dashboard summary with key metrics"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return {
            "total_products": 0,
            "total_inventory_value": "0",
            "low_stock_count": 0,
            "today_production": "0",
            "recent_movements": []
        }

    result = get_inventory_summary(db, user)
    return result.model_dump()


@router.get("/low-stock", response_model=List[InventorySummaryResponse])
def get_low_stock_alerts(
    db: Session = Depends(get_db)
):
    """Get inventory entries with low stock alerts"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []

    results = check_low_stock(db, user)
    return [result.model_dump() for result in results]


@router.get("/by-product/{product_id}", response_model=List[InventorySummaryResponse])
def get_inventory_for_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get all inventory entries for a specific product"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []

    results = get_inventory_by_product(db, product_id, user)
    return [result.model_dump() for result in results]


@router.get("/{inventory_id}", response_model=InventoryResponse)
def read_inventory(
    inventory_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific inventory entry by ID"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    result = get_inventory(db, inventory_id, user)
    return result.model_dump()


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_existing_inventory(
    inventory_id: int,
    inventory: InventoryUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing inventory entry"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    result = update_inventory(db, inventory_id, inventory, user)
    return result.model_dump()


@router.delete("/{inventory_id}")
def delete_existing_inventory(
    inventory_id: int,
    db: Session = Depends(get_db)
):
    """Delete an inventory entry (soft delete)"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    delete_inventory(db, inventory_id, user)
    return {"message": "Inventory entry deleted successfully"}


@router.post("/{inventory_id}/movements", response_model=InventoryMovementResponse)
def create_stock_movement(
    inventory_id: int,
    movement: InventoryMovementCreate,
    usuario_responsable: str = Query(..., description="User responsible for the movement"),
    db: Session = Depends(get_db)
):
    """Register a stock movement (entrada, salida, ajuste)"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    result = register_stock_movement(db, inventory_id, movement, user, usuario_responsable)
    return result.model_dump()


@router.get("/{inventory_id}/movements", response_model=List[InventoryMovementResponse])
def read_inventory_movements(
    inventory_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get movement history for a specific inventory entry"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []

    results = get_inventory_movements(db, inventory_id, user, skip, limit)
    return [result.model_dump() for result in results]


@router.get("/report/daily", response_model=List[InventoryResponse])
def get_daily_production_report(
    fecha: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """Get daily production report"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []

    # Parse date or use today
    from datetime import datetime, date
    if fecha:
        try:
            target_date = datetime.fromisoformat(fecha).date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        target_date = date.today()

    # Filter inventories by production date
    results = get_inventories(db, user)
    filtered_results = [
        result for result in results
        if result.fecha_produccion.date() == target_date
    ]

    return [result.model_dump() for result in filtered_results]


@router.get("/report/period", response_model=List[InventoryResponse])
def get_period_report(
    fecha_inicio: str = Query(..., description="Start date in YYYY-MM-DD format"),
    fecha_fin: str = Query(..., description="End date in YYYY-MM-DD format"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    db: Session = Depends(get_db)
):
    """Get inventory report for a date period"""
    # For testing, get the first user
    user = db.query(User).first()
    if not user:
        return []

    # Parse dates
    from datetime import datetime
    try:
        start_date = datetime.fromisoformat(fecha_inicio).date()
        end_date = datetime.fromisoformat(fecha_fin).date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    # Get inventories and filter by date range
    results = get_inventories(db, user, product_id=product_id)
    filtered_results = [
        result for result in results
        if start_date <= result.fecha_produccion.date() <= end_date
    ]

    return [result.model_dump() for result in filtered_results]