"""
Modelo Animal - Registro individual de ganado
"""
from sqlalchemy import Column, String, Date, Float, ForeignKey, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_model import BaseModel


class Animal(BaseModel):
    """
    Modelo de Animal (bovino).
    Registro individual de cada cabeza de ganado en la finca.
    """
    __tablename__ = "animales"
    
    # Relación con Finca (multi-tenant)
    finca_id = Column(Integer, ForeignKey("fincas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Identificación
    numero_identificacion = Column(String(100), nullable=False, index=True)  # Chapeta, arete, etc.
    nombre = Column(String(200))
    foto_url = Column(String(500))  # URL de foto del animal
    
    # Información básica
    sexo = Column(String(10), nullable=False)  # macho, hembra
    fecha_nacimiento = Column(Date)
    raza = Column(String(100))
    color = Column(String(50))
    
    # Genealogía
    madre_id = Column(Integer, ForeignKey("animales.id", ondelete="SET NULL"), index=True)
    padre_id = Column(Integer, ForeignKey("animales.id", ondelete="SET NULL"), index=True)
    
    # Características físicas
    peso_nacimiento = Column(Float)  # kg
    peso_actual = Column(Float)  # kg
    peso_anterior = Column(Float)  # kg - Peso del pesaje previo
    ultima_fecha_pesaje = Column(Date)
    
    # Procedencia
    tipo_adquisicion = Column(String(50))  # nacido_finca, comprado, donado
    fecha_ingreso = Column(Date, nullable=False)
    finca_origen = Column(String(200))
    
    # Estado actual
    estado = Column(String(50), nullable=False, default="activo")
    # Estados: activo, vendido, muerto, transferido, robado
    fecha_salida = Column(Date)
    motivo_salida = Column(Text)
    
    # Clasificación
    categoria = Column(String(50))  # ternero, novillo, vaca, toro, etc.
    proposito = Column(String(50))  # leche, carne, reproduccion, trabajo
    
    # Ubicación en finca
    lote_actual = Column(String(100))
    potrero_actual = Column(String(100))
    
    # Registro sanitario (ICA)
    numero_registro_ica = Column(String(100), unique=True, index=True)
    
    # Observaciones
    observaciones = Column(Text)
    
    # Relaciones
    finca = relationship("Finca", back_populates="animales")
    
    def __repr__(self):
        return f"<Animal(id={self.id}, identificacion={self.numero_identificacion}, estado={self.estado})>"
