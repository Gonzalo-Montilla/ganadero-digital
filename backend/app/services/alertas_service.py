"""
Servicio centralizado para calcular alertas ganaderas por finca.
"""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.control_reproductivo import ControlReproductivo
from app.models.control_sanitario import ControlSanitario
from app.schemas.dashboard import AlertaGanadera
from app.services.rules_engine import en_retiro_sanitario

EVENTOS_CIERRE_GESTACION = ("parto", "aborto")


def _ultimo_control_sanitario(db: Session, animal_id: int, finca_id: int) -> ControlSanitario | None:
    return (
        db.query(ControlSanitario)
        .filter(
            ControlSanitario.animal_id == animal_id,
            ControlSanitario.finca_id == finca_id,
        )
        .order_by(ControlSanitario.fecha.desc())
        .first()
    )


def _gestacion_activa(db: Session, registro: ControlReproductivo, finca_id: int) -> bool:
    """True si el registro con fecha probable de parto aún no fue cerrado por parto/aborto."""
    cierre = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.animal_id == registro.animal_id,
            ControlReproductivo.tipo_evento.in_(EVENTOS_CIERRE_GESTACION),
            ControlReproductivo.fecha_evento > registro.fecha_evento,
        )
        .first()
    )
    return cierre is None


def contar_partos_activos_en_rango(
    db: Session, finca_id: int, hoy: date, dias_adelante: int
) -> int:
    limite = hoy + timedelta(days=dias_adelante)
    candidatos = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.fecha_probable_parto.isnot(None),
            ControlReproductivo.fecha_probable_parto >= hoy,
            ControlReproductivo.fecha_probable_parto <= limite,
        )
        .all()
    )
    return sum(1 for reg in candidatos if _gestacion_activa(db, reg, finca_id))


def _ultimos_diagnosticos_vacias_antiguas(
    db: Session, finca_id: int, hoy: date, dias_minimos: int = 120
) -> list[ControlReproductivo]:
    umbral = hoy - timedelta(days=dias_minimos)
    subq = (
        db.query(
            ControlReproductivo.animal_id,
            func.max(ControlReproductivo.fecha_evento).label("max_fecha"),
        )
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.tipo_evento == "diagnostico",
        )
        .group_by(ControlReproductivo.animal_id)
        .subquery()
    )
    return (
        db.query(ControlReproductivo)
        .join(
            subq,
            and_(
                ControlReproductivo.animal_id == subq.c.animal_id,
                ControlReproductivo.fecha_evento == subq.c.max_fecha,
            ),
        )
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.diagnostico == "vacia",
            ControlReproductivo.fecha_evento <= umbral,
        )
        .all()
    )


def obtener_alertas_finca(db: Session, finca_id: int, hoy: date | None = None) -> list[AlertaGanadera]:
    hoy = hoy or date.today()
    dentro_15_dias = hoy + timedelta(days=15)
    alertas: list[AlertaGanadera] = []
    alertas_retiro_vistas: set[int] = set()

    vacunas_proximas = db.query(ControlSanitario).filter(
        ControlSanitario.finca_id == finca_id,
        ControlSanitario.tipo == "vacuna",
        ControlSanitario.proxima_dosis.isnot(None),
        ControlSanitario.proxima_dosis <= dentro_15_dias,
        ControlSanitario.proxima_dosis >= hoy,
    ).all()

    for vacuna in vacunas_proximas:
        animal = db.query(Animal).filter(
            Animal.id == vacuna.animal_id,
            Animal.finca_id == finca_id,
        ).first()
        if not animal or animal.estado != "activo":
            continue
        dias_restantes = (vacuna.proxima_dosis - hoy).days
        prioridad = "alta" if dias_restantes <= 3 else "media"
        alertas.append(
            AlertaGanadera(
                tipo="vacuna",
                prioridad=prioridad,
                animal_id=animal.id,
                animal_numero=animal.numero_identificacion,
                animal_nombre=animal.nombre,
                mensaje=f"Vacuna/refuerzo pendiente: {vacuna.producto or 'N/A'}",
                fecha_limite=vacuna.proxima_dosis,
            )
        )

    partos_candidatos = db.query(ControlReproductivo).filter(
        ControlReproductivo.finca_id == finca_id,
        ControlReproductivo.fecha_probable_parto.isnot(None),
        ControlReproductivo.fecha_probable_parto <= dentro_15_dias,
        ControlReproductivo.fecha_probable_parto >= hoy,
    ).all()

    for parto in partos_candidatos:
        if not _gestacion_activa(db, parto, finca_id):
            continue
        animal = db.query(Animal).filter(
            Animal.id == parto.animal_id,
            Animal.finca_id == finca_id,
        ).first()
        if not animal or animal.estado != "activo":
            continue
        dias_restantes = (parto.fecha_probable_parto - hoy).days
        prioridad = "alta" if dias_restantes <= 7 else "media"
        alertas.append(
            AlertaGanadera(
                tipo="parto",
                prioridad=prioridad,
                animal_id=animal.id,
                animal_numero=animal.numero_identificacion,
                animal_nombre=animal.nombre,
                mensaje=f"Parto proximo en {dias_restantes} dias",
                fecha_limite=parto.fecha_probable_parto,
            )
        )

    for registro in _ultimos_diagnosticos_vacias_antiguas(db, finca_id, hoy):
        animal = db.query(Animal).filter(
            Animal.id == registro.animal_id,
            Animal.finca_id == finca_id,
        ).first()
        if not animal or animal.estado != "activo" or animal.sexo != "hembra":
            continue
        alertas.append(
            AlertaGanadera(
                tipo="dias_abiertos",
                prioridad="media",
                animal_id=animal.id,
                animal_numero=animal.numero_identificacion,
                animal_nombre=animal.nombre,
                mensaje="Hembra con demasiados dias abiertos; revisar plan reproductivo",
                fecha_limite=None,
            )
        )

    animal_ids_retiro = (
        db.query(ControlSanitario.animal_id)
        .filter(
            ControlSanitario.finca_id == finca_id,
            ControlSanitario.animal_id.isnot(None),
        )
        .distinct()
        .all()
    )

    for (animal_id,) in animal_ids_retiro:
        if animal_id in alertas_retiro_vistas:
            continue
        ultimo = _ultimo_control_sanitario(db, animal_id, finca_id)
        if not ultimo:
            continue
        if not (
            en_retiro_sanitario(ultimo.fecha, ultimo.dias_retiro_carne, hoy)
            or en_retiro_sanitario(ultimo.fecha, ultimo.dias_retiro_leche, hoy)
        ):
            continue
        animal = db.query(Animal).filter(
            Animal.id == animal_id,
            Animal.finca_id == finca_id,
        ).first()
        if not animal or animal.estado != "activo":
            continue
        alertas_retiro_vistas.add(animal_id)
        alertas.append(
            AlertaGanadera(
                tipo="retiro_sanitario",
                prioridad="alta",
                animal_id=animal.id,
                animal_numero=animal.numero_identificacion,
                animal_nombre=animal.nombre,
                mensaje="Animal en periodo de retiro sanitario activo (venta/ordeno restringido)",
                fecha_limite=ultimo.fecha,
            )
        )

    prioridad_orden = {"alta": 0, "media": 1, "baja": 2}
    alertas.sort(key=lambda item: (prioridad_orden.get(item.prioridad, 9), item.fecha_limite or hoy))
    return alertas
