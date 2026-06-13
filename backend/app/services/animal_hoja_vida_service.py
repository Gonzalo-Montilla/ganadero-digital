"""
Hoja de vida reproductiva: genealogía legible, descendencia y eventos.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.control_reproductivo import ControlReproductivo
from app.schemas.hoja_vida import (
    AnimalResumenGenealogia,
    EventoHojaVidaReproductiva,
    HojaVidaReproductivaResponse,
)


def _resumen(animal: Animal | None) -> AnimalResumenGenealogia | None:
    if not animal:
        return None
    return AnimalResumenGenealogia(
        id=animal.id,
        numero_identificacion=animal.numero_identificacion,
        nombre=animal.nombre,
        sexo=animal.sexo,
        fecha_nacimiento=animal.fecha_nacimiento,
    )


def _crias_en_fecha(
    crias: list[Animal],
    fecha_evento,
) -> list[AnimalResumenGenealogia]:
    return [
        _resumen(c)
        for c in crias
        if c.fecha_nacimiento == fecha_evento and _resumen(c) is not None
    ]


def build_hoja_vida_reproductiva(
    db: Session,
    animal: Animal,
    finca_id: int,
) -> HojaVidaReproductivaResponse:
    madre = None
    padre = None
    if animal.madre_id:
        madre = _resumen(
            db.query(Animal).filter(
                Animal.id == animal.madre_id,
                Animal.finca_id == finca_id,
            ).first()
        )
    if animal.padre_id:
        padre = _resumen(
            db.query(Animal).filter(
                Animal.id == animal.padre_id,
                Animal.finca_id == finca_id,
            ).first()
        )

    crias_en_inventario = [
        r
        for c in (
            db.query(Animal)
            .filter(
                Animal.finca_id == finca_id,
                Animal.madre_id == animal.id,
                Animal.estado != "eliminado",
            )
            .order_by(Animal.fecha_nacimiento.desc())
            .all()
        )
        if (r := _resumen(c)) is not None
    ]

    progenie_como_padre = [
        r
        for c in (
            db.query(Animal)
            .filter(
                Animal.finca_id == finca_id,
                Animal.padre_id == animal.id,
                Animal.estado != "eliminado",
            )
            .order_by(Animal.fecha_nacimiento.desc())
            .all()
        )
        if (r := _resumen(c)) is not None
    ]

    eventos: list[EventoHojaVidaReproductiva] = []

    if animal.sexo == "hembra":
        registros = (
            db.query(ControlReproductivo)
            .filter(
                ControlReproductivo.finca_id == finca_id,
                ControlReproductivo.animal_id == animal.id,
            )
            .order_by(ControlReproductivo.fecha_evento.desc())
            .all()
        )
        for registro in registros:
            toro = None
            if registro.toro_id:
                toro = db.query(Animal).filter(Animal.id == registro.toro_id).first()
            crias_parto: list[AnimalResumenGenealogia] = []
            if registro.tipo_evento == "parto":
                crias_parto = _crias_en_fecha(
                    db.query(Animal)
                    .filter(
                        Animal.finca_id == finca_id,
                        Animal.madre_id == animal.id,
                        Animal.estado != "eliminado",
                    )
                    .all(),
                    registro.fecha_evento,
                )
            eventos.append(
                EventoHojaVidaReproductiva(
                    id=registro.id,
                    tipo_evento=registro.tipo_evento,
                    fecha_evento=registro.fecha_evento,
                    diagnostico=registro.diagnostico,
                    tipo_servicio=registro.tipo_servicio,
                    toro_numero=toro.numero_identificacion if toro else None,
                    toro_nombre=toro.nombre if toro else registro.toro_pajuela,
                    numero_crias=registro.numero_crias,
                    tipo_parto=registro.tipo_parto,
                    facilidad_parto=registro.facilidad_parto,
                    vitalidad_cria=registro.vitalidad_cria,
                    crias_registradas=crias_parto,
                )
            )
    else:
        registros = (
            db.query(ControlReproductivo)
            .filter(
                ControlReproductivo.finca_id == finca_id,
                ControlReproductivo.toro_id == animal.id,
            )
            .order_by(ControlReproductivo.fecha_evento.desc())
            .all()
        )
        for registro in registros:
            hembra = db.query(Animal).filter(Animal.id == registro.animal_id).first()
            crias_parto = []
            if registro.tipo_evento == "parto" and hembra:
                crias_parto = _crias_en_fecha(
                    db.query(Animal)
                    .filter(
                        Animal.finca_id == finca_id,
                        Animal.madre_id == hembra.id,
                        Animal.padre_id == animal.id,
                        Animal.estado != "eliminado",
                    )
                    .all(),
                    registro.fecha_evento,
                )
            eventos.append(
                EventoHojaVidaReproductiva(
                    id=registro.id,
                    tipo_evento=registro.tipo_evento,
                    fecha_evento=registro.fecha_evento,
                    diagnostico=registro.diagnostico,
                    tipo_servicio=registro.tipo_servicio,
                    hembra_numero=hembra.numero_identificacion if hembra else None,
                    hembra_nombre=hembra.nombre if hembra else None,
                    numero_crias=registro.numero_crias,
                    tipo_parto=registro.tipo_parto,
                    facilidad_parto=registro.facilidad_parto,
                    vitalidad_cria=registro.vitalidad_cria,
                    crias_registradas=crias_parto,
                )
            )

    return HojaVidaReproductivaResponse(
        madre=madre,
        padre=padre,
        crias_en_inventario=crias_en_inventario,
        progenie_como_padre=progenie_como_padre,
        eventos=eventos,
    )
