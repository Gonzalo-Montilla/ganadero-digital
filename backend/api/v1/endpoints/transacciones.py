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

router = APIRouter()


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
        
        # Si es una VENTA, actualizar estado del animal a vendido
        if transaccion_in.tipo == "venta":
            animal.estado = "vendido"
            animal.fecha_salida = transaccion_in.fecha
            animal.motivo_salida = f"Venta - {transaccion_in.concepto}"
            db.add(animal)
        
        # Si es una COMPRA, asegurarse que esté activo
        elif transaccion_in.tipo == "compra":
            if animal.estado != "activo":
                animal.estado = "activo"
                animal.fecha_salida = None
                animal.motivo_salida = None
                db.add(animal)
    
    db_transaccion = Transaccion(
        **transaccion_in.model_dump(),
        finca_id=current_user.finca_id,
        registrado_por=current_user.id
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
    
    for field, value in transaccion_in.model_dump(exclude_unset=True).items():
        setattr(trans, field, value)
    
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
    
    # Si era una VENTA con animal, revertir el estado del animal
    if trans.tipo == "venta" and trans.animal_id:
        animal = db.query(Animal).filter(Animal.id == trans.animal_id).first()
        if animal and animal.estado == "vendido":
            animal.estado = "activo"
            animal.fecha_salida = None
            animal.motivo_salida = None
            db.add(animal)
    
    db.delete(trans)
    db.commit()
    return None


@router.get("/resumen/financiero", response_model=ResumenFinanciero)
def obtener_resumen_financiero(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """Obtener resumen financiero de la finca"""
    # Total ventas
    total_ventas = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "venta"
    ).scalar() or 0.0
    
    # Total compras
    total_compras = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "compra"
    ).scalar() or 0.0
    
    # Total gastos
    total_gastos = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto"
    ).scalar() or 0.0
    
    # Mes actual
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
    
    # Gastos por categoría
    gastos_por_cat = db.query(
        Transaccion.categoria_gasto,
        func.sum(Transaccion.monto).label("total")
    ).filter(
        Transaccion.finca_id == current_user.finca_id,
        Transaccion.tipo == "gasto",
        Transaccion.categoria_gasto.isnot(None)
    ).group_by(Transaccion.categoria_gasto).all()
    
    gasto_por_categoria = {cat: float(total) for cat, total in gastos_por_cat}
    
    return ResumenFinanciero(
        total_ventas=float(total_ventas),
        total_compras=float(total_compras),
        total_gastos=float(total_gastos),
        balance_neto=float(total_ventas - total_compras - total_gastos),
        ventas_mes_actual=float(ventas_mes),
        gastos_mes_actual=float(gastos_mes),
        gasto_por_categoria=gasto_por_categoria
    )
