from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator


class ProformaItemBase(BaseModel):
    product_id: int
    cantidad: int

    @field_validator('cantidad', mode='after')
    @classmethod
    def cantidad_positive(cls, v):
        if v <= 0:
            raise ValueError('cantidad must be positive')
        return v


class ProformaItemCreate(ProformaItemBase):
    pass


class ProformaItemResponse(BaseModel):
    id: int
    proforma_id: int
    product_id: int
    cantidad: int
    precio_unitario: Decimal
    subtotal_item: Decimal
    product: Optional['ProductResponse'] = None

    class Config:
        from_attributes = True


class ProformaBase(BaseModel):
    tipo_cliente: str  # 'publico', 'mayorista', 'distribuidor'
    cliente_nombre: str
    cliente_empresa: Optional[str] = None
    cliente_ruc: Optional[str] = None
    cliente_direccion: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cliente_email: Optional[str] = None
    iva_aplicado: Decimal = Decimal('12.0')  # Default IVA for Ecuador
    items: List[ProformaItemCreate]

    @field_validator('tipo_cliente', mode='after')
    @classmethod
    def tipo_cliente_valid(cls, v):
        valid_types = ['publico', 'mayorista', 'distribuidor']
        if v not in valid_types:
            raise ValueError(f'tipo_cliente must be one of: {valid_types}')
        return v

    @field_validator('iva_aplicado', mode='after')
    @classmethod
    def iva_aplicado_valid(cls, v):
        if v < 0 or v > 100:
            raise ValueError('iva_aplicado must be between 0 and 100')
        return v


class ProformaCreate(ProformaBase):
    pass


class ProformaResponse(BaseModel):
    id: int
    numero_proforma: str
    tipo_cliente: str
    cliente_nombre: str
    cliente_empresa: Optional[str] = None
    cliente_ruc: Optional[str] = None
    cliente_direccion: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cliente_email: Optional[str] = None
    fecha_emision: datetime
    fecha_validez: datetime
    iva_aplicado: Decimal
    subtotal: Decimal
    total_iva: Decimal
    total_final: Decimal
    proforma_items: List[ProformaItemResponse] = []

    class Config:
        from_attributes = True


class ProformaListResponse(BaseModel):
    proformas: List[ProformaResponse]
    total_count: int


# Forward reference for Product
from .product import ProductResponse

# Rebuild the model to resolve forward references
ProformaItemResponse.model_rebuild()