"""
Historial de pesajes por animal (engorde / control de peso).
"""
from sqlalchemy import Column, Date, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.db.base_model import BaseModel


class HistorialPesaje(BaseModel):
    __tablename__ = "historial_pesajes"

    finca_id = Column(Integer, ForeignKey("fincas.id", ondelete="CASCADE"), nullable=False, index=True)
    animal_id = Column(Integer, ForeignKey("animales.id", ondelete="CASCADE"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    peso_kg = Column(Float, nullable=False)
    observaciones = Column(Text)
    registrado_por = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))

    finca = relationship("Finca")
    animal = relationship("Animal")
