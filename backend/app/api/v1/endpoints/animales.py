"""
Endpoints CRUD para Animales
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.deps import get_db, get_current_user
from app.core.config import settings
from app.models.usuario import Usuario
from app.models.animal import Animal
from app.schemas.animal import (
    AnimalCreate,
    AnimalUpdate,
    AnimalResponse,
    AnimalListResponse
)

router = APIRouter()


class MovimientoLoteRequest(BaseModel):
    animal_ids: list[int] = Field(default_factory=list)
    lote_destino: Optional[str] = None
    potrero_destino: Optional[str] = None


class MovimientoLoteResponse(BaseModel):
    movidos: int
    no_encontrados: list[int]


@router.get("", response_model=AnimalListResponse)
def list_animales(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(50, ge=1, le=100, description="Tamaño de página"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    sexo: Optional[str] = Query(None, description="Filtrar por sexo"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    lote_actual: Optional[str] = Query(None, description="Filtrar por lote"),
    potrero_actual: Optional[str] = Query(None, description="Filtrar por potrero"),
    search: Optional[str] = Query(None, description="Buscar por identificación o nombre")
):
    """
    Listar animales de la finca del usuario actual.
    Soporta paginación y filtros.
    """
    # Query base filtrado por finca del usuario
    query = db.query(Animal).filter(Animal.finca_id == current_user.finca_id)
    
    # Aplicar filtros
    if estado:
        query = query.filter(Animal.estado == estado)
    if sexo:
        query = query.filter(Animal.sexo == sexo)
    if categoria:
        query = query.filter(Animal.categoria == categoria)
    if lote_actual:
        query = query.filter(Animal.lote_actual == lote_actual)
    if potrero_actual:
        query = query.filter(Animal.potrero_actual == potrero_actual)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Animal.numero_identificacion.ilike(search_pattern)) |
            (Animal.nombre.ilike(search_pattern)) |
            (Animal.numero_registro_ica.ilike(search_pattern))
        )
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    offset = (page - 1) * page_size
    animales = query.order_by(Animal.created_at.desc()).offset(offset).limit(page_size).all()
    
    return AnimalListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=animales
    )


@router.post("", response_model=AnimalResponse, status_code=status.HTTP_201_CREATED)
def create_animal(
    animal_data: AnimalCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crear nuevo animal en la finca del usuario actual.
    """
    # Verificar que la identificación no exista en la finca
    existing = db.query(Animal).filter(
        Animal.finca_id == current_user.finca_id,
        Animal.numero_identificacion == animal_data.numero_identificacion
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un animal con identificación {animal_data.numero_identificacion}"
        )
    
    # Verificar que madre y padre pertenezcan a la misma finca (si se proporcionan)
    if animal_data.madre_id:
        madre = db.query(Animal).filter(
            Animal.id == animal_data.madre_id,
            Animal.finca_id == current_user.finca_id
        ).first()
        if not madre:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Madre no encontrada en esta finca"
            )
    
    if animal_data.padre_id:
        padre = db.query(Animal).filter(
            Animal.id == animal_data.padre_id,
            Animal.finca_id == current_user.finca_id
        ).first()
        if not padre:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Padre no encontrado en esta finca"
            )
    
    # Crear animal
    animal_dict = animal_data.model_dump()
    
    # Si tiene peso_actual al crear, establecer fecha de pesaje
    if animal_dict.get("peso_actual") is not None:
        from datetime import date
        animal_dict["ultima_fecha_pesaje"] = date.today()
    
    new_animal = Animal(
        **animal_dict,
        finca_id=current_user.finca_id,
        estado="activo"
    )
    
    db.add(new_animal)
    db.commit()
    db.refresh(new_animal)
    
    return new_animal


@router.post("/movimientos/lote", response_model=MovimientoLoteResponse)
def mover_animales_lote(
    payload: MovimientoLoteRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Mover animales en bloque a un lote/potrero.
    Diseñado para flujos de campo de baja fricción.
    """
    if not payload.animal_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar al menos un animal_id"
        )

    animales = db.query(Animal).filter(
        Animal.finca_id == current_user.finca_id,
        Animal.id.in_(payload.animal_ids)
    ).all()

    encontrados_ids = {a.id for a in animales}
    no_encontrados = [animal_id for animal_id in payload.animal_ids if animal_id not in encontrados_ids]

    for animal in animales:
        animal.lote_actual = payload.lote_destino
        animal.potrero_actual = payload.potrero_destino
        animal.sync_version += 1
        animal.sync_status = "pending"

    db.commit()

    return MovimientoLoteResponse(
        movidos=len(animales),
        no_encontrados=no_encontrados
    )


@router.get("/{animal_id}", response_model=AnimalResponse)
def get_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener detalles de un animal específico.
    """
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado"
        )
    
    return animal


@router.put("/{animal_id}", response_model=AnimalResponse)
def update_animal(
    animal_id: int,
    animal_data: AnimalUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Actualizar información de un animal.
    """
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = animal_data.model_dump(exclude_unset=True)

    if "estado" in update_data and update_data["estado"] in ("vendido", "muerto"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Para marcar un animal como vendido o muerto use el módulo de transacciones"
        )
    
    # Verificar identificación única si se está actualizando
    if "numero_identificacion" in update_data:
        existing = db.query(Animal).filter(
            Animal.finca_id == current_user.finca_id,
            Animal.numero_identificacion == update_data["numero_identificacion"],
            Animal.id != animal_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otro animal con identificación {update_data['numero_identificacion']}"
            )
    
    # Si se actualiza el peso_actual, guardar el peso anterior y actualizar fecha
    if "peso_actual" in update_data and update_data["peso_actual"] is not None:
        from datetime import date
        # Guardar el peso actual como peso_anterior
        if animal.peso_actual is not None:
            update_data["peso_anterior"] = animal.peso_actual
        update_data["ultima_fecha_pesaje"] = date.today()
    
    for field, value in update_data.items():
        setattr(animal, field, value)
    
    # Incrementar versión de sync
    animal.sync_version += 1
    animal.sync_status = "pending"
    
    db.commit()
    db.refresh(animal)
    
    return animal


@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Eliminar un animal (soft delete - cambiar estado a 'eliminado').
    """
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado"
        )
    
    # Soft delete - cambiar estado en lugar de eliminar
    animal.estado = "eliminado"
    animal.sync_version += 1
    animal.sync_status = "pending"
    
    db.commit()
    
    return None


@router.get("/{animal_id}/genealogia", response_model=dict)
def get_genealogia(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener árbol genealógico de un animal (padres, abuelos).
    """
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado"
        )
    
    finca_id = current_user.finca_id

    def _animal_en_finca(related_id: int | None):
        if not related_id:
            return None
        return db.query(Animal).filter(
            Animal.id == related_id,
            Animal.finca_id == finca_id,
        ).first()

    genealogia = {
        "animal": AnimalResponse.model_validate(animal),
        "madre": None,
        "padre": None,
        "abuelos_maternos": {"madre": None, "padre": None},
        "abuelos_paternos": {"madre": None, "padre": None}
    }

    if animal.madre_id:
        madre = _animal_en_finca(animal.madre_id)
        if madre:
            genealogia["madre"] = AnimalResponse.model_validate(madre)
            abuela_materna = _animal_en_finca(madre.madre_id)
            if abuela_materna:
                genealogia["abuelos_maternos"]["madre"] = AnimalResponse.model_validate(abuela_materna)
            abuelo_materno = _animal_en_finca(madre.padre_id)
            if abuelo_materno:
                genealogia["abuelos_maternos"]["padre"] = AnimalResponse.model_validate(abuelo_materno)

    if animal.padre_id:
        padre = _animal_en_finca(animal.padre_id)
        if padre:
            genealogia["padre"] = AnimalResponse.model_validate(padre)
            abuela_paterna = _animal_en_finca(padre.madre_id)
            if abuela_paterna:
                genealogia["abuelos_paternos"]["madre"] = AnimalResponse.model_validate(abuela_paterna)
            abuelo_paterno = _animal_en_finca(padre.padre_id)
            if abuelo_paterno:
                genealogia["abuelos_paternos"]["padre"] = AnimalResponse.model_validate(abuelo_paterno)

    return genealogia
