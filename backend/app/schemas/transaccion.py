"""
Schemas para Transacciones Financieras (ventas, compras, gastos)
"""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.constants.rubro_venta import RUBROS_VENTA, resolver_rubro_venta
from app.constants.rubro_afectacion import RUBROS_AFECTACION, RUBRO_GENERAL


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

    # Rubro de ingreso (ventas)
    rubro_venta: Optional[str] = Field(
        None,
        description="animal_sacrificio, leche, otro (solo ventas)",
    )
    cantidad_litros: Optional[float] = Field(None, ge=0, description="Litros vendidos (rubro leche)")
    precio_por_litro: Optional[float] = Field(None, gt=0, description="Precio por litro (rubro leche)")

    # Información del tercero
    tercero: Optional[str] = Field(None, max_length=200, description="Cliente o proveedor")
    documento_tercero: Optional[str] = Field(None, max_length=50)

    # Método de pago
    metodo_pago: Optional[str] = Field(None, description="efectivo, transferencia, cheque, credito")

    # Categoría de gasto
    categoria_gasto: Optional[str] = Field(None, description="sanidad, alimentacion, infraestructura, personal, otro")

    # Rubro al que afecta el gasto (solo tipo=gasto)
    rubro_afectacion: Optional[str] = Field(
        None,
        description="leche, ceba, general (solo gastos)",
    )

    observaciones: Optional[str] = Field(None, max_length=1000)

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        tipos_validos = ['venta', 'compra', 'gasto']
        if v.lower() not in tipos_validos:
            raise ValueError(f'Tipo debe ser uno de: {", ".join(tipos_validos)}')
        return v.lower()

    @field_validator('rubro_venta')
    @classmethod
    def validar_rubro_venta(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        rubro = v.lower()
        if rubro not in RUBROS_VENTA:
            raise ValueError(f'Rubro de venta debe ser uno de: {", ".join(RUBROS_VENTA)}')
        return rubro

    @field_validator('rubro_afectacion')
    @classmethod
    def validar_rubro_afectacion(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        rubro = v.lower()
        if rubro not in RUBROS_AFECTACION:
            raise ValueError(f'Rubro de afectación debe ser uno de: {", ".join(RUBROS_AFECTACION)}')
        return rubro

    @model_validator(mode='after')
    def validar_logica_gasto(self):
        if self.tipo == 'gasto' and self.rubro_afectacion is None:
            self.rubro_afectacion = RUBRO_GENERAL
        if self.tipo != 'gasto':
            self.rubro_afectacion = None
        return self

    @model_validator(mode='after')
    def validar_logica_venta(self):
        if self.tipo != 'venta':
            return self

        rubro = resolver_rubro_venta(self.tipo, self.rubro_venta, self.animal_id)

        if rubro == 'animal_sacrificio' and not self.animal_id:
            raise ValueError('La venta de animal para sacrificio/faena requiere seleccionar el animal')

        if rubro == 'leche':
            if self.animal_id:
                raise ValueError('La venta de leche no debe vincularse a un animal del inventario')
            if self.cantidad_litros is not None and self.cantidad_litros <= 0:
                raise ValueError('Indique litros vendidos mayores a cero')

        return self


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
    rubro_venta: Optional[str] = None
    cantidad_litros: Optional[float] = Field(None, ge=0)
    precio_por_litro: Optional[float] = Field(None, gt=0)
    tercero: Optional[str] = Field(None, max_length=200)
    documento_tercero: Optional[str] = Field(None, max_length=50)
    metodo_pago: Optional[str] = None
    categoria_gasto: Optional[str] = None
    rubro_afectacion: Optional[str] = None
    observaciones: Optional[str] = Field(None, max_length=1000)

    @field_validator('rubro_venta')
    @classmethod
    def validar_rubro_venta(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        rubro = v.lower()
        if rubro not in RUBROS_VENTA:
            raise ValueError(f'Rubro de venta debe ser uno de: {", ".join(RUBROS_VENTA)}')
        return rubro


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
    ventas_leche: float = 0.0
    ventas_animales: float = 0.0
    ventas_otros: float = 0.0
    gastos_leche: float = 0.0
    gastos_ceba: float = 0.0
    gastos_general: float = 0.0
    margen_leche: float = 0.0
    margen_ceba: float = 0.0
