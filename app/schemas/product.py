from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator

from .material import MaterialResponse


class ProductMaterialBase(BaseModel):
    material_id: int
    cantidad: Decimal

    @field_validator('cantidad', mode='after')
    @classmethod
    def cantidad_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('cantidad must be positive')
        return v


class ProductMaterialCreate(ProductMaterialBase):
    pass


class ProductMaterialUpdate(BaseModel):
    material_id: Optional[int] = None
    cantidad: Optional[Decimal] = None

    @field_validator('cantidad', mode='after')
    @classmethod
    def cantidad_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('cantidad must be positive')
        return v


class ProductMaterialResponse(BaseModel):
    id: int
    product_id: int
    material_id: int
    cantidad: Decimal
    costo: Decimal
    material: Optional[MaterialResponse] = None

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    nombre: str


class ProductCreate(ProductBase):
    product_materials: List[ProductMaterialCreate] = []


class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    product_materials: Optional[List[ProductMaterialCreate]] = None


class ProductResponse(BaseModel):
    id: int
    nombre: str
    costo_total: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
    product_materials: List[ProductMaterialResponse] = []

    class Config:
        from_attributes = True


class ProductSummaryResponse(BaseModel):
    id: int
    nombre: str
    costo_total: Decimal
    materiales_count: int

    class Config:
        from_attributes = True


class CostosTotalesResponse(BaseModel):
    productos: List[ProductSummaryResponse]
    costo_total_general: Decimal
    total_productos: int