"""
Modelo ControlReproductivo - Gestión de celos, servicios, preñeces y partos
"""
from sqlalchemy import Column, String, Date, Float, ForeignKey, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_model import BaseModel


class ControlReproductivo(BaseModel):
    """
    Modelo de Control Reproductivo.
    Registro de eventos reproductivos: servicios, diagnósticos, partos, abortos, secado.
    """
    __tablename__ = "controles_reproductivos"
    
    # Relación con Finca (multi-tenant)
    finca_id = Column(Integer, ForeignKey("fincas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relación con Animal (hembra)
    animal_id = Column(Integer, ForeignKey("animales.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Tipo y fecha del evento
    tipo_evento = Column(String(50), nullable=False, index=True)
    # Tipos: servicio, diagnostico, parto, aborto, secado, otro
    fecha_evento = Column(Date, nullable=False, index=True)
    
    # SERVICIO/MONTA
    toro_id = Column(Integer, ForeignKey("animales.id", ondelete="SET NULL"))
    tipo_servicio = Column(String(50))  # monta_natural, inseminacion_artificial, transferencia_embrion
    numero_servicio = Column(Integer)
    pajuela_utilizada = Column(String(200))
    toro_pajuela = Column(String(200))
    
    # DIAGNÓSTICO
    diagnostico = Column(String(20), index=True)  # prenada, vacia, dudosa
    metodo_diagnostico = Column(String(50))  # palpacion, ecografia, laboratorio
    dias_gestacion = Column(Integer)
    fecha_probable_parto = Column(Date, index=True)  # Para alertas
    
    # PARTO
    tipo_parto = Column(String(50))  # normal, asistido, cesarea
    numero_crias = Column(Integer, default=1)
    sexo_cria = Column(String(20))  # macho, hembra, multiple
    peso_cria = Column(Float)  # kg
    facilidad_parto = Column(String(20))  # facil, normal, dificil, muy_dificil
    vitalidad_cria = Column(String(20))  # viva, muerta, debil
    
    # COMUNES
    veterinario = Column(String(200))
    costo = Column(Float)
    observaciones = Column(Text)
    
    # Auditoría
    registrado_por = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    
    # Relaciones
    finca = relationship("Finca")
    animal = relationship("Animal", foreign_keys=[animal_id])
    toro = relationship("Animal", foreign_keys=[toro_id])
    
    def __repr__(self):
        return f"<ControlReproductivo(id={self.id}, animal_id={self.animal_id}, tipo={self.tipo_evento})>"
