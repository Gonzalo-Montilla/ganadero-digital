"""
Agregaciones para gráficas del módulo Métricas.
"""
from __future__ import annotations

from calendar import monthrange
from collections import defaultdict
from datetime import date

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.control_reproductivo import ControlReproductivo
from app.models.registro_produccion import RegistroProduccion
from app.models.transaccion import Transaccion
from app.schemas.metricas import (
    DistribucionItem,
    MetricasGraficas,
    PuntoFinanzas,
    PuntoProduccion,
    PuntoReproductivo,
)

MESES_ES = ("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")

CATEGORIA_LABELS = {
    "ternero": "Terneros",
    "cria": "Cría",
    "novilla": "Novillas",
    "vaca": "Vacas",
    "toro": "Toros",
    "novillo": "Novillos",
}

ESTADO_LABELS = {
    "activo": "Activos",
    "vendido": "Vendidos",
    "muerto": "Muertos",
    "transferido": "Transferidos",
    "eliminado": "Eliminados",
}


def _add_months(base: date, delta: int) -> date:
    month_index = base.month - 1 + delta
    year = base.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _iter_month_buckets(meses: int, hoy: date | None = None):
    hoy = hoy or date.today()
    inicio_periodo = _add_months(hoy.replace(day=1), -(meses - 1))
    for offset in range(meses):
        first = _add_months(inicio_periodo, offset)
        last_day = monthrange(first.year, first.month)[1]
        last = date(first.year, first.month, last_day)
        etiqueta = f"{MESES_ES[first.month - 1]} {first.year}"
        mes_key = f"{first.year:04d}-{first.month:02d}"
        yield etiqueta, mes_key, first, last


def _inventario_categorias(db: Session, finca_id: int) -> list[DistribucionItem]:
    animales = (
        db.query(Animal.categoria)
        .filter(Animal.finca_id == finca_id, Animal.estado == "activo")
        .all()
    )
    conteo: dict[str, int] = defaultdict(int)
    for (categoria,) in animales:
        key = (categoria or "sin_categoria").lower()
        label = CATEGORIA_LABELS.get(key, categoria.capitalize() if categoria else "Sin categoría")
        conteo[label] += 1
    return [DistribucionItem(nombre=k, valor=v) for k, v in sorted(conteo.items(), key=lambda x: -x[1])]


def _inventario_estados(db: Session, finca_id: int) -> list[DistribucionItem]:
    animales = db.query(Animal.estado).filter(Animal.finca_id == finca_id).all()
    conteo: dict[str, int] = defaultdict(int)
    for (estado,) in animales:
        key = (estado or "desconocido").lower()
        label = ESTADO_LABELS.get(key, key.capitalize())
        conteo[label] += 1
    return [DistribucionItem(nombre=k, valor=v) for k, v in sorted(conteo.items(), key=lambda x: -x[1])]


def _series_finanzas(db: Session, finca_id: int, meses: int, hoy: date) -> list[PuntoFinanzas]:
    buckets = list(_iter_month_buckets(meses, hoy))
    if not buckets:
        return []

    desde = buckets[0][2]
    transacciones = (
        db.query(Transaccion.fecha, Transaccion.tipo, Transaccion.monto)
        .filter(Transaccion.finca_id == finca_id, Transaccion.fecha >= desde)
        .all()
    )

    acumulado: dict[str, dict[str, float]] = defaultdict(lambda: {"ventas": 0.0, "gastos": 0.0, "compras": 0.0})
    for fecha, tipo, monto in transacciones:
        if not fecha:
            continue
        mes_key = f"{fecha.year:04d}-{fecha.month:02d}"
        if tipo == "venta":
            acumulado[mes_key]["ventas"] += float(monto or 0)
        elif tipo == "gasto":
            acumulado[mes_key]["gastos"] += float(monto or 0)
        elif tipo == "compra":
            acumulado[mes_key]["compras"] += float(monto or 0)

    puntos: list[PuntoFinanzas] = []
    for etiqueta, mes_key, _, _ in buckets:
        data = acumulado[mes_key]
        ventas = round(data["ventas"], 2)
        gastos = round(data["gastos"], 2)
        compras = round(data["compras"], 2)
        puntos.append(
            PuntoFinanzas(
                etiqueta=etiqueta,
                mes=mes_key,
                ventas=ventas,
                gastos=gastos,
                compras=compras,
                balance=round(ventas - gastos - compras, 2),
            )
        )
    return puntos


def _series_produccion(db: Session, finca_id: int, meses: int, hoy: date) -> list[PuntoProduccion]:
    buckets = list(_iter_month_buckets(meses, hoy))
    if not buckets:
        return []

    desde = buckets[0][2]
    registros = (
        db.query(RegistroProduccion.fecha, RegistroProduccion.cantidad_litros)
        .filter(
            RegistroProduccion.finca_id == finca_id,
            RegistroProduccion.tipo_produccion == "leche",
            RegistroProduccion.fecha >= desde,
        )
        .all()
    )

    litros_por_mes: dict[str, float] = defaultdict(float)
    for fecha, litros in registros:
        if not fecha:
            continue
        mes_key = f"{fecha.year:04d}-{fecha.month:02d}"
        litros_por_mes[mes_key] += float(litros or 0)

    return [
        PuntoProduccion(
            etiqueta=etiqueta,
            mes=mes_key,
            litros=round(litros_por_mes[mes_key], 2),
        )
        for etiqueta, mes_key, _, _ in buckets
    ]


def _series_reproductivo(db: Session, finca_id: int, meses: int, hoy: date) -> list[PuntoReproductivo]:
    buckets = list(_iter_month_buckets(meses, hoy))
    if not buckets:
        return []

    desde = buckets[0][2]
    registros = (
        db.query(ControlReproductivo.fecha_evento, ControlReproductivo.tipo_evento)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.fecha_evento >= desde,
            ControlReproductivo.tipo_evento.in_(["servicio", "parto"]),
        )
        .all()
    )

    servicios: dict[str, int] = defaultdict(int)
    partos: dict[str, int] = defaultdict(int)
    for fecha_evento, tipo_evento in registros:
        if not fecha_evento:
            continue
        mes_key = f"{fecha_evento.year:04d}-{fecha_evento.month:02d}"
        if tipo_evento == "servicio":
            servicios[mes_key] += 1
        elif tipo_evento == "parto":
            partos[mes_key] += 1

    return [
        PuntoReproductivo(
            etiqueta=etiqueta,
            mes=mes_key,
            servicios=servicios[mes_key],
            partos=partos[mes_key],
        )
        for etiqueta, mes_key, _, _ in buckets
    ]


def obtener_metricas_graficas(
    db: Session,
    finca_id: int,
    meses: int = 6,
    hoy: date | None = None,
) -> MetricasGraficas:
    hoy = hoy or date.today()
    meses = max(3, min(meses, 12))

    return MetricasGraficas(
        meses=meses,
        inventario_categorias=_inventario_categorias(db, finca_id),
        inventario_estados=_inventario_estados(db, finca_id),
        finanzas=_series_finanzas(db, finca_id, meses, hoy),
        produccion=_series_produccion(db, finca_id, meses, hoy),
        reproductivo=_series_reproductivo(db, finca_id, meses, hoy),
    )
