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
    iva_percentage: float = 21.0
    margen_publico: float
    margen_mayorista: float
    margen_distribuidor: float
    costo_etiqueta: Optional[Decimal] = 0.0
    costo_envase: Optional[Decimal] = 0.0
    costo_caja: Optional[Decimal] = 0.0
    costo_transporte: Decimal
    costo_mano_obra: Optional[Decimal] = 0.0
    costo_energia: Optional[Decimal] = 0.0
    costo_depreciacion: Optional[Decimal] = 0.0
    costo_mantenimiento: Optional[Decimal] = 0.0
    costo_administrativo: Optional[Decimal] = 0.0
    costo_comercializacion: Optional[Decimal] = 0.0
    costo_financiero: Optional[Decimal] = 0.0
    peso_ingredientes_base: Optional[float] = None
    peso_final_producido: Optional[float] = None
    peso_empaque: Optional[float] = None

    @field_validator('iva_percentage', mode='after')
    @classmethod
    def iva_percentage_valid(cls, v):
        if v < 0 or v > 100:
            raise ValueError('IVA percentage must be between 0 and 100')
        return v

    @field_validator('margen_publico', 'margen_mayorista', 'margen_distribuidor', mode='after')
    @classmethod
    def margen_valid(cls, v):
        if v < 0 or v >= 100:
            raise ValueError('Margin percentage must be between 0 and 99.99')
        return v

    @field_validator('costo_etiqueta', 'costo_envase', 'costo_caja', 'costo_transporte', mode='after')
    @classmethod
    def costo_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError('Cost fields must be non-negative')
        return v


class ProductCreate(ProductBase):
    product_materials: List[ProductMaterialCreate] = []


class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    iva_percentage: Optional[float] = None
    margen_publico: Optional[float] = None
    margen_mayorista: Optional[float] = None
    margen_distribuidor: Optional[float] = None
    costo_etiqueta: Optional[Decimal] = None
    costo_envase: Optional[Decimal] = None
    costo_caja: Optional[Decimal] = None
    costo_transporte: Optional[Decimal] = None
    costo_mano_obra: Optional[Decimal] = None
    costo_energia: Optional[Decimal] = None
    costo_depreciacion: Optional[Decimal] = None
    costo_mantenimiento: Optional[Decimal] = None
    costo_administrativo: Optional[Decimal] = None
    costo_comercializacion: Optional[Decimal] = None
    costo_financiero: Optional[Decimal] = None
    peso_ingredientes_base: Optional[float] = None
    peso_final_producido: Optional[float] = None
    peso_empaque: Optional[float] = None
    product_materials: Optional[List[ProductMaterialCreate]] = None


class ProductResponse(BaseModel):
    id: int
    nombre: str
    costo_total: Decimal
    costo_etiqueta: Decimal
    costo_envase: Decimal
    costo_caja: Decimal
    costo_transporte: Decimal
    costo_mano_obra: Decimal
    costo_energia: Decimal
    costo_depreciacion: Decimal
    costo_mantenimiento: Decimal
    costo_administrativo: Decimal
    costo_comercializacion: Decimal
    costo_financiero: Decimal
    iva_percentage: float
    iva_publico: Decimal
    iva_mayorista: Decimal
    iva_distribuidor: Decimal
    margen_publico: float
    margen_mayorista: float
    margen_distribuidor: float
    precio_publico: Decimal
    precio_mayorista: Decimal
    precio_distribuidor: Decimal
    precio_publico_con_iva: Decimal
    precio_mayorista_con_iva: Decimal
    precio_distribuidor_con_iva: Decimal
    peso_ingredientes_base: Optional[float] = None
    peso_final_producido: Optional[float] = None
    peso_empaque: Optional[float] = None
    costo_paquete: Decimal
    precio_publico_paquete: Decimal
    precio_mayorista_paquete: Decimal
    precio_distribuidor_paquete: Decimal
    precio_publico_con_iva_paquete: Decimal
    precio_mayorista_con_iva_paquete: Decimal
    precio_distribuidor_con_iva_paquete: Decimal
    costo_por_gramo: Decimal
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
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