from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property

from .base import BaseEntity
from ..config import settings


class Product(BaseEntity):
    __tablename__ = "products"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nombre = Column(String, nullable=False)
    iva_percentage = Column(Numeric(5, 2), nullable=True, default=21.0)  # IVA percentage for calculation
    margen_publico = Column(Numeric(5, 2), nullable=False)  # Profit margin for retail sales
    margen_mayorista = Column(Numeric(5, 2), nullable=False)  # Profit margin for wholesale sales
    margen_distribuidor = Column(Numeric(5, 2), nullable=False)  # Profit margin for distributor sales
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

    @hybrid_property
    def iva_publico(self) -> Decimal:
        """Calculate IVA amount for retail price"""
        precio = self.precio_publico
        iva_pct = self.iva_percentage or 21.0  # Default to 21% if None
        return precio * Decimal(iva_pct / 100)

    @hybrid_property
    def iva_mayorista(self) -> Decimal:
        """Calculate IVA amount for wholesale price"""
        precio = self.precio_mayorista
        iva_pct = self.iva_percentage or 21.0  # Default to 21% if None
        return precio * Decimal(iva_pct / 100)

    @hybrid_property
    def iva_distribuidor(self) -> Decimal:
        """Calculate IVA amount for distributor price"""
        precio = self.precio_distribuidor
        iva_pct = self.iva_percentage or 21.0  # Default to 21% if None
        return precio * Decimal(iva_pct / 100)

    @hybrid_property
    def precio_publico_con_iva(self) -> Decimal:
        """Calculate retail price including IVA"""
        return self.precio_publico + self.iva_publico

    @hybrid_property
    def precio_mayorista_con_iva(self) -> Decimal:
        """Calculate wholesale price including IVA"""
        return self.precio_mayorista + self.iva_mayorista

    @hybrid_property
    def precio_distribuidor_con_iva(self) -> Decimal:
        """Calculate distributor price including IVA"""
        return self.precio_distribuidor + self.iva_distribuidor

    @hybrid_property
    def precio_publico(self) -> Decimal:
        """Calculate retail selling price based on profit margin"""
        costo_total = self.calcular_costo_total()
        if costo_total == 0:
            return Decimal('0')
        margen = self.margen_publico
        if margen >= 100 or margen < 0:
            return Decimal('0')
        return costo_total / (1 - margen / 100)

    @hybrid_property
    def precio_mayorista(self) -> Decimal:
        """Calculate wholesale selling price based on profit margin"""
        costo_total = self.calcular_costo_total()
        if costo_total == 0:
            return Decimal('0')
        margen = self.margen_mayorista
        if margen >= 100 or margen < 0:
            return Decimal('0')
        return costo_total / (1 - margen / 100)

    @hybrid_property
    def precio_distribuidor(self) -> Decimal:
        """Calculate distributor selling price based on profit margin"""
        costo_total = self.calcular_costo_total()
        if costo_total == 0:
            return Decimal('0')
        margen = self.margen_distribuidor
        if margen >= 100 or margen < 0:
            return Decimal('0')
        return costo_total / (1 - margen / 100)


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