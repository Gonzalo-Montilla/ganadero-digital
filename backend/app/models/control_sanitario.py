"""
Modelo ControlSanitario - Registro de vacunas, tratamientos y eventos sanitarios
"""
from sqlalchemy import Column, String, Date, Float, ForeignKey, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_model import BaseModel


class ControlSanitario(BaseModel):
    """
    Modelo de Control Sanitario.
    Registro de vacunas, desparasitaciones, tratamientos y eventos médicos.
    """
    __tablename__ = "controles_sanitarios"
    
    # Relación con Finca (multi-tenant)
    finca_id = Column(Integer, ForeignKey("fincas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relación con Animal
    animal_id = Column(Integer, ForeignKey("animales.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Tipo de evento sanitario (vacuna, desparasitacion, tratamiento, cirugia, otro)
    tipo = Column(String(50), nullable=False, index=True)
    
    # Información del evento
    fecha = Column(Date, nullable=False, index=True)
    proxima_dosis = Column(Date, index=True)  # Para alertas de próximas dosis
    
    # Detalles del producto/medicamento
    producto = Column(String(200))
    dosis = Column(String(100))
    via_administracion = Column(String(50))  # oral, intramuscular, subcutanea, topica, intravenosa, intramamaria
    lote_producto = Column(String(100))
    fecha_vencimiento = Column(Date)
    
    # Diagnóstico/motivo
    diagnostico = Column(String(1000))
    
    # Datos del animal en el momento
    peso_animal = Column(Float)
    temperatura = Column(Float)
    
    # Responsable
    veterinario = Column(String(200))
    aplicado_por = Column(Integer)  # usuario_id
    
    # Costos
    costo = Column(Float)
    
    # Tiempos de retiro
    dias_retiro_leche = Column(Integer)
    dias_retiro_carne = Column(Integer)
    
    # Observaciones
    observaciones = Column(Text)
    
    # Relaciones
    finca = relationship("Finca")
    animal = relationship("Animal")
    
    def __repr__(self):
        return f"<ControlSanitario(id={self.id}, animal_id={self.animal_id}, tipo={self.tipo})>"
