"""
Registro de pesajes y detección de animales listos para faena.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.historial_pesaje import HistorialPesaje

PESO_OBJETIVO_DEFAULT = 420.0
PESO_OBJETIVO_NOVILLA = 380.0


def peso_objetivo_faena(animal: Animal) -> float:
    cat = (animal.categoria or "").lower()
    if cat in ("novilla", "vaquillona", "ternera"):
        return PESO_OBJETIVO_NOVILLA
    return PESO_OBJETIVO_DEFAULT


def registrar_pesaje(
    db: Session,
    *,
    animal: Animal,
    finca_id: int,
    fecha: date,
    peso_kg: float,
    observaciones: str | None,
    registrado_por: int | None,
) -> HistorialPesaje:
    if animal.peso_actual:
        animal.peso_anterior = animal.peso_actual
    animal.peso_actual = peso_kg
    animal.ultima_fecha_pesaje = fecha
    db.add(animal)

    registro = HistorialPesaje(
        finca_id=finca_id,
        animal_id=animal.id,
        fecha=fecha,
        peso_kg=peso_kg,
        observaciones=observaciones,
        registrado_por=registrado_por,
    )
    db.add(registro)
    return registro


def calcular_ganancia_kg_dia(db: Session, animal_id: int) -> float | None:
    ultimos = (
        db.query(HistorialPesaje)
        .filter(HistorialPesaje.animal_id == animal_id)
        .order_by(HistorialPesaje.fecha.desc())
        .limit(2)
        .all()
    )
    if len(ultimos) < 2:
        return None
    reciente, anterior = ultimos[0], ultimos[1]
    dias = (reciente.fecha - anterior.fecha).days
    if dias <= 0:
        return None
    return round((reciente.peso_kg - anterior.peso_kg) / dias, 3)


def es_candidato_faena(animal: Animal) -> bool:
    if animal.estado != "activo" or not animal.peso_actual:
        return False
    proposito = (animal.proposito or "").lower()
    if proposito == "leche":
        return False
    return float(animal.peso_actual) >= peso_objetivo_faena(animal)


def listar_candidatos_faena(db: Session, finca_id: int) -> list[Animal]:
    animales = (
        db.query(Animal)
        .filter(
            Animal.finca_id == finca_id,
            Animal.estado == "activo",
            Animal.peso_actual.isnot(None),
        )
        .all()
    )
    return [a for a in animales if es_candidato_faena(a)]
