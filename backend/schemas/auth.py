"""
Schemas Pydantic para autenticación
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Schema para respuesta de token"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema para payload del token"""
    sub: Optional[int] = None  # user_id
    finca_id: Optional[int] = None
    rol: Optional[str] = None


class UserLogin(BaseModel):
    """Schema para login de usuario"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserRegister(BaseModel):
    """Schema para registro de usuario"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    nombre_completo: str = Field(..., min_length=3, max_length=200)
    telefono: Optional[str] = None
    documento: Optional[str] = None
    
    # Datos de la finca (para primer usuario/owner)
    finca_nombre: str = Field(..., min_length=3, max_length=200)
    finca_nit: Optional[str] = None
    departamento: str
    municipio: str
    tipo_ganaderia: str = Field(default="doble_proposito")


class RefreshTokenRequest(BaseModel):
    """Schema para solicitud de refresh token"""
    refresh_token: str


class PasswordChange(BaseModel):
    """Schema para cambio de contraseña"""
    current_password: str
    new_password: str = Field(..., min_length=6)
