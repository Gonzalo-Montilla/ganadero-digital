"""
Schemas para Registro de Producción (leche, carne, etc)
"""
from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class RegistroProduccionBase(BaseModel):
    """Schema base para registro de producción"""
    animal_id: int = Field(..., description="ID del animal productor")
    tipo_produccion: str = Field(..., description="leche, carne, lana, otro")
    fecha: date
    
    # Producción lechera
    cantidad_litros: Optional[float] = Field(None, ge=0, description="Litros de leche")
    turno: Optional[str] = Field(None, description="manana, tarde, noche")
    
    # Producción carne
    peso_venta: Optional[float] = Field(None, gt=0, description="Peso en canal (kg)")
    
    # Campos comunes
    calidad: Optional[str] = Field(None, description="alta, media, baja")
    observaciones: Optional[str] = Field(None, max_length=500)

    @field_validator('tipo_produccion')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        tipos_validos = ['leche', 'carne', 'lana', 'otro']
        if v.lower() not in tipos_validos:
            raise ValueError(f'Tipo debe ser uno de: {", ".join(tipos_validos)}')
        return v.lower()


class RegistroProduccionCreate(RegistroProduccionBase):
    pass


class RegistroProduccionUpdate(BaseModel):
    tipo_produccion: Optional[str] = None
    fecha: Optional[date] = None
    cantidad_litros: Optional[float] = Field(None, ge=0)
    turno: Optional[str] = None
    peso_venta: Optional[float] = Field(None, gt=0)
    calidad: Optional[str] = None
    observaciones: Optional[str] = Field(None, max_length=500)


class RegistroProduccionInDB(RegistroProduccionBase):
    id: int
    finca_id: int
    registrado_por: Optional[int] = None
    
    class Config:
        from_attributes = True


class RegistroProduccionResponse(RegistroProduccionInDB):
    animal_numero: Optional[str] = None
    animal_nombre: Optional[str] = None


class RegistroProduccionListResponse(BaseModel):
    total: int
    items: list[RegistroProduccionResponse]
    skip: int
    limit: int
