"""
Endpoints para gestión de Control Reproductivo
"""
from typing import Any
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.models.control_reproductivo import ControlReproductivo
from app.models.animal import Animal
from app.schemas.control_reproductivo import (
    ControlReproductivoCreate,
    ControlReproductivoUpdate,
    ControlReproductivoResponse,
    ControlReproductivoListResponse,
    EstadisticasReproductivas
)

router = APIRouter()


@router.post("/", response_model=ControlReproductivoResponse, status_code=status.HTTP_201_CREATED)
def crear_registro_reproductivo(
    *,
    db: Session = Depends(get_db),
    registro_in: ControlReproductivoCreate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Crear nuevo registro reproductivo (servicio, diagnóstico, parto)
    """
    # Verificar que el animal exista y pertenezca a la finca
    animal = db.query(Animal).filter(
        Animal.id == registro_in.animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado o no pertenece a tu finca"
        )
    
    # Validar que sea hembra (solo hembras tienen control reproductivo)
    if animal.sexo != "hembra":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo las hembras pueden tener registros reproductivos"
        )
    
    # Si hay toro_id, verificar que exista y sea macho
    toro = None
    if registro_in.toro_id:
        toro = db.query(Animal).filter(
            Animal.id == registro_in.toro_id,
            Animal.finca_id == current_user.finca_id
        ).first()
        
        if not toro:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Toro no encontrado"
            )
        
        if toro.sexo != "macho":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El toro debe ser macho"
            )
    
    # Crear registro
    db_registro = ControlReproductivo(
        **registro_in.model_dump(),
        finca_id=current_user.finca_id,
        registrado_por=current_user.id
    )
    
    db.add(db_registro)
    db.commit()
    db.refresh(db_registro)
    
    # Preparar respuesta
    response = ControlReproductivoResponse(
        **db_registro.__dict__,
        animal_numero=animal.numero_identificacion,
        animal_nombre=animal.nombre,
        toro_numero=toro.numero_identificacion if toro else None,
        toro_nombre=toro.nombre if toro else None
    )
    
    return response


@router.get("/", response_model=ControlReproductivoListResponse)
def listar_registros_reproductivos(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    animal_id: int | None = Query(None),
    tipo_evento: str | None = Query(None),
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
    diagnostico: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
) -> Any:
    """
    Listar registros reproductivos con filtros
    """
    query = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == current_user.finca_id
    )
    
    if animal_id:
        query = query.filter(ControlReproductivo.animal_id == animal_id)
    
    if tipo_evento:
        query = query.filter(ControlReproductivo.tipo_evento == tipo_evento.lower())
    
    if fecha_desde:
        query = query.filter(ControlReproductivo.fecha_evento >= fecha_desde)
    
    if fecha_hasta:
        query = query.filter(ControlReproductivo.fecha_evento <= fecha_hasta)
    
    if diagnostico:
        query = query.filter(ControlReproductivo.diagnostico == diagnostico.lower())
    
    query = query.order_by(ControlReproductivo.fecha_evento.desc())
    
    total = query.count()
    registros = query.offset(skip).limit(limit).all()
    
    # Cargar animales y toros
    items = []
    for registro in registros:
        animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
        toro = None
        if registro.toro_id:
            toro = db.query(Animal).filter(Animal.id == registro.toro_id).first()
        
        items.append(
            ControlReproductivoResponse(
                **registro.__dict__,
                animal_numero=animal.numero_identificacion if animal else None,
                animal_nombre=animal.nombre if animal else None,
                toro_numero=toro.numero_identificacion if toro else None,
                toro_nombre=toro.nombre if toro else None
            )
        )
    
    return ControlReproductivoListResponse(
        total=total,
        items=items,
        skip=skip,
        limit=limit
    )


@router.get("/{registro_id}", response_model=ControlReproductivoResponse)
def obtener_registro_reproductivo(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Obtener un registro reproductivo por ID
    """
    registro = db.query(ControlReproductivo).filter(
        ControlReproductivo.id == registro_id,
        ControlReproductivo.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro reproductivo no encontrado"
        )
    
    animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
    toro = None
    if registro.toro_id:
        toro = db.query(Animal).filter(Animal.id == registro.toro_id).first()
    
    return ControlReproductivoResponse(
        **registro.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None,
        toro_numero=toro.numero_identificacion if toro else None,
        toro_nombre=toro.nombre if toro else None
    )


@router.put("/{registro_id}", response_model=ControlReproductivoResponse)
def actualizar_registro_reproductivo(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    registro_in: ControlReproductivoUpdate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Actualizar un registro reproductivo
    """
    registro = db.query(ControlReproductivo).filter(
        ControlReproductivo.id == registro_id,
        ControlReproductivo.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro reproductivo no encontrado"
        )
    
    update_data = registro_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(registro, field, value)
    
    db.commit()
    db.refresh(registro)
    
    animal = db.query(Animal).filter(Animal.id == registro.animal_id).first()
    toro = None
    if registro.toro_id:
        toro = db.query(Animal).filter(Animal.id == registro.toro_id).first()
    
    return ControlReproductivoResponse(
        **registro.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None,
        toro_numero=toro.numero_identificacion if toro else None,
        toro_nombre=toro.nombre if toro else None
    )


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_registro_reproductivo(
    *,
    db: Session = Depends(get_db),
    registro_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> None:
    """
    Eliminar un registro reproductivo
    """
    registro = db.query(ControlReproductivo).filter(
        ControlReproductivo.id == registro_id,
        ControlReproductivo.finca_id == current_user.finca_id
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro reproductivo no encontrado"
        )
    
    db.delete(registro)
    db.commit()
    
    return None


@router.get("/estadisticas/resumen", response_model=EstadisticasReproductivas)
def obtener_estadisticas_reproductivas(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Obtener estadísticas reproductivas de la finca
    """
    # Total de hembras activas
    total_hembras = db.query(Animal).filter(
        Animal.finca_id == current_user.finca_id,
        Animal.sexo == "hembra",
        Animal.estado == "activo"
    ).count()
    
    # Obtener último diagnóstico de cada hembra
    ultimo_diagnostico_subquery = (
        db.query(
            ControlReproductivo.animal_id,
            func.max(ControlReproductivo.fecha_evento).label("ultima_fecha")
        )
        .filter(
            ControlReproductivo.finca_id == current_user.finca_id,
            ControlReproductivo.tipo_evento == "diagnostico"
        )
        .group_by(ControlReproductivo.animal_id)
        .subquery()
    )
    
    # Hembras preñadas (último diagnóstico = prenada)
    hembras_prenadas = db.query(ControlReproductivo).join(
        ultimo_diagnostico_subquery,
        and_(
            ControlReproductivo.animal_id == ultimo_diagnostico_subquery.c.animal_id,
            ControlReproductivo.fecha_evento == ultimo_diagnostico_subquery.c.ultima_fecha
        )
    ).filter(
        ControlReproductivo.diagnostico == "prenada"
    ).count()
    
    # Hembras vacías
    hembras_vacias = db.query(ControlReproductivo).join(
        ultimo_diagnostico_subquery,
        and_(
            ControlReproductivo.animal_id == ultimo_diagnostico_subquery.c.animal_id,
            ControlReproductivo.fecha_evento == ultimo_diagnostico_subquery.c.ultima_fecha
        )
    ).filter(
        ControlReproductivo.diagnostico == "vacia"
    ).count()
    
    # Servicios último mes
    hace_30_dias = date.today() - timedelta(days=30)
    servicios_ultimo_mes = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == current_user.finca_id,
        ControlReproductivo.tipo_evento == "servicio",
        ControlReproductivo.fecha_evento >= hace_30_dias
    ).count()
    
    # Partos último mes
    partos_ultimo_mes = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == current_user.finca_id,
        ControlReproductivo.tipo_evento == "parto",
        ControlReproductivo.fecha_evento >= hace_30_dias
    ).count()
    
    # Tasa de preñez
    tasa_prenez = (hembras_prenadas / total_hembras * 100) if total_hembras > 0 else 0.0
    
    # Promedio días gestación
    promedio_dias_gestacion = db.query(func.avg(ControlReproductivo.dias_gestacion)).filter(
        ControlReproductivo.finca_id == current_user.finca_id,
        ControlReproductivo.diagnostico == "prenada",
        ControlReproductivo.dias_gestacion.isnot(None)
    ).scalar() or 0.0
    
    # Próximos partos en 30 días
    dentro_30_dias = date.today() + timedelta(days=30)
    proximos_partos = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == current_user.finca_id,
        ControlReproductivo.fecha_probable_parto.isnot(None),
        ControlReproductivo.fecha_probable_parto <= dentro_30_dias,
        ControlReproductivo.fecha_probable_parto >= date.today()
    ).count()
    
    return EstadisticasReproductivas(
        total_hembras=total_hembras,
        hembras_prenadas=hembras_prenadas,
        hembras_vacias=hembras_vacias,
        servicios_ultimo_mes=servicios_ultimo_mes,
        partos_ultimo_mes=partos_ultimo_mes,
        tasa_prenez=round(tasa_prenez, 2),
        promedio_dias_gestacion=round(promedio_dias_gestacion, 1) if promedio_dias_gestacion else None,
        proximos_partos_30_dias=proximos_partos
    )
