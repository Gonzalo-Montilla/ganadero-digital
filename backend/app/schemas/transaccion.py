"""
Schemas para Transacciones Financieras (ventas, compras, gastos)
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class TransaccionBase(BaseModel):
    """Schema base para transacciones"""
    tipo: str = Field(..., description="venta, compra, gasto")
    fecha: date
    concepto: str = Field(..., max_length=200, description="Descripción de la transacción")
    monto: float = Field(..., gt=0, description="Monto de la transacción")
    
    # Campos para ventas/compras de animales
    animal_id: Optional[int] = Field(None, description="ID del animal si aplica")
    numero_animales: Optional[int] = Field(None, ge=1, description="Cantidad de animales")
    peso_total: Optional[float] = Field(None, gt=0, description="Peso total en kg")
    precio_por_kg: Optional[float] = Field(None, gt=0, description="Precio por kilogramo")
    
    # Información del tercero
    tercero: Optional[str] = Field(None, max_length=200, description="Cliente o proveedor")
    documento_tercero: Optional[str] = Field(None, max_length=50)
    
    # Método de pago
    metodo_pago: Optional[str] = Field(None, description="efectivo, transferencia, cheque, credito")
    
    # Categoría de gasto
    categoria_gasto: Optional[str] = Field(None, description="sanidad, alimentacion, infraestructura, personal, otro")
    
    observaciones: Optional[str] = Field(None, max_length=1000)

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        tipos_validos = ['venta', 'compra', 'gasto']
        if v.lower() not in tipos_validos:
            raise ValueError(f'Tipo debe ser uno de: {", ".join(tipos_validos)}')
        return v.lower()


class TransaccionCreate(TransaccionBase):
    pass


class TransaccionUpdate(BaseModel):
    tipo: Optional[str] = None
    fecha: Optional[date] = None
    concepto: Optional[str] = Field(None, max_length=200)
    monto: Optional[float] = Field(None, gt=0)
    animal_id: Optional[int] = None
    numero_animales: Optional[int] = Field(None, ge=1)
    peso_total: Optional[float] = Field(None, gt=0)
    precio_por_kg: Optional[float] = Field(None, gt=0)
    tercero: Optional[str] = Field(None, max_length=200)
    documento_tercero: Optional[str] = Field(None, max_length=50)
    metodo_pago: Optional[str] = None
    categoria_gasto: Optional[str] = None
    observaciones: Optional[str] = Field(None, max_length=1000)


class TransaccionInDB(TransaccionBase):
    id: int
    finca_id: int
    registrado_por: Optional[int] = None
    
    class Config:
        from_attributes = True


class TransaccionResponse(TransaccionInDB):
    animal_numero: Optional[str] = None
    animal_nombre: Optional[str] = None


class TransaccionListResponse(BaseModel):
    total: int
    items: list[TransaccionResponse]
    skip: int
    limit: int


class ResumenFinanciero(BaseModel):
    """Resumen financiero de la finca"""
    total_ventas: float
    total_compras: float
    total_gastos: float
    balance_neto: float
    ventas_mes_actual: float
    gastos_mes_actual: float
    gasto_por_categoria: dict[str, float]
