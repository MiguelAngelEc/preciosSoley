from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator

from .product import ProductResponse


class InventoryMovementBase(BaseModel):
    tipo_movimiento: str
    cantidad: Decimal
    motivo: str
    referencia: Optional[str] = None

    @field_validator('tipo_movimiento', mode='after')
    @classmethod
    def tipo_movimiento_valid(cls, v):
        if v not in ['entrada', 'salida', 'ajuste']:
            raise ValueError('tipo_movimiento must be entrada, salida, or ajuste')
        return v

    @field_validator('cantidad', mode='after')
    @classmethod
    def cantidad_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('cantidad must be positive')
        return v


class InventoryMovementCreate(InventoryMovementBase):
    pass


class InventoryMovementUpdate(BaseModel):
    tipo_movimiento: Optional[str] = None
    cantidad: Optional[Decimal] = None
    motivo: Optional[str] = None
    referencia: Optional[str] = None

    @field_validator('tipo_movimiento', mode='after')
    @classmethod
    def tipo_movimiento_valid(cls, v):
        if v is not None and v not in ['entrada', 'salida', 'ajuste']:
            raise ValueError('tipo_movimiento must be entrada, salida, or ajuste')
        return v

    @field_validator('cantidad', mode='after')
    @classmethod
    def cantidad_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('cantidad must be positive')
        return v


class InventoryMovementResponse(BaseModel):
    id: int
    user_id: int
    inventory_id: int
    tipo_movimiento: str
    cantidad: Decimal
    motivo: str
    referencia: Optional[str] = None
    stock_anterior: Decimal
    stock_posterior: Decimal
    usuario_responsable: str
    created_at: datetime
    movimiento_display: str

    class Config:
        from_attributes = True


class InventoryBase(BaseModel):
    product_id: int
    fecha_produccion: datetime
    cantidad_producida: Decimal
    costo_unitario: Optional[Decimal] = None  # Calculated by backend
    costo_total: Optional[Decimal] = None     # Calculated by backend
    stock_minimo: Optional[Decimal] = None
    ubicacion: Optional[str] = None
    lote: Optional[str] = None
    notas: Optional[str] = None

    @field_validator('cantidad_producida', mode='after')
    @classmethod
    def cantidad_producida_positive(cls, v):
        if v <= 0:
            raise ValueError('cantidad_producida must be positive')
        return v

    @field_validator('costo_unitario', mode='after')
    @classmethod
    def costo_unitario_non_negative(cls, v):
        if v < 0:
            raise ValueError('costo_unitario must be non-negative')
        return v

    @field_validator('costo_total', mode='after')
    @classmethod
    def costo_total_non_negative(cls, v):
        if v < 0:
            raise ValueError('costo_total must be non-negative')
        return v

    @field_validator('stock_minimo', mode='after')
    @classmethod
    def stock_minimo_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('stock_minimo must be non-negative')
        return v


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    product_id: Optional[int] = None
    fecha_produccion: Optional[datetime] = None
    cantidad_producida: Optional[Decimal] = None
    costo_unitario: Optional[Decimal] = None
    costo_total: Optional[Decimal] = None
    stock_minimo: Optional[Decimal] = None
    ubicacion: Optional[str] = None
    lote: Optional[str] = None
    notas: Optional[str] = None

    @field_validator('cantidad_producida', mode='after')
    @classmethod
    def cantidad_producida_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('cantidad_producida must be positive')
        return v

    @field_validator('costo_unitario', mode='after')
    @classmethod
    def costo_unitario_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('costo_unitario must be non-negative')
        return v

    @field_validator('costo_total', mode='after')
    @classmethod
    def costo_total_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('costo_total must be non-negative')
        return v

    @field_validator('stock_minimo', mode='after')
    @classmethod
    def stock_minimo_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('stock_minimo must be non-negative')
        return v


class InventoryResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    fecha_produccion: datetime
    cantidad_producida: Decimal
    costo_unitario: Decimal
    costo_total: Decimal
    stock_actual: Decimal
    stock_minimo: Optional[Decimal] = None
    ubicacion: Optional[str] = None
    lote: Optional[str] = None
    notas: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    product: Optional[ProductResponse] = None
    inventory_movements: List[InventoryMovementResponse] = []
    stock_status: str

    class Config:
        from_attributes = True


class InventorySummaryResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    lote: Optional[str] = None
    stock_actual: Decimal
    stock_minimo: Optional[Decimal] = None
    fecha_produccion: datetime
    costo_unitario: Decimal
    stock_status: str
    last_movement_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryDashboardResponse(BaseModel):
    total_products: int
    low_stock_count: int
    today_production: Decimal
    today_egresos: Decimal
    today_egresos_value: Decimal

    class Config:
        from_attributes = True