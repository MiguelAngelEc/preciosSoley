from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship

from .base import BaseEntity


class Inventory(BaseEntity):
    __tablename__ = "inventories"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    fecha_produccion = Column(DateTime, nullable=False)
    cantidad_producida = Column(Numeric(10, 2), nullable=False)
    costo_unitario = Column(Numeric(10, 2), nullable=False)
    costo_total = Column(Numeric(10, 2), nullable=False)
    stock_actual = Column(Numeric(10, 2), nullable=False, default=0)
    stock_minimo = Column(Numeric(10, 2), nullable=True)
    ubicacion = Column(String(255), nullable=True)
    lote = Column(String(100), nullable=True)
    notas = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="inventories")
    product = relationship("Product", back_populates="inventories")
    inventory_movements = relationship("InventoryMovement", back_populates="inventory", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Initialize stock_actual with cantidad_producida if not provided
        if 'stock_actual' not in kwargs and 'cantidad_producida' in kwargs:
            self.stock_actual = kwargs['cantidad_producida']

    @property
    def stock_status(self) -> str:
        """Return stock status based on current stock vs minimum"""
        if self.stock_minimo and self.stock_actual <= self.stock_minimo:
            return "low"
        return "ok"


class InventoryMovement(BaseEntity):
    __tablename__ = "inventory_movements"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    tipo_movimiento = Column(String(20), nullable=False)  # 'entrada', 'salida', 'ajuste'
    cantidad = Column(Numeric(10, 2), nullable=False)  # Positive for entrada, negative for salida
    motivo = Column(String(255), nullable=False)
    referencia = Column(String(255), nullable=True)  # Proforma number, order, etc.
    stock_anterior = Column(Numeric(10, 2), nullable=False)
    stock_posterior = Column(Numeric(10, 2), nullable=False)
    usuario_responsable = Column(String(255), nullable=False)

    user = relationship("User", back_populates="inventory_movements")
    inventory = relationship("Inventory", back_populates="inventory_movements")

    @property
    def movimiento_display(self) -> str:
        """Return human readable movement type"""
        types = {
            'entrada': 'Entrada',
            'salida': 'Salida',
            'ajuste': 'Ajuste'
        }
        return types.get(self.tipo_movimiento, self.tipo_movimiento)