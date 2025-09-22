from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .base import BaseEntity


class Product(BaseEntity):
    __tablename__ = "products"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nombre = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="products")
    product_materials = relationship("ProductMaterial", back_populates="product", cascade="all, delete-orphan")

    def calcular_costo_total(self) -> Decimal:
        """Calculate total cost of all materials in this product"""
        total = Decimal('0')
        for pm in self.product_materials:
            if pm.material and pm.material.is_active:
                total += pm.material.calcular_precio_cantidad(pm.cantidad)
        return total


class ProductMaterial(BaseEntity):
    __tablename__ = "product_materials"

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    cantidad = Column(Numeric(10, 2), nullable=False)  # quantity in grams/ml
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="product_materials")
    material = relationship("Material", back_populates="product_materials")

    def calcular_costo(self) -> Decimal:
        """Calculate cost for this material in the product"""
        if self.material and self.material.is_active:
            return self.material.calcular_precio_cantidad(self.cantidad)
        return Decimal('0')