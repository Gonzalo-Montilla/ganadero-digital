"""
Schemas Pydantic para Animal
"""
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel


class AnimalBase(BaseModel):
    """Schema base de Animal"""
    numero_identificacion: str
    nombre: Optional[str] = None
    sexo: str  # macho, hembra
    fecha_nacimiento: Optional[date] = None
    raza: Optional[str] = None
    color: Optional[str] = None
    peso_nacimiento: Optional[float] = None
    tipo_adquisicion: Optional[str] = None
    fecha_ingreso: date
    categoria: Optional[str] = None
    proposito: Optional[str] = None


class AnimalCreate(AnimalBase):
    """Schema para crear Animal"""
    peso_actual: Optional[float] = None
    madre_id: Optional[int] = None
    padre_id: Optional[int] = None
    finca_origen: Optional[str] = None
    lote_actual: Optional[str] = None
    potrero_actual: Optional[str] = None
    observaciones: Optional[str] = None


class AnimalUpdate(BaseModel):
    """Schema para actualizar Animal"""
    numero_identificacion: Optional[str] = None
    nombre: Optional[str] = None
    raza: Optional[str] = None
    color: Optional[str] = None
    peso_actual: Optional[float] = None
    ultima_fecha_pesaje: Optional[date] = None
    categoria: Optional[str] = None
    proposito: Optional[str] = None
    lote_actual: Optional[str] = None
    potrero_actual: Optional[str] = None
    estado: Optional[str] = None
    fecha_salida: Optional[date] = None
    motivo_salida: Optional[str] = None
    observaciones: Optional[str] = None


class AnimalInDB(AnimalBase):
    """Schema de Animal en base de datos"""
    id: int
    finca_id: int
    foto_url: Optional[str] = None
    madre_id: Optional[int] = None
    padre_id: Optional[int] = None
    peso_actual: Optional[float] = None
    peso_anterior: Optional[float] = None
    ultima_fecha_pesaje: Optional[date] = None
    finca_origen: Optional[str] = None
    estado: str
    fecha_salida: Optional[date] = None
    motivo_salida: Optional[str] = None
    lote_actual: Optional[str] = None
    potrero_actual: Optional[str] = None
    numero_registro_ica: Optional[str] = None
    observaciones: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnimalResponse(AnimalInDB):
    """Schema de respuesta de Animal"""
    pass


class AnimalListResponse(BaseModel):
    """Schema para lista paginada de animales"""
    total: int
    page: int
    page_size: int
    items: list[AnimalResponse]
