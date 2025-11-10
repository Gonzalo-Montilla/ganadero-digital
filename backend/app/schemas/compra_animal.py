"""
Schemas para compra de animales (crear animal + transacción en una sola operación)
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class AnimalCompraData(BaseModel):
    """Datos básicos del animal que se está comprando"""
    numero_identificacion: str = Field(..., description="Número de identificación del animal")
    nombre: Optional[str] = None
    sexo: str = Field(..., description="macho o hembra")
    raza: str = Field(..., description="Raza del animal")
    fecha_nacimiento: Optional[date] = None
    peso_actual: Optional[float] = Field(None, description="Peso actual en kg")
    categoria: Optional[str] = Field(None, description="ternero, novillo, vaca, toro, etc")
    proposito: Optional[str] = Field(None, description="leche, carne, reproduccion")
    color: Optional[str] = None
    observaciones: Optional[str] = None


class TransaccionCompraData(BaseModel):
    """Datos de la transacción de compra"""
    fecha: date
    monto: float = Field(..., gt=0, description="Monto total de la compra")
    tercero: Optional[str] = Field(None, description="Nombre del vendedor")
    documento_tercero: Optional[str] = Field(None, description="Documento del vendedor")
    peso_total: Optional[float] = Field(None, description="Peso total en kg")
    precio_por_kg: Optional[float] = Field(None, description="Precio por kilogramo")
    numero_animales: Optional[int] = Field(1, description="Número de animales en la compra")
    metodo_pago: Optional[str] = Field(None, description="efectivo, transferencia, cheque, credito")
    observaciones: Optional[str] = None


class CompraAnimalRequest(BaseModel):
    """Request completo para compra de animal"""
    animal: AnimalCompraData
    transaccion: TransaccionCompraData


class CompraAnimalResponse(BaseModel):
    """Response después de crear animal y transacción"""
    animal_id: int
    animal_numero_identificacion: str
    transaccion_id: int
    mensaje: str

    class Config:
        from_attributes = True
