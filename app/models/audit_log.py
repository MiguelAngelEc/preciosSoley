from sqlalchemy import Column, String, Text, ForeignKey, Integer

from .base import BaseEntity

class AuditLog(BaseEntity):
    __tablename__ = "audit_logs"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    action = Column(String(50), nullable=False)  # e.g., 'create', 'update', 'delete'
    description = Column(Text)
