"""
Schemas Pydantic para Usuario
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UsuarioBase(BaseModel):
    """Schema base de Usuario"""
    email: EmailStr
    nombre_completo: str
    telefono: Optional[str] = None
    documento: Optional[str] = None
    rol: str = "operario"
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    """Schema para crear Usuario"""
    password: str
    finca_id: int


class UsuarioCreateFinca(BaseModel):
    """Schema para crear usuario dentro de la finca actual"""
    email: EmailStr
    nombre_completo: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=6)
    telefono: Optional[str] = None
    documento: Optional[str] = None
    rol: str = Field(default="operario")


class UsuarioAdminUpdate(BaseModel):
    """Schema para actualizar usuario por administrador"""
    nombre_completo: Optional[str] = Field(None, min_length=3, max_length=200)
    telefono: Optional[str] = None
    documento: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    recibir_notificaciones: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


class UsuarioUpdate(BaseModel):
    """Schema para actualizar Usuario"""
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    recibir_notificaciones: Optional[bool] = None


class UsuarioInDB(UsuarioBase):
    """Schema de Usuario en base de datos"""
    id: int
    finca_id: int
    email_verificado: bool
    idioma: str
    recibir_notificaciones: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UsuarioResponse(UsuarioInDB):
    """Schema de respuesta de Usuario (sin password)"""
    pass


class UsuarioListResponse(BaseModel):
    """Schema de listado de usuarios"""
    total: int
    items: list[UsuarioResponse]
