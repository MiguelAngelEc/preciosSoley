from enum import Enum

from sqlalchemy import Column, String, Enum as SQLEnum
from sqlalchemy.orm import relationship

from .base import BaseEntity

class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseEntity):
    __tablename__ = "users"

    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(Role), default=Role.USER)

    ruc = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    email_empresa = Column(String, nullable=True)

    materials = relationship("Material", back_populates="user")
    products = relationship("Product", back_populates="user")
    inventories = relationship("Inventory", back_populates="user")
    inventory_movements = relationship("InventoryMovement", back_populates="user")