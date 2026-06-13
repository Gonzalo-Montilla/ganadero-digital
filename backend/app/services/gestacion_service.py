"""
Reglas de alertas y cierre de gestación reproductiva.
"""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.control_reproductivo import ControlReproductivo

EVENTOS_CIERRE_GESTACION = ("parto", "aborto")
DIAS_MINIMOS_POST_PARTO = 120


def gestacion_cerrada_tras_registro(
    db: Session,
    registro: ControlReproductivo,
    finca_id: int,
) -> bool:
    """True si la gestación asociada al registro ya fue cerrada."""
    cierre_parto = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.animal_id == registro.animal_id,
            ControlReproductivo.tipo_evento.in_(EVENTOS_CIERRE_GESTACION),
            ControlReproductivo.fecha_evento > registro.fecha_evento,
        )
        .first()
    )
    if cierre_parto:
        return True

    diagnostico_cierre = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.animal_id == registro.animal_id,
            ControlReproductivo.tipo_evento == "diagnostico",
            ControlReproductivo.diagnostico.in_(("vacia", "dudosa")),
            ControlReproductivo.fecha_evento > registro.fecha_evento,
        )
        .first()
    )
    return diagnostico_cierre is not None


def gestacion_activa(db: Session, registro: ControlReproductivo, finca_id: int) -> bool:
    return not gestacion_cerrada_tras_registro(db, registro, finca_id)


def hembrana_en_gestacion_activa(db: Session, animal_id: int, finca_id: int) -> bool:
    candidatos = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.animal_id == animal_id,
            ControlReproductivo.fecha_probable_parto.isnot(None),
            ControlReproductivo.tipo_evento == "diagnostico",
            ControlReproductivo.diagnostico == "prenada",
        )
        .all()
    )
    return any(gestacion_activa(db, registro, finca_id) for registro in candidatos)


def parto_reciente(db: Session, animal_id: int, finca_id: int, hoy: date) -> bool:
    ultimo_parto = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.animal_id == animal_id,
            ControlReproductivo.tipo_evento == "parto",
        )
        .order_by(ControlReproductivo.fecha_evento.desc())
        .first()
    )
    if not ultimo_parto:
        return False
    return (hoy - ultimo_parto.fecha_evento).days < DIAS_MINIMOS_POST_PARTO


def contar_partos_confirmados_en_rango(
    db: Session,
    finca_id: int,
    hoy: date,
    dias_adelante: int,
) -> int:
    limite = hoy + timedelta(days=dias_adelante)
    candidatos = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.tipo_evento == "diagnostico",
            ControlReproductivo.diagnostico == "prenada",
            ControlReproductivo.fecha_probable_parto.isnot(None),
            ControlReproductivo.fecha_probable_parto >= hoy,
            ControlReproductivo.fecha_probable_parto <= limite,
        )
        .all()
    )
    return sum(1 for reg in candidatos if gestacion_activa(db, reg, finca_id))
