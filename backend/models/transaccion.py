"""
Modelo Transaccion - Gestión financiera de compras y ventas
"""
from sqlalchemy import Column, String, Date, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.db.base_model import BaseModel


class Transaccion(BaseModel):
    """
    Modelo de Transacción Financiera.
    Registro de compras, ventas y gastos operativos.
    """
    __tablename__ = "transacciones"
    
    # Relación con Finca (multi-tenant)
    finca_id = Column(Integer, ForeignKey("fincas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Tipo de transacción
    tipo = Column(String(50), nullable=False, index=True)
    # Tipos: venta, compra, gasto
    
    # Información de la transacción
    fecha = Column(Date, nullable=False, index=True)
    concepto = Column(String(200), nullable=False)
    monto = Column(Float, nullable=False)
    
    # Ventas/compras de animales
    animal_id = Column(Integer, ForeignKey("animales.id", ondelete="SET NULL"))
    numero_animales = Column(Integer)
    peso_total = Column(Float)
    precio_por_kg = Column(Float)
    
    # Información del tercero
    tercero = Column(String(200))  # Cliente o proveedor
    documento_tercero = Column(String(50))
    
    # Método de pago
    metodo_pago = Column(String(50))  # efectivo, transferencia, cheque, credito
    
    # Categoría de gasto
    categoria_gasto = Column(String(100))  # sanidad, alimentacion, infraestructura, personal, otro
    
    # Observaciones
    observaciones = Column(Text)
    registrado_por = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    
    # Relaciones
    finca = relationship("Finca")
    animal = relationship("Animal")
    
    def __repr__(self):
        return f"<Transaccion(id={self.id}, tipo={self.tipo_transaccion}, valor={self.valor})>"
