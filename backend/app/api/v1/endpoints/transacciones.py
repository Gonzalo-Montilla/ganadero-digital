"""
Endpoints para gestión de Transacciones Financieras
"""
from typing import Any
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.models.transaccion import Transaccion
from app.models.animal import Animal
from app.models.control_sanitario import ControlSanitario
from app.schemas.transaccion import (
    TransaccionCreate,
    TransaccionUpdate,
    TransaccionResponse,
    TransaccionListResponse,
    ResumenFinanciero
)
from app.schemas.compra_animal import (
    CompraAnimalRequest,
    CompraAnimalResponse
)
from app.services.rules_engine import en_retiro_sanitario
from app.constants.rubro_venta import RUBRO_ANIMAL_SACRIFICIO, RUBRO_LECHE, resolver_rubro_venta
from app.constants.rubro_afectacion import RUBRO_CEBA, RUBRO_GENERAL, RUBRO_LECHE as RUBRO_GASTO_LECHE

router = APIRouter()


def _es_venta_sacrificio(tipo: str, rubro_venta: str | None, animal_id: int | None) -> bool:
    return tipo == "venta" and resolver_rubro_venta(tipo, rubro_venta, animal_id) == RUBRO_ANIMAL_SACRIFICIO


def _aplicar_salida_animal_venta(
    db: Session,
    animal: Animal,
    fecha_venta: date,
    concepto: str,
    finca_id: int,
) -> None:
    _validar_retiro_sanitario_venta(db, animal.id, finca_id, fecha_venta)
    animal.estado = "vendido"
    animal.fecha_salida = fecha_venta
    animal.motivo_salida = f"Venta para sacrificio - {concepto}"
    db.add(animal)


def _revertir_salida_animal(animal: Animal) -> None:
    if animal.estado == "vendido":
        animal.estado = "activo"
        animal.fecha_salida = None
        animal.motivo_salida = None


def _validar_retiro_sanitario_venta(db: Session, animal_id: int, finca_id: int, fecha_venta: date) -> None:
    ultimo_control = db.query(ControlSanitario).filter(
        ControlSanitario.animal_id == animal_id,
        ControlSanitario.finca_id == finca_id,
    ).order_by(ControlSanitario.fecha.desc()).first()
    if not ultimo_control:
        return

    retiro_carne_activo = en_retiro_sanitario(
        ultimo_control.fecha,
        ultimo_control.dias_retiro_carne,
        fecha_venta
    )

    if retiro_carne_activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede vender el animal: periodo de retiro sanitario de carne activo"
        )


@router.post("/compra-animal", response_model=CompraAnimalResponse, status_code=status.HTTP_201_CREATED)
def comprar_animal(
    *,
    db: Session = Depends(get_db),
    data: CompraAnimalRequest,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Crear un animal nuevo y registrar su compra en una sola operación atómica.
    Ideal para cuando compras un animal de otra finca.
    """
    # Validar que el número de identificación no exista
    existing = db.query(Animal).filter(
        Animal.finca_id == current_user.finca_id,
        Animal.numero_identificacion == data.animal.numero_identificacion
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un animal con identificación {data.animal.numero_identificacion} en tu finca"
        )
    
    try:
        # 1. Crear el animal
        animal_dict = data.animal.model_dump()
        
        new_animal = Animal(
            **animal_dict,
            finca_id=current_user.finca_id,
            estado="activo",
            fecha_ingreso=data.transaccion.fecha,
            tipo_adquisicion="comprado",
            ultima_fecha_pesaje=data.transaccion.fecha if data.animal.peso_actual else None
        )
        
        db.add(new_animal)
        db.flush()  # Para obtener el ID del animal antes del commit
        
        # 2. Crear la transacción de compra
        concepto = f"Compra de animal {data.animal.numero_identificacion}"
        if data.animal.nombre:
            concepto += f" - {data.animal.nombre}"
        
        transaccion = Transaccion(
            finca_id=current_user.finca_id,
            tipo="compra",
            fecha=data.transaccion.fecha,
            concepto=concepto,
            monto=data.transaccion.monto,
            animal_id=new_animal.id,
            numero_animales=data.transaccion.numero_animales,
            peso_total=data.transaccion.peso_total,
            precio_por_kg=data.transaccion.precio_por_kg,
            tercero=data.transaccion.tercero,
            documento_tercero=data.transaccion.documento_tercero,
            metodo_pago=data.transaccion.metodo_pago,
            observaciones=data.transaccion.observaciones,
            registrado_por=current_user.id
        )
        
        db.add(transaccion)
        db.commit()
        db.refresh(new_animal)
        db.refresh(transaccion)
        
        return CompraAnimalResponse(
            animal_id=new_animal.id,
            animal_numero_identificacion=new_animal.numero_identificacion,
            transaccion_id=transaccion.id,
            mensaje=f"Animal '{new_animal.numero_identificacion}' creado y compra registrada exitosamente"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear animal y transacción: {str(e)}"
        )


@router.post("/", response_model=TransaccionResponse, status_code=status.HTTP_201_CREATED)
def crear_transaccion(
    *,
    db: Session = Depends(get_db),
    transaccion_in: TransaccionCreate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Crear nueva transacción"""
    animal = None
    if transaccion_in.animal_id:
        animal = db.query(Animal).filter(
            Animal.id == transaccion_in.animal_id,
            Animal.finca_id == current_user.finca_id
        ).first()
        if not animal:
            raise HTTPException(status_code=404, detail="Animal no encontrado")

        if _es_venta_sacrificio(transaccion_in.tipo, transaccion_in.rubro_venta, transaccion_in.animal_id):
            _aplicar_salida_animal_venta(
                db, animal, transaccion_in.fecha, transaccion_in.concepto, current_user.finca_id
            )
        elif transaccion_in.tipo == "compra":
            if animal.estado != "activo":
                animal.estado = "activo"
                animal.fecha_salida = None
                animal.motivo_salida = None
                db.add(animal)
    
    db_transaccion = Transaccion(
        **transaccion_in.model_dump(),
        finca_id=current_user.finca_id,
        registrado_por=current_user.id,
    )
    if db_transaccion.tipo == "venta" and not db_transaccion.rubro_venta:
        db_transaccion.rubro_venta = resolver_rubro_venta(
            db_transaccion.tipo, db_transaccion.rubro_venta, db_transaccion.animal_id
        )
    
    db.add(db_transaccion)
    db.commit()
    db.refresh(db_transaccion)
    
    return TransaccionResponse(
        **db_transaccion.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None
    )


@router.get("/", response_model=TransaccionListResponse)
def listar_transacciones(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    tipo: str | None = Query(None),
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
    categoria_gasto: str | None = Query(None),
    rubro_venta: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
) -> Any:
    """Listar transacciones"""
    query = db.query(Transaccion).filter(
        Transaccion.finca_id == current_user.finca_id
    )
    
    if tipo:
        query = query.filter(Transaccion.tipo == tipo.lower())
    if fecha_desde:
        query = query.filter(Transaccion.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Transaccion.fecha <= fecha_hasta)
    if categoria_gasto:
        query = query.filter(Transaccion.categoria_gasto == categoria_gasto.lower())
    if rubro_venta:
        query = query.filter(Transaccion.rubro_venta == rubro_venta.lower())
    
    query = query.order_by(Transaccion.fecha.desc())
    total = query.count()
    transacciones = query.offset(skip).limit(limit).all()
    
    items = []
    for trans in transacciones:
        animal = None
        if trans.animal_id:
            animal = db.query(Animal).filter(Animal.id == trans.animal_id).first()
        items.append(TransaccionResponse(
            **trans.__dict__,
            animal_numero=animal.numero_identificacion if animal else None,
            animal_nombre=animal.nombre if animal else None
        ))
    
    return TransaccionListResponse(total=total, items=items, skip=skip, limit=limit)


@router.get("/resumen/financiero", response_model=ResumenFinanciero)
def obtener_resumen_financiero(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Obtener resumen financiero de la finca"""
    total_ventas = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "venta"
    ).scalar() or 0.0

    total_compras = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "compra"
    ).scalar() or 0.0

    total_gastos = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto"
    ).scalar() or 0.0

    primer_dia_mes = date.today().replace(day=1)
    ventas_mes = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "venta",
        Transaccion.fecha >= primer_dia_mes
    ).scalar() or 0.0

    gastos_mes = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto",
        Transaccion.fecha >= primer_dia_mes
    ).scalar() or 0.0

    gastos_por_cat = db.query(
        Transaccion.categoria_gasto,
        func.sum(Transaccion.monto).label("total")
    ).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto",
        Transaccion.categoria_gasto.isnot(None)
    ).group_by(Transaccion.categoria_gasto).all()

    gasto_por_categoria = {cat: float(total) for cat, total in gastos_por_cat}

    ventas_leche = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "venta",
        Transaccion.rubro_venta == RUBRO_LECHE,
    ).scalar() or 0.0

    ventas_animales = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "venta",
        Transaccion.rubro_venta == RUBRO_ANIMAL_SACRIFICIO,
    ).scalar() or 0.0

    ventas_otros = float(total_ventas) - float(ventas_leche) - float(ventas_animales)

    gastos_leche = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto",
        Transaccion.rubro_afectacion == RUBRO_GASTO_LECHE,
    ).scalar() or 0.0

    gastos_ceba = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto",
        Transaccion.rubro_afectacion == RUBRO_CEBA,
    ).scalar() or 0.0

    gastos_general = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto",
        (Transaccion.rubro_afectacion == RUBRO_GENERAL) | (Transaccion.rubro_afectacion.is_(None)),
    ).scalar() or 0.0

    return ResumenFinanciero(
        total_ventas=float(total_ventas),
        total_compras=float(total_compras),
        total_gastos=float(total_gastos),
        balance_neto=float(total_ventas - total_compras - total_gastos),
        ventas_mes_actual=float(ventas_mes),
        gastos_mes_actual=float(gastos_mes),
        gasto_por_categoria=gasto_por_categoria,
        ventas_leche=float(ventas_leche),
        ventas_animales=float(ventas_animales),
        ventas_otros=max(0.0, ventas_otros),
        gastos_leche=float(gastos_leche),
        gastos_ceba=float(gastos_ceba),
        gastos_general=float(gastos_general),
        margen_leche=float(ventas_leche) - float(gastos_leche),
        margen_ceba=float(ventas_animales) - float(gastos_ceba),
    )


@router.get("/{transaccion_id}", response_model=TransaccionResponse)
def obtener_transaccion(
    *,
    db: Session = Depends(get_db),
    transaccion_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Obtener una transacción"""
    trans = db.query(Transaccion).filter(
        Transaccion.id == transaccion_id,
        Transaccion.finca_id == current_user.finca_id
    ).first()
    
    if not trans:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    animal = None
    if trans.animal_id:
        animal = db.query(Animal).filter(Animal.id == trans.animal_id).first()
    
    return TransaccionResponse(
        **trans.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None
    )


@router.put("/{transaccion_id}", response_model=TransaccionResponse)
def actualizar_transaccion(
    *,
    db: Session = Depends(get_db),
    transaccion_id: int,
    transaccion_in: TransaccionUpdate,
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Actualizar transacción"""
    trans = db.query(Transaccion).filter(
        Transaccion.id == transaccion_id,
        Transaccion.finca_id == current_user.finca_id
    ).first()

    if not trans:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    old_tipo = trans.tipo
    old_animal_id = trans.animal_id
    old_rubro = trans.rubro_venta
    update_data = transaccion_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(trans, field, value)

    if trans.tipo == "venta" and not trans.rubro_venta:
        trans.rubro_venta = resolver_rubro_venta(trans.tipo, trans.rubro_venta, trans.animal_id)

    new_tipo = trans.tipo
    new_animal_id = trans.animal_id
    new_rubro = trans.rubro_venta

    if _es_venta_sacrificio(old_tipo, old_rubro, old_animal_id) and old_animal_id:
        if not _es_venta_sacrificio(new_tipo, new_rubro, new_animal_id) or old_animal_id != new_animal_id:
            old_animal = db.query(Animal).filter(
                Animal.id == old_animal_id,
                Animal.finca_id == current_user.finca_id,
            ).first()
            if old_animal:
                _revertir_salida_animal(old_animal)
                db.add(old_animal)

    if _es_venta_sacrificio(new_tipo, new_rubro, new_animal_id) and new_animal_id:
        animal = db.query(Animal).filter(
            Animal.id == new_animal_id,
            Animal.finca_id == current_user.finca_id,
        ).first()
        if not animal:
            raise HTTPException(status_code=404, detail="Animal no encontrado")
        _aplicar_salida_animal_venta(db, animal, trans.fecha, trans.concepto, current_user.finca_id)
    elif new_tipo == "compra" and new_animal_id:
        animal = db.query(Animal).filter(
            Animal.id == new_animal_id,
            Animal.finca_id == current_user.finca_id,
        ).first()
        if animal and animal.estado != "activo":
            animal.estado = "activo"
            animal.fecha_salida = None
            animal.motivo_salida = None
            db.add(animal)

    db.commit()
    db.refresh(trans)

    animal = None
    if trans.animal_id:
        animal = db.query(Animal).filter(Animal.id == trans.animal_id).first()
    
    return TransaccionResponse(
        **trans.__dict__,
        animal_numero=animal.numero_identificacion if animal else None,
        animal_nombre=animal.nombre if animal else None
    )


@router.delete("/{transaccion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_transaccion(
    *,
    db: Session = Depends(get_db),
    transaccion_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> None:
    """Eliminar transacción"""
    trans = db.query(Transaccion).filter(
        Transaccion.id == transaccion_id,
        Transaccion.finca_id == current_user.finca_id
    ).first()
    
    if not trans:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    # Si era venta de animal para sacrificio, revertir el estado del animal
    if _es_venta_sacrificio(trans.tipo, trans.rubro_venta, trans.animal_id) and trans.animal_id:
        animal = db.query(Animal).filter(Animal.id == trans.animal_id).first()
        if animal:
            _revertir_salida_animal(animal)
            db.add(animal)
    
    db.delete(trans)
    db.commit()
    return None
