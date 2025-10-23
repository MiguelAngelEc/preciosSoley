from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class InventoryEgresoBase(BaseModel):
    cantidad: Decimal = Field(gt=0, description="Quantity must be greater than zero")
    tipo_cliente: str
    motivo: Optional[str] = None
    referencia: Optional[str] = None
    usuario_responsable: str

    @field_validator('tipo_cliente', mode='after')
    @classmethod
    def tipo_cliente_valid(cls, v):
        valid_types = ['publico', 'mayorista', 'distribuidor']
        if v not in valid_types:
            raise ValueError(f'tipo_cliente must be one of: {", ".join(valid_types)}')
        return v


class InventoryEgresoCreate(InventoryEgresoBase):
    pass


class InventoryEgresoUpdate(BaseModel):
    cantidad: Optional[Decimal] = Field(None, gt=0, description="Quantity must be greater than zero")
    tipo_cliente: Optional[str] = None
    motivo: Optional[str] = None
    referencia: Optional[str] = None
    usuario_responsable: Optional[str] = None

    @field_validator('tipo_cliente', mode='after')
    @classmethod
    def tipo_cliente_valid(cls, v):
        if v is not None:
            valid_types = ['publico', 'mayorista', 'distribuidor']
            if v not in valid_types:
                raise ValueError(f'tipo_cliente must be one of: {", ".join(valid_types)}')
        return v


class InventoryEgresoResponse(BaseModel):
    id: int
    user_id: int
    inventory_id: int
    product_id: int
    cantidad: Decimal
    tipo_cliente: str
    precio_unitario: Decimal
    valor_total: Decimal
    fecha_egreso: datetime
    motivo: Optional[str] = None
    referencia: Optional[str] = None
    usuario_responsable: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    product_nombre: Optional[str] = None
    tipo_cliente_display: str

    class Config:
        from_attributes = True