"""
Modelo RegistroProduccion - Control de producción lechera y alimentación
"""
from sqlalchemy import Column, String, Date, Float, ForeignKey, Integer, Text, Time
from sqlalchemy.orm import relationship
from app.db.base_model import BaseModel


class RegistroProduccion(BaseModel):
    """
    Modelo de Registro de Producción.
    Principalmente para control lechero, pero extensible a otros tipos.
    """
    __tablename__ = "registros_produccion"
    
    # Relación con Finca (multi-tenant)
    finca_id = Column(Integer, ForeignKey("fincas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relación con Animal
    animal_id = Column(Integer, ForeignKey("animales.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Tipo de producción
    tipo_produccion = Column(String(50), nullable=False, index=True)
    # Tipos: leche, carne, lana, otro
    
    # Fecha del registro
    fecha = Column(Date, nullable=False, index=True)
    
    # Producción lechera
    cantidad_litros = Column(Float)  # Litros de leche
    turno = Column(String(20))  # manana, tarde, noche
    
    # Producción carne
    peso_venta = Column(Float)  # Peso en canal (kg)
    
    # Calidad y observaciones
    calidad = Column(String(50))  # alta, media, baja
    observaciones = Column(Text)
    registrado_por = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    
    # Relaciones
    finca = relationship("Finca")
    animal = relationship("Animal")
    
    def __repr__(self):
        return f"<RegistroProduccion(id={self.id}, animal_id={self.animal_id}, fecha={self.fecha_registro})>"
