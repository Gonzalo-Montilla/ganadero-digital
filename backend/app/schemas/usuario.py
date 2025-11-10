"""
Schemas Pydantic para Usuario
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


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
