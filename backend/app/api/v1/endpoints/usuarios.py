"""
Endpoints CRUD para Usuarios de la finca
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_admin
from app.core.security import get_password_hash
from app.models.usuario import Usuario
from app.schemas.usuario import (
    UsuarioCreateFinca,
    UsuarioAdminUpdate,
    UsuarioResponse,
    UsuarioListResponse,
)

router = APIRouter()

ASSIGNABLE_ROLES = {"operario", "veterinario", "admin"}


def _validate_assignable_role(rol: str) -> None:
    if rol not in ASSIGNABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol no permitido. Opciones: {', '.join(sorted(ASSIGNABLE_ROLES))}",
        )


def _get_finca_user(db: Session, user_id: int, finca_id: int) -> Usuario:
    user = db.query(Usuario).filter(
        Usuario.id == user_id,
        Usuario.finca_id == finca_id,
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


@router.get("", response_model=UsuarioListResponse)
def list_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Listar usuarios de la finca actual."""
    usuarios = (
        db.query(Usuario)
        .filter(Usuario.finca_id == current_user.finca_id)
        .order_by(Usuario.created_at.desc())
        .all()
    )
    return UsuarioListResponse(total=len(usuarios), items=usuarios)


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(
    user_data: UsuarioCreateFinca,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Crear usuario dentro de la finca actual."""
    _validate_assignable_role(user_data.rol)

    existing_email = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )

    if user_data.documento:
        existing_document = db.query(Usuario).filter(Usuario.documento == user_data.documento).first()
        if existing_document:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El documento ya está registrado",
            )

    new_user = Usuario(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        nombre_completo=user_data.nombre_completo,
        telefono=user_data.telefono,
        documento=user_data.documento,
        finca_id=current_user.finca_id,
        rol=user_data.rol,
        activo=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", response_model=UsuarioResponse)
def update_usuario(
    user_id: int,
    user_data: UsuarioAdminUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Actualizar usuario de la finca."""
    user = _get_finca_user(db, user_id, current_user.finca_id)

    if user.id == current_user.id and user_data.activo is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propio usuario",
        )

    if user.rol == "propietario" and user.id != current_user.id:
        if user_data.rol is not None or user_data.activo is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede modificar el rol o estado del propietario",
            )

    if user_data.rol is not None:
        _validate_assignable_role(user_data.rol)
        if user.rol == "propietario":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede cambiar el rol del propietario",
            )
        user.rol = user_data.rol

    if user_data.nombre_completo is not None:
        user.nombre_completo = user_data.nombre_completo
    if user_data.telefono is not None:
        user.telefono = user_data.telefono
    if user_data.documento is not None:
        if user_data.documento:
            existing_document = db.query(Usuario).filter(
                Usuario.documento == user_data.documento,
                Usuario.id != user.id,
            ).first()
            if existing_document:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El documento ya está registrado",
                )
        user.documento = user_data.documento
    if user_data.activo is not None:
        user.activo = user_data.activo
    if user_data.recibir_notificaciones is not None:
        user.recibir_notificaciones = user_data.recibir_notificaciones
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)

    db.commit()
    db.refresh(user)
    return user
