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
    costo_etiqueta = Column(Numeric(10, 2), nullable=True, default=0.0)  # Label cost
    costo_envase = Column(Numeric(10, 2), nullable=True, default=0.0)  # Packaging cost
    costo_caja = Column(Numeric(10, 2), nullable=True, default=0.0)  # Box/container cost
    costo_transporte = Column(Numeric(10, 2), nullable=False)  # Transportation cost
    costo_mano_obra = Column(Numeric(10, 2), nullable=True, default=0.0)  # Direct labor cost per package
    costo_energia = Column(Numeric(10, 2), nullable=True, default=0.0)  # Energy costs (electricity, water, gas)
    costo_depreciacion = Column(Numeric(10, 2), nullable=True, default=0.0)  # Equipment depreciation
    costo_mantenimiento = Column(Numeric(10, 2), nullable=True, default=0.0)  # Equipment maintenance
    costo_administrativo = Column(Numeric(10, 2), nullable=True, default=0.0)  # Administrative overhead per unit
    costo_comercializacion = Column(Numeric(10, 2), nullable=True, default=0.0)  # Marketing and sales costs
    costo_financiero = Column(Numeric(10, 2), nullable=True, default=0.0)  # Financial costs (interest, loans)
    peso_ingredientes_base = Column(Numeric(10, 2), nullable=True, comment="Total weight of base ingredients")
    peso_final_producido = Column(Numeric(10, 2), nullable=True, comment="Final production weight/volume")
    peso_empaque = Column(Numeric(10, 2), nullable=True, comment="Selected package weight in grams")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="products")
    product_materials = relationship("ProductMaterial", back_populates="product", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")

    def calcular_costo_materiales(self) -> Decimal:
        """Calculate total cost of all materials only (excluding additional costs)"""
        total = Decimal('0')
        for pm in self.product_materials:
            if pm.material and pm.material.is_active:
                total += pm.material.calcular_precio_cantidad(pm.cantidad)
        return total

    def calcular_costo_total(self) -> Decimal:
        """Calculate total cost of all materials only (production cost)"""
        return self.calcular_costo_materiales()

    def calcular_costo_por_gramo_ajustado(self) -> Decimal:
        """Calculate adjusted cost per gram based on final production weight"""
        costo_total = self.calcular_costo_total()
        if self.peso_final_producido and self.peso_final_producido > 0:
            return costo_total / self.peso_final_producido
        else:
            # Fallback to material-based calculation: material cost per gram of materials
            costo_materiales = self.calcular_costo_materiales()
            total_material_weight = sum(pm.cantidad for pm in self.product_materials if pm.material and pm.material.is_active)
            return costo_materiales / total_material_weight if total_material_weight > 0 else Decimal('0')

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
        """Calculate retail selling price based on package profit margin"""
        precios = self.calcular_precios_por_empaque()
        return precios['precio_publico_paquete']

    @hybrid_property
    def precio_mayorista(self) -> Decimal:
        """Calculate wholesale selling price based on package profit margin"""
        precios = self.calcular_precios_por_empaque()
        return precios['precio_mayorista_paquete']

    @hybrid_property
    def precio_distribuidor(self) -> Decimal:
        """Calculate distributor selling price based on package profit margin"""
        precios = self.calcular_precios_por_empaque()
        return precios['precio_distribuidor_paquete']

    def calcular_costo_adicionales_total(self) -> Decimal:
        """Calculate total additional costs per package"""
        total = Decimal('0')
        total += self.costo_etiqueta or Decimal('0')
        total += self.costo_envase or Decimal('0')
        total += self.costo_caja or Decimal('0')
        total += self.costo_transporte
        total += self.costo_mano_obra or Decimal('0')
        total += self.costo_energia or Decimal('0')
        total += self.costo_depreciacion or Decimal('0')
        total += self.costo_mantenimiento or Decimal('0')
        total += self.costo_administrativo or Decimal('0')
        total += self.costo_comercializacion or Decimal('0')
        total += self.costo_financiero or Decimal('0')
        return total

    def calcular_precios_por_empaque(self) -> dict:
        """Calculate prices for the selected package weight"""
        if not self.peso_empaque:
            # Fallback: assume 1 unit package with additional costs
            costo_base_paquete = self.calcular_costo_adicionales_total()
            return {
                'costo_paquete': costo_base_paquete,
                'precio_publico_paquete': costo_base_paquete / (1 - self.margen_publico / 100) if self.margen_publico < 100 else Decimal('0'),
                'precio_mayorista_paquete': costo_base_paquete / (1 - self.margen_mayorista / 100) if self.margen_mayorista < 100 else Decimal('0'),
                'precio_distribuidor_paquete': costo_base_paquete / (1 - self.margen_distribuidor / 100) if self.margen_distribuidor < 100 else Decimal('0'),
                'precio_publico_con_iva_paquete': (costo_base_paquete / (1 - self.margen_publico / 100) if self.margen_publico < 100 else Decimal('0')) * (1 + (self.iva_percentage or 21.0) / 100),
                'precio_mayorista_con_iva_paquete': (costo_base_paquete / (1 - self.margen_mayorista / 100) if self.margen_mayorista < 100 else Decimal('0')) * (1 + (self.iva_percentage or 21.0) / 100),
                'precio_distribuidor_con_iva_paquete': (costo_base_paquete / (1 - self.margen_distribuidor / 100) if self.margen_distribuidor < 100 else Decimal('0')) * (1 + (self.iva_percentage or 21.0) / 100)
            }

        # Calculate material cost per package
        costo_por_gramo = self.calcular_costo_por_gramo_ajustado()
        costo_materiales_paquete = costo_por_gramo * self.peso_empaque

        # Add additional costs to package cost
        costo_base_paquete = costo_materiales_paquete + self.calcular_costo_adicionales_total()

        # Apply margins to package base cost (materials + additional costs)
        precio_publico_paquete = costo_base_paquete / (1 - self.margen_publico / 100) if self.margen_publico < 100 else Decimal('0')
        precio_mayorista_paquete = costo_base_paquete / (1 - self.margen_mayorista / 100) if self.margen_mayorista < 100 else Decimal('0')
        precio_distribuidor_paquete = costo_base_paquete / (1 - self.margen_distribuidor / 100) if self.margen_distribuidor < 100 else Decimal('0')

        # Calculate IVA on package prices
        iva_pct = self.iva_percentage or 21.0
        iva_factor = Decimal(iva_pct / 100)

        return {
            'costo_paquete': costo_base_paquete,
            'precio_publico_paquete': precio_publico_paquete,
            'precio_mayorista_paquete': precio_mayorista_paquete,
            'precio_distribuidor_paquete': precio_distribuidor_paquete,
            'precio_publico_con_iva_paquete': precio_publico_paquete + (precio_publico_paquete * iva_factor),
            'precio_mayorista_con_iva_paquete': precio_mayorista_paquete + (precio_mayorista_paquete * iva_factor),
            'precio_distribuidor_con_iva_paquete': precio_distribuidor_paquete + (precio_distribuidor_paquete * iva_factor)
        }


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