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
from app.schemas.baja_animal import BajaMuerteRequest, BajaMuerteResponse
from app.schemas.hoja_vida import HojaVidaReproductivaResponse
from app.schemas.pesaje import AnimalFaenaCandidato, PesajeCreate, PesajeResponse
from app.services.animal_hoja_vida_service import build_hoja_vida_reproductiva
from app.services.pesaje_service import (
    calcular_ganancia_kg_dia,
    listar_candidatos_faena,
    peso_objetivo_faena,
    registrar_pesaje,
)
from app.models.historial_pesaje import HistorialPesaje

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


@router.get("/candidatos-faena", response_model=list[AnimalFaenaCandidato])
def list_candidatos_faena(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Animales activos de ceba/doble propósito que alcanzaron peso objetivo para faena."""
    candidatos = listar_candidatos_faena(db, current_user.finca_id)
    resultado: list[AnimalFaenaCandidato] = []
    for animal in candidatos:
        resultado.append(
            AnimalFaenaCandidato(
                id=animal.id,
                numero_identificacion=animal.numero_identificacion,
                nombre=animal.nombre,
                categoria=animal.categoria,
                proposito=animal.proposito,
                peso_actual=animal.peso_actual,
                peso_objetivo=peso_objetivo_faena(animal),
                ultima_fecha_pesaje=animal.ultima_fecha_pesaje,
                ganancia_kg_dia=calcular_ganancia_kg_dia(db, animal.id),
            )
        )
    return resultado


@router.get("/{animal_id}/pesajes", response_model=list[PesajeResponse])
def list_pesajes_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id,
    ).first()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no encontrado")

    pesajes = (
        db.query(HistorialPesaje)
        .filter(
            HistorialPesaje.animal_id == animal_id,
            HistorialPesaje.finca_id == current_user.finca_id,
        )
        .order_by(HistorialPesaje.fecha.desc(), HistorialPesaje.id.desc())
        .all()
    )
    return pesajes


@router.post("/{animal_id}/pesajes", response_model=PesajeResponse, status_code=status.HTTP_201_CREATED)
def crear_pesaje_animal(
    animal_id: int,
    payload: PesajeCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id,
    ).first()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no encontrado")
    if animal.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden registrar pesajes en animales activos",
        )

    registro = registrar_pesaje(
        db,
        animal=animal,
        finca_id=current_user.finca_id,
        fecha=payload.fecha,
        peso_kg=payload.peso_kg,
        observaciones=payload.observaciones,
        registrado_por=current_user.id,
    )
    animal.sync_version += 1
    animal.sync_status = "pending"
    db.commit()
    db.refresh(registro)
    return registro


@router.post("/{animal_id}/baja-muerte", response_model=BajaMuerteResponse, status_code=status.HTTP_200_OK)
def registrar_baja_muerte(
    animal_id: int,
    payload: BajaMuerteRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Registrar muerte de un animal activo.
    Distinto de venta/faena: no genera ingreso ni transacción financiera.
    """
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id,
    ).first()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal no encontrado")
    if animal.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solo se puede registrar muerte en animales activos (estado actual: {animal.estado})",
        )

    motivo_completo = payload.motivo.strip()
    if payload.observaciones:
        motivo_completo = f"{motivo_completo}. {payload.observaciones.strip()}"

    animal.estado = "muerto"
    animal.fecha_salida = payload.fecha
    animal.motivo_salida = motivo_completo
    animal.lote_actual = None
    animal.potrero_actual = None
    animal.sync_version += 1
    animal.sync_status = "pending"

    db.commit()
    db.refresh(animal)

    return BajaMuerteResponse(
        id=animal.id,
        numero_identificacion=animal.numero_identificacion,
        estado=animal.estado,
        fecha_salida=animal.fecha_salida,
        motivo_salida=animal.motivo_salida,
        mensaje=f"Animal {animal.numero_identificacion} registrado como muerto",
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

    if "estado" in update_data:
        nuevo_estado = update_data["estado"]
        if nuevo_estado == "vendido":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para vender un animal use Finanzas → Venta → Animal sacrificio/faena",
            )
        if nuevo_estado == "muerto":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para registrar la muerte use Inventario → Ver animal → Registrar muerte",
            )
        if animal.estado != "activo" and nuevo_estado == "activo":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede reactivar un animal dado de baja desde aquí",
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


@router.get("/{animal_id}/hoja-vida-reproductiva", response_model=HojaVidaReproductivaResponse)
def get_hoja_vida_reproductiva(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Genealogía legible, descendencia y línea de tiempo reproductiva del animal.
    """
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id,
    ).first()

    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado",
        )

    return build_hoja_vida_reproductiva(db, animal, current_user.finca_id)
