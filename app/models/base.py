from datetime import datetime

from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func

from ..database import Base

class BaseEntity(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}