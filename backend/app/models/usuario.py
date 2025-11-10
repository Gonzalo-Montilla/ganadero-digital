"""
Modelo Usuario - Gestión de usuarios del sistema
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.base_model import BaseModel


class Usuario(BaseModel):
    """
    Modelo de Usuario del sistema.
    Usuarios pertenecen a una finca específica (multi-tenant).
    """
    __tablename__ = "usuarios"
    
    # Relación con Finca (multi-tenant)
    finca_id = Column(Integer, ForeignKey("fincas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Información personal
    nombre_completo = Column(String(200), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    telefono = Column(String(20))
    documento = Column(String(50), unique=True, index=True)
    
    # Autenticación
    hashed_password = Column(String(200), nullable=False)
    
    # Rol y permisos
    rol = Column(String(50), nullable=False, default="operario")
    # Roles: admin, veterinario, operario, propietario
    
    # Estado
    activo = Column(Boolean, default=True, nullable=False)
    email_verificado = Column(Boolean, default=False)
    
    # Configuración
    idioma = Column(String(10), default="es")
    recibir_notificaciones = Column(Boolean, default=True)
    
    # Relaciones
    finca = relationship("Finca", back_populates="usuarios")
    
    def __repr__(self):
        return f"<Usuario(id={self.id}, email={self.email}, rol={self.rol})>"
