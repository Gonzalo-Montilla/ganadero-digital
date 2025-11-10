"""
Modelo base con campos comunes para todos los modelos
"""
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, String
from sqlalchemy.sql import func
from app.db.database import Base


class BaseModel(Base):
    """
    Modelo base abstracto con campos comunes:
    - ID autoincremental
    - Timestamps de creación y actualización
    - Campos para sincronización offline
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Campos para sincronización offline
    sync_version = Column(Integer, default=1, nullable=False)  # Versión para control de conflictos
    sync_status = Column(String(20), default="synced")  # synced, pending, conflict
    last_sync_at = Column(DateTime(timezone=True))  # Última sincronización
    
    # UUID del dispositivo que hizo el último cambio (para resolución de conflictos)
    last_modified_device = Column(String(100))
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
