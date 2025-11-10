"""
Endpoints para gestión de Registros de Producción
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.models.registro_produccion import RegistroProduccion
from app.models.animal import Animal
from app.schemas.produccion import (
    RegistroProduccionCreate,
    RegistroProduccionUpdate,
    RegistroProduccionResponse,
    RegistroProduccionListResponse
)

router = APIRouter()


@router.post("/", response_model=RegistroProduccionResponse, status_code=status.HTTP_201_CREATED)
def crear_registro_produccion(
    *,
    db: Session = Depends(get_db),
    registro_in: RegistroProduccionCreate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Crear nuevo registro de producción"""
    animal = db.query(Animal).filter(
        Animal.id == registro_in.animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    
    db_registro = RegistroProduccion(
        **registro_in.model_dump(),
        finca_id=current_user.finca_id,
        registrado_por=current_user.id
    )
    
    db.add(db_registro)
    db.commit()
    db.refresh(db_registro)
    
    return RegistroProduccionResponse(
        **db_registro.__dict__,
        animal_numero=animal.numero_identificacion,
        animal_nombre=animal.nombre
    )


@router.get("/", response_model=RegistroProduccionListResponse)
def listar_registros_produccion(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    animal_id: int | None = Query(None),
    tipo_produccion: str | None = Query(None),
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
) -> Any:
    """Listar registros de producción"""
    query = db.query(RegistroProduccion).filter(
        RegistroProduccion.finca_id == current_user.finca_id
    )
    
    if animal_id:
        query = query.filter(RegistroProduccion.animal_id == animal_id)
    if tipo_produccion:
        query = query.filter(RegistroProduccion.tipo_produccion == tipo_produccion.lower())
    if fecha_desde:
        query = query.filter(RegistroProduccion.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(RegistroProduccion.fecha <= fecha_hasta)
    
    query = query.order_by(RegistroProduccion.fecha.desc())
    total = query.count()
    registros = query.offset(skip).limit(limit).all()
    
    items = []
    for registro in registros:
        animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
        items.append(RegistroProduccionResponse(
            **registro.__dict__,
            animal_numero=animal.numero_identificacion if animal else None,
            animal_nombre=animal.nombre if animal else None
        ))
    
    return RegistroProduccionListResponse(total=total, items=items, skip=skip, limit=limit)


@router.get("/{registro_id}", response_model=RegistroProduccionResponse)
def obtener_registro_produccion(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Obtener un registro de producción"""
    registro = db.query(RegistroProduccion).filter(
        RegistroProduccion.id == registro_id,
        RegistroProduccion.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
    return RegistroProduccionResponse(
        **registro.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None
    )


@router.put("/{registro_id}", response_model=RegistroProduccionResponse)
def actualizar_registro_produccion(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    registro_in: RegistroProduccionUpdate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Actualizar registro de producción"""
    registro = db.query(RegistroProduccion).filter(
        RegistroProduccion.id == registro_id,
        RegistroProduccion.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    for field, value in registro_in.model_dump(exclude_unset=True).items():
        setattr(registro, field, value)
    
    db.commit()
    db.refresh(registro)
    
    animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
    return RegistroProduccionResponse(
        **registro.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None
    )


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_registro_produccion(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> None:
    """Eliminar registro de producción"""
    registro = db.query(RegistroProduccion).filter(
        RegistroProduccion.id == registro_id,
        RegistroProduccion.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    db.delete(registro)
    db.commit()
    return None
