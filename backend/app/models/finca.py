"""
Modelo Finca - Entidad principal para multi-tenancy
"""
from sqlalchemy import Column, String, Float, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_model import BaseModel


class Finca(BaseModel):
    """
    Modelo de Finca (explotación ganadera).
    Cada finca es un tenant independiente en el sistema.
    """
    __tablename__ = "fincas"
    
    # Información básica
    nombre = Column(String(200), nullable=False, index=True)
    nit = Column(String(50), unique=True, index=True)  # NIT o documento del propietario
    
    # Ubicación
    departamento = Column(String(100), nullable=False)
    municipio = Column(String(100), nullable=False)
    vereda = Column(String(200))
    direccion = Column(Text)
    latitud = Column(Float)
    longitud = Column(Float)
    
    # Características de la finca
    area_hectareas = Column(Float)
    tipo_ganaderia = Column(String(50))  # leche, carne, doble_proposito, otros
    
    # Información de contacto
    telefono = Column(String(20))
    email = Column(String(100))
    
    # Estado
    activa = Column(Boolean, default=True, nullable=False)
    
    # Plan/Suscripción
    plan = Column(String(50), default="basico")  # basico, premium, enterprise
    fecha_vencimiento_plan = Column(String(50))  # Para control de suscripciones
    
    # Configuración
    usa_control_lechero = Column(Boolean, default=False)
    usa_control_reproductivo = Column(Boolean, default=True)
    usa_control_sanitario = Column(Boolean, default=True)
    usa_control_financiero = Column(Boolean, default=False)
    
    # Relaciones
    usuarios = relationship("Usuario", back_populates="finca", cascade="all, delete-orphan")
    animales = relationship("Animal", back_populates="finca", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Finca(id={self.id}, nombre={self.nombre}, nit={self.nit})>"
