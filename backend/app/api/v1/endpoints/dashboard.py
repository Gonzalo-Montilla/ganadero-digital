"""
Endpoints para Dashboard y Reportes
"""
from typing import Any
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.models.animal import Animal
from app.models.control_sanitario import ControlSanitario
from app.models.control_reproductivo import ControlReproductivo
from app.models.registro_produccion import RegistroProduccion
from app.models.transaccion import Transaccion
from app.schemas.dashboard import (
    DashboardCompleto,
    InventarioResumen,
    ControlSanitarioAlerta,
    ControlReproductivoResumen,
    ProduccionResumen,
    FinanzasResumen,
    AlertasResponse,
    AlertaGanadera
)

router = APIRouter()


@router.get("/", response_model=DashboardCompleto)
def obtener_dashboard_completo(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Obtener dashboard completo con todas las métricas de la finca
    """
    finca_id = current_user.finca_id
    
    # ========== INVENTARIO ==========
    total_animales = db.query(Animal).filter(Animal.finca_id == finca_id).count()
    hembras = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.sexo == "hembra"
    ).count()
    machos = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.sexo == "macho"
    ).count()
    
    # Por categoría
    terneros = db.query(Animal).filter(
        Animal.finca_id == finca_id,
        Animal.categoria.in_(["cria", "ternero"])
    ).count()
    novillas = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.categoria == "novilla"
    ).count()
    vacas = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.categoria == "vaca"
    ).count()
    toros = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.categoria == "toro"
    ).count()
    
    # Por estado
    activos = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.estado == "activo"
    ).count()
    vendidos = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.estado == "vendido"
    ).count()
    muertos = db.query(Animal).filter(
        Animal.finca_id == finca_id, Animal.estado == "muerto"
    ).count()
    
    inventario = InventarioResumen(
        total_animales=total_animales,
        hembras=hembras,
        machos=machos,
        terneros=terneros,
        novillas=novillas,
        vacas=vacas,
        toros=toros,
        animales_activos=activos,
        animales_vendidos=vendidos,
        animales_muertos=muertos
    )
    
    # ========== SANIDAD ==========
    hoy = date.today()
    dentro_30_dias = hoy + timedelta(days=30)
    
    proximas_vacunas = db.query(ControlSanitario).filter(
        ControlSanitario.finca_id == finca_id,
        ControlSanitario.tipo == "vacuna",
        ControlSanitario.proxima_dosis.isnot(None),
        ControlSanitario.proxima_dosis <= dentro_30_dias,
        ControlSanitario.proxima_dosis >= hoy
    ).count()
    
    sanidad = ControlSanitarioAlerta(
        proximas_vacunas=proximas_vacunas,
        proximos_tratamientos=0,
        animales_pendientes_desparasitar=0
    )
    
    # ========== REPRODUCCIÓN ==========
    # Obtener último diagnóstico de cada hembra
    ultimo_diagnostico_subquery = (
        db.query(
            ControlReproductivo.animal_id,
            func.max(ControlReproductivo.fecha_evento).label("ultima_fecha")
        )
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.tipo_evento == "diagnostico"
        )
        .group_by(ControlReproductivo.animal_id)
        .subquery()
    )
    
    hembras_prenadas = db.query(ControlReproductivo).join(
        ultimo_diagnostico_subquery,
        and_(
            ControlReproductivo.animal_id == ultimo_diagnostico_subquery.c.animal_id,
            ControlReproductivo.fecha_evento == ultimo_diagnostico_subquery.c.ultima_fecha
        )
    ).filter(ControlReproductivo.diagnostico == "prenada").count()
    
    hembras_vacias = db.query(ControlReproductivo).join(
        ultimo_diagnostico_subquery,
        and_(
            ControlReproductivo.animal_id == ultimo_diagnostico_subquery.c.animal_id,
            ControlReproductivo.fecha_evento == ultimo_diagnostico_subquery.c.ultima_fecha
        )
    ).filter(ControlReproductivo.diagnostico == "vacia").count()
    
    tasa_prenez = (hembras_prenadas / hembras * 100) if hembras > 0 else 0.0
    
    proximos_partos = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == finca_id,
        ControlReproductivo.fecha_probable_parto.isnot(None),
        ControlReproductivo.fecha_probable_parto <= dentro_30_dias,
        ControlReproductivo.fecha_probable_parto >= hoy
    ).count()
    
    hace_30_dias = hoy - timedelta(days=30)
    servicios_mes = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == finca_id,
        ControlReproductivo.tipo_evento == "servicio",
        ControlReproductivo.fecha_evento >= hace_30_dias
    ).count()
    
    reproduccion = ControlReproductivoResumen(
        hembras_prenadas=hembras_prenadas,
        hembras_vacias=hembras_vacias,
        tasa_prenez=round(tasa_prenez, 2),
        proximos_partos_30_dias=proximos_partos,
        servicios_mes_actual=servicios_mes
    )
    
    # ========== PRODUCCIÓN ==========
    produccion_hoy = db.query(func.sum(RegistroProduccion.cantidad_litros)).filter(
        RegistroProduccion.finca_id == finca_id,
        RegistroProduccion.tipo_produccion == "leche",
        RegistroProduccion.fecha == hoy
    ).scalar() or 0.0
    
    primer_dia_mes = hoy.replace(day=1)
    produccion_mes = db.query(func.sum(RegistroProduccion.cantidad_litros)).filter(
        RegistroProduccion.finca_id == finca_id,
        RegistroProduccion.tipo_produccion == "leche",
        RegistroProduccion.fecha >= primer_dia_mes
    ).scalar() or 0.0
    
    vacas_produccion = db.query(Animal).filter(
        Animal.finca_id == finca_id,
        Animal.sexo == "hembra",
        Animal.categoria.in_(["vaca", "novilla"]),
        Animal.estado == "activo"
    ).count()
    
    promedio = (produccion_hoy / vacas_produccion) if vacas_produccion > 0 else 0.0
    
    produccion = ProduccionResumen(
        produccion_leche_hoy=round(produccion_hoy, 2),
        produccion_leche_mes=round(produccion_mes, 2),
        promedio_litros_vaca=round(promedio, 2)
    )
    
    # ========== FINANZAS ==========
    ventas_mes = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == finca_id,
        Transaccion.tipo == "venta",
        Transaccion.fecha >= primer_dia_mes
    ).scalar() or 0.0
    
    gastos_mes = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == finca_id,
        Transaccion.tipo == "gasto",
        Transaccion.fecha >= primer_dia_mes
    ).scalar() or 0.0
    
    balance_mes = ventas_mes - gastos_mes
    
    total_ventas = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == finca_id, Transaccion.tipo == "venta"
    ).scalar() or 0.0
    
    total_gastos = db.query(func.sum(Transaccion.monto)).filter(
        Transaccion.finca_id == finca_id,
        Transaccion.tipo.in_(["gasto", "compra"])
    ).scalar() or 0.0
    
    balance_total = total_ventas - total_gastos
    
    finanzas = FinanzasResumen(
        ventas_mes=round(ventas_mes, 2),
        gastos_mes=round(gastos_mes, 2),
        balance_mes=round(balance_mes, 2),
        total_balance=round(balance_total, 2)
    )
    
    return DashboardCompleto(
        inventario=inventario,
        sanidad=sanidad,
        reproduccion=reproduccion,
        produccion=produccion,
        finanzas=finanzas,
        ultima_actualizacion=hoy
    )


@router.get("/alertas", response_model=AlertasResponse)
def obtener_alertas(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Obtener alertas importantes de la finca
    """
    finca_id = current_user.finca_id
    alertas = []
    
    hoy = date.today()
    dentro_15_dias = hoy + timedelta(days=15)
    
    # Alertas de vacunas próximas
    vacunas_proximas = db.query(ControlSanitario).filter(
        ControlSanitario.finca_id == finca_id,
        ControlSanitario.tipo == "vacuna",
        ControlSanitario.proxima_dosis.isnot(None),
        ControlSanitario.proxima_dosis <= dentro_15_dias,
        ControlSanitario.proxima_dosis >= hoy
    ).all()
    
    for vacuna in vacunas_proximas:
        animal = db.query(Animal).filter(Animal.id == vacuna.animal_id).first()
        if animal:
            dias_restantes = (vacuna.proxima_dosis - hoy).days
            prioridad = "alta" if dias_restantes <= 3 else "media"
            alertas.append(AlertaGanadera(
                tipo="vacuna",
                prioridad=prioridad,
                animal_id=animal.id,
                animal_numero=animal.numero_identificacion,
                animal_nombre=animal.nombre,
                mensaje=f"Vacuna/refuerzo pendiente: {vacuna.producto or 'N/A'}",
                fecha_limite=vacuna.proxima_dosis
            ))
    
    # Alertas de partos próximos
    partos_proximos = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == finca_id,
        ControlReproductivo.fecha_probable_parto.isnot(None),
        ControlReproductivo.fecha_probable_parto <= dentro_15_dias,
        ControlReproductivo.fecha_probable_parto >= hoy
    ).all()
    
    for parto in partos_proximos:
        animal = db.query(Animal).filter(Animal.id == parto.animal_id).first()
        if animal:
            dias_restantes = (parto.fecha_probable_parto - hoy).days
            prioridad = "alta" if dias_restantes <= 7 else "media"
            alertas.append(AlertaGanadera(
                tipo="parto",
                prioridad=prioridad,
                animal_id=animal.id,
                animal_numero=animal.numero_identificacion,
                animal_nombre=animal.nombre,
                mensaje=f"Parto próximo en {dias_restantes} días",
                fecha_limite=parto.fecha_probable_parto
            ))
    
    return AlertasResponse(
        total=len(alertas),
        alertas=alertas
    )
