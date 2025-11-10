"""
Endpoints para gestión de Control Sanitario
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.models.control_sanitario import ControlSanitario
from app.models.animal import Animal
from app.schemas.control_sanitario import (
    ControlSanitarioCreate,
    ControlSanitarioUpdate,
    ControlSanitarioResponse,
    ControlSanitarioListResponse
)

router = APIRouter()


@router.post("/", response_model=ControlSanitarioResponse, status_code=status.HTTP_201_CREATED)
def crear_registro_sanitario(
    *,
    db: Session = Depends(get_db),
    registro_in: ControlSanitarioCreate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Crear nuevo registro sanitario (vacuna, tratamiento, desparasitación)
    """
    # Verificar que el animal exista y pertenezca a la finca del usuario
    animal = db.query(Animal).filter(
        Animal.id == registro_in.animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado o no pertenece a tu finca"
        )
    
    # Crear registro sanitario
    db_registro = ControlSanitario(
        **registro_in.model_dump(),
        finca_id=current_user.finca_id,
        aplicado_por=current_user.id
    )
    
    db.add(db_registro)
    db.commit()
    db.refresh(db_registro)
    
    # Preparar respuesta con datos del animal
    response = ControlSanitarioResponse(
        **db_registro.__dict__,
        animal_numero=animal.numero_identificacion,
        animal_nombre=animal.nombre
    )
    
    return response


@router.get("/", response_model=ControlSanitarioListResponse)
def listar_registros_sanitarios(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    animal_id: int | None = Query(None, description="Filtrar por animal"),
    tipo: str | None = Query(None, description="Filtrar por tipo"),
    fecha_desde: str | None = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: str | None = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    producto: str | None = Query(None, description="Buscar por producto"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
) -> Any:
    """
    Listar registros sanitarios con filtros
    """
    # Query base
    query = db.query(ControlSanitario).filter(
        ControlSanitario.finca_id == current_user.finca_id
    )
    
    # Aplicar filtros
    if animal_id:
        query = query.filter(ControlSanitario.animal_id == animal_id)
    
    if tipo:
        query = query.filter(ControlSanitario.tipo == tipo.lower())
    
    if fecha_desde:
        query = query.filter(ControlSanitario.fecha >= fecha_desde)
    
    if fecha_hasta:
        query = query.filter(ControlSanitario.fecha <= fecha_hasta)
    
    if producto:
        query = query.filter(ControlSanitario.producto.ilike(f"%{producto}%"))
    
    # Ordenar por fecha descendente
    query = query.order_by(ControlSanitario.fecha.desc())
    
    # Contar total
    total = query.count()
    
    # Paginar
    registros = query.offset(skip).limit(limit).all()
    
    # Cargar datos de animales
    items = []
    for registro in registros:
        animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
        items.append(
            ControlSanitarioResponse(
                **registro.__dict__,
                animal_numero=animal.numero_identificacion if animal else None,
                animal_nombre=animal.nombre if animal else None
            )
        )
    
    return ControlSanitarioListResponse(
        total=total,
        items=items,
        skip=skip,
        limit=limit
    )


@router.get("/{registro_id}", response_model=ControlSanitarioResponse)
def obtener_registro_sanitario(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Obtener un registro sanitario por ID
    """
    registro = db.query(ControlSanitario).filter(
        ControlSanitario.id == registro_id,
        ControlSanitario.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro sanitario no encontrado"
        )
    
    # Cargar datos del animal
    animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
    
    return ControlSanitarioResponse(
        **registro.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None
    )


@router.put("/{registro_id}", response_model=ControlSanitarioResponse)
def actualizar_registro_sanitario(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    registro_in: ControlSanitarioUpdate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Actualizar un registro sanitario
    """
    # Buscar registro
    registro = db.query(ControlSanitario).filter(
        ControlSanitario.id == registro_id,
        ControlSanitario.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro sanitario no encontrado"
        )
    
    # Actualizar campos
    update_data = registro_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(registro, field, value)
    
    db.commit()
    db.refresh(registro)
    
    # Cargar datos del animal
    animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
    
    return ControlSanitarioResponse(
        **registro.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None
    )


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_registro_sanitario(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> None:
    """
    Eliminar un registro sanitario
    """
    registro = db.query(ControlSanitario).filter(
        ControlSanitario.id == registro_id,
        ControlSanitario.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro sanitario no encontrado"
        )
    
    db.delete(registro)
    db.commit()
    
    return None


@router.get("/animal/{animal_id}/historial", response_model=ControlSanitarioListResponse)
def obtener_historial_sanitario_animal(
    *,
    db: Session = Depends(get_db),
    animal_id: int,
    current_user: Usuario = Depends(get_current_user),
    tipo: str | None = Query(None, description="Filtrar por tipo"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
) -> Any:
    """
    Obtener historial sanitario completo de un animal
    """
    # Verificar que el animal exista y pertenezca a la finca
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado"
        )
    
    # Query de registros
    query = db.query(ControlSanitario).filter(
        ControlSanitario.animal_id == animal_id,
        ControlSanitario.finca_id == current_user.finca_id
    )
    
    if tipo:
        query = query.filter(ControlSanitario.tipo == tipo.lower())
    
    query = query.order_by(ControlSanitario.fecha.desc())
    
    total = query.count()
    registros = query.offset(skip).limit(limit).all()
    
    items = [
        ControlSanitarioResponse(
            **registro.__dict__,
            animal_numero=animal.numero_identificacion,
            animal_nombre=animal.nombre
        )
        for registro in registros
    ]
    
    return ControlSanitarioListResponse(
        total=total,
        items=items,
        skip=skip,
        limit=limit
    )
