from enum import Enum
from decimal import Decimal

from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .base import BaseEntity

class UnidadBase(str, Enum):
    KG = "kg"
    LITROS = "litros"

class Material(BaseEntity):
    __tablename__ = "materials"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nombre = Column(String, nullable=False)
    precio_base = Column(Numeric(10, 2), nullable=False)  # e.g., 3.45 for price per kg/l
    unidad_base = Column(String, default=UnidadBase.KG.value)
    precio_unidad_pequena = Column(Numeric(12, 6), nullable=False)  # e.g., 0.00345 for per gram/ml
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="materials")

    def calcular_precio_cantidad(self, cantidad: Decimal) -> Decimal:
        # Calculate cost for given quantity in grams/ml
        return self.precio_unidad_pequena * cantidad