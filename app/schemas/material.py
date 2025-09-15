from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, field_validator

from .user import Role

from enum import Enum

class UnidadBase(str, Enum):
    KG = "kg"
    LITROS = "litros"

class MaterialBase(BaseModel):
    nombre: str
    precio_base: Decimal
    unidad_base: UnidadBase = UnidadBase.KG
    cantidades_deseadas: Optional[List[Decimal]] = None

class MaterialCreate(MaterialBase):
    @field_validator('precio_base', mode='after')
    @classmethod
    def precio_base_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('precio_base must be positive')
        return v

class MaterialUpdate(BaseModel):
    nombre: Optional[str] = None
    precio_base: Optional[Decimal] = None
    unidad_base: Optional[UnidadBase] = None

    @field_validator('precio_base', mode='after')
    @classmethod
    def precio_base_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('precio_base must be positive')
        return v

class MaterialResponse(BaseModel):
    id: int
    nombre: str
    precio_base: Decimal
    unidad_base: str
    precio_unidad_pequena: Decimal
    is_active: bool

    class Config:
        from_attributes = True

class CostosResponse(BaseModel):
    material: MaterialResponse
    costos: dict[str, Decimal]

class CantidadQuery(BaseModel):
    cantidades: List[Decimal]