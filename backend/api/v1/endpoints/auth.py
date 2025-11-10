"""
Endpoints de autenticación
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.usuario import Usuario
from app.models.finca import Finca
from app.schemas.auth import (
    Token,
    UserLogin,
    UserRegister,
    RefreshTokenRequest,
    PasswordChange
)
from app.schemas.usuario import UsuarioResponse

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Registrar nuevo usuario y crear su finca.
    El primer usuario de una finca es automáticamente propietario.
    """
    # Verificar si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Verificar si el NIT ya existe (si se proporcionó)
    if user_data.finca_nit:
        existing_finca = db.query(Finca).filter(Finca.nit == user_data.finca_nit).first()
        if existing_finca:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El NIT ya está registrado"
            )
    
    # Crear finca
    new_finca = Finca(
        nombre=user_data.finca_nombre,
        nit=user_data.finca_nit,
        departamento=user_data.departamento,
        municipio=user_data.municipio,
        tipo_ganaderia=user_data.tipo_ganaderia,
        activa=True,
        plan="basico"
    )
    db.add(new_finca)
    db.flush()  # Para obtener el ID de la finca
    
    # Crear usuario (propietario de la finca)
    hashed_password = get_password_hash(user_data.password)
    new_user = Usuario(
        email=user_data.email,
        hashed_password=hashed_password,
        nombre_completo=user_data.nombre_completo,
        telefono=user_data.telefono,
        documento=user_data.documento,
        finca_id=new_finca.id,
        rol="propietario",  # Primer usuario es propietario
        activo=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generar tokens
    access_token = create_access_token(
        data={"sub": str(new_user.id), "finca_id": new_finca.id, "rol": new_user.rol}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(new_user.id)}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login de usuario con email y contraseña.
    Retorna access token y refresh token.
    """
    # Buscar usuario por email (username en OAuth2PasswordRequestForm)
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar contraseña
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que el usuario esté activo
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Generar tokens
    access_token = create_access_token(
        data={"sub": str(user.id), "finca_id": user.finca_id, "rol": user.rol}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/refresh", response_model=Token)
def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Renovar access token usando refresh token.
    """
    # Decodificar refresh token
    payload = decode_token(request.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    # Verificar que es un refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    # Buscar usuario
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo"
        )
    
    # Generar nuevos tokens
    access_token = create_access_token(
        data={"sub": str(user.id), "finca_id": user.finca_id, "rol": user.rol}
    )
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UsuarioResponse)
def get_current_user_info(
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener información del usuario actual.
    """
    return current_user


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cambiar contraseña del usuario actual.
    """
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}
