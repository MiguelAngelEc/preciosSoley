from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from .base import BaseEntity


class Proforma(BaseEntity):
    __tablename__ = "proformas"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    numero_proforma = Column(String, nullable=False, unique=True)
    tipo_cliente = Column(String, nullable=False)  # 'publico', 'mayorista', 'distribuidor'

    # Client Information
    cliente_nombre = Column(String, nullable=False)
    cliente_empresa = Column(String, nullable=True)
    cliente_ruc = Column(String, nullable=True)
    cliente_direccion = Column(Text, nullable=True)
    cliente_telefono = Column(String, nullable=True)
    cliente_email = Column(String, nullable=True)

    # Proforma Details
    fecha_emision = Column(DateTime, default=datetime.utcnow)
    fecha_validez = Column(DateTime, nullable=False)  # +15 days from emission
    iva_aplicado = Column(Numeric(5, 2), nullable=False)  # User-defined IVA

    # Calculations
    subtotal = Column(Numeric(10, 2), nullable=False)
    total_iva = Column(Numeric(10, 2), nullable=False)
    total_final = Column(Numeric(10, 2), nullable=False)

    # Relationships
    user = relationship("User", back_populates="proformas")
    proforma_items = relationship("ProformaItem", back_populates="proforma", cascade="all, delete-orphan")

    def generar_numero_proforma(self) -> str:
        """Generate proforma number: PRF-YYYY-NNNN"""
        year = datetime.utcnow().year
        # In a real implementation, you'd track the sequence number per user/year
        # For now, using timestamp-based unique number
        timestamp = int(datetime.utcnow().timestamp())
        return f"PRF-{year}-{timestamp}"


class ProformaItem(BaseEntity):
    __tablename__ = "proforma_items"

    proforma_id = Column(Integer, ForeignKey("proformas.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)  # Based on client type
    subtotal_item = Column(Numeric(10, 2), nullable=False)

    proforma = relationship("Proforma", back_populates="proforma_items")
    product = relationship("Product")