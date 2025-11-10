"""
Schemas Pydantic para Finca
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class FincaBase(BaseModel):
    """Schema base de Finca"""
    nombre: str
    nit: Optional[str] = None
    departamento: str
    municipio: str
    vereda: Optional[str] = None
    direccion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    area_hectareas: Optional[float] = None
    tipo_ganaderia: str = "doble_proposito"
    telefono: Optional[str] = None
    email: Optional[str] = None


class FincaCreate(FincaBase):
    """Schema para crear Finca"""
    pass


class FincaUpdate(BaseModel):
    """Schema para actualizar Finca"""
    nombre: Optional[str] = None
    departamento: Optional[str] = None
    municipio: Optional[str] = None
    vereda: Optional[str] = None
    direccion: Optional[str] = None
    area_hectareas: Optional[float] = None
    tipo_ganaderia: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    usa_control_lechero: Optional[bool] = None
    usa_control_reproductivo: Optional[bool] = None
    usa_control_sanitario: Optional[bool] = None
    usa_control_financiero: Optional[bool] = None


class FincaInDB(FincaBase):
    """Schema de Finca en base de datos"""
    id: int
    activa: bool
    plan: str
    fecha_vencimiento_plan: Optional[str] = None
    usa_control_lechero: bool
    usa_control_reproductivo: bool
    usa_control_sanitario: bool
    usa_control_financiero: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FincaResponse(FincaInDB):
    """Schema de respuesta de Finca"""
    pass
