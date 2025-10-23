from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import BaseEntity


class InventoryEgreso(BaseEntity):
    __tablename__ = "inventory_egresos"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    cantidad = Column(Numeric(10, 2), nullable=False)
    tipo_cliente = Column(String(20), nullable=False)  # 'publico', 'mayorista', 'distribuidor'
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    valor_total = Column(Numeric(10, 2), nullable=False)
    fecha_egreso = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    motivo = Column(Text, nullable=True)
    referencia = Column(String(255), nullable=True)  # Número de factura/orden
    usuario_responsable = Column(String(255), nullable=False)

    # Relationships
    user = relationship("User", back_populates="inventory_egresos")
    inventory = relationship("Inventory", back_populates="inventory_egresos")
    product = relationship("Product", back_populates="inventory_egresos")

    # Indexes for performance
    __table_args__ = (
        Index('ix_inventory_egresos_inventory_id', 'inventory_id'),
        Index('ix_inventory_egresos_product_id', 'product_id'),
        Index('ix_inventory_egresos_fecha_egreso', 'fecha_egreso'),
        Index('ix_inventory_egresos_user_id', 'user_id'),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate tipo_cliente
        if 'tipo_cliente' in kwargs:
            valid_types = ['publico', 'mayorista', 'distribuidor']
            if kwargs['tipo_cliente'] not in valid_types:
                raise ValueError(f"tipo_cliente must be one of: {', '.join(valid_types)}")

    @property
    def tipo_cliente_display(self) -> str:
        """Return human readable client type"""
        types = {
            'publico': 'Público',
            'mayorista': 'Mayorista',
            'distribuidor': 'Distribuidor'
        }
        return types.get(self.tipo_cliente, self.tipo_cliente)