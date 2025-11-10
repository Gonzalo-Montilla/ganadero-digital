"""
Dependencias para FastAPI (autenticación, DB, permisos)
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import TokenPayload

# OAuth2 scheme para extraer token del header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Usuario:
    """
    Dependency para obtener el usuario actual desde el token JWT.
    
    Args:
        db: Sesión de base de datos
        token: Token JWT del header Authorization
    
    Returns:
        Usuario autenticado
    
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decodificar token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    # Verificar que es un access token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    user_id_str: Optional[str] = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception
    
    # Buscar usuario en DB
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    return user


def get_current_active_user(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """
    Dependency para verificar que el usuario esté activo.
    """
    if not current_user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    return current_user


def require_role(allowed_roles: list[str]):
    """
    Dependency factory para verificar roles de usuario.
    
    Args:
        allowed_roles: Lista de roles permitidos
    
    Returns:
        Dependency function
    """
    def role_checker(current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado. Roles requeridos: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


# Dependency para verificar que el usuario sea admin
get_current_admin = require_role(["admin", "propietario"])
