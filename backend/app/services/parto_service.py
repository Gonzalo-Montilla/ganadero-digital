"""
Alta de crías en inventario al registrar un parto.
"""
from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.control_reproductivo import ControlReproductivo
from app.schemas.control_reproductivo import CriaPartoInventario, CriaCreadaResponse


VITALIDADES_INVENTARIO = frozenset({"viva", "debil"})


def resolver_padre_id(
    db: Session,
    finca_id: int,
    madre_id: int,
    fecha_parto: date,
    toro_id_explicit: int | None,
) -> int | None:
    if toro_id_explicit:
        return toro_id_explicit

    servicio = (
        db.query(ControlReproductivo)
        .filter(
            ControlReproductivo.finca_id == finca_id,
            ControlReproductivo.animal_id == madre_id,
            ControlReproductivo.tipo_evento == "servicio",
            ControlReproductivo.fecha_evento <= fecha_parto,
        )
        .order_by(ControlReproductivo.fecha_evento.desc())
        .first()
    )
    return servicio.toro_id if servicio else None


def sintetizar_resumen_parto(
    crias: list[CriaPartoInventario],
) -> tuple[int, str | None, float | None, str | None]:
    numero = len(crias)
    sexos = {c.sexo for c in crias if c.sexo}
    if len(sexos) > 1:
        sexo_cria = "multiple"
    elif len(sexos) == 1:
        sexo_cria = next(iter(sexos))
    else:
        sexo_cria = None

    vitalidades = [c.vitalidad for c in crias]
    if vitalidades and all(v == "muerta" for v in vitalidades):
        vitalidad_cria = "muerta"
    elif any(v == "debil" for v in vitalidades):
        vitalidad_cria = "debil"
    elif any(v == "viva" for v in vitalidades):
        vitalidad_cria = "viva"
    else:
        vitalidad_cria = None

    pesos = [c.peso_nacimiento for c in crias if c.peso_nacimiento is not None]
    peso_cria = round(sum(pesos) / len(pesos), 2) if pesos else None

    return numero, sexo_cria, peso_cria, vitalidad_cria


def validar_crias_parto(crias: list[CriaPartoInventario]) -> None:
    if not crias:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Debe indicar al menos una cría en el parto",
        )

    chapetas: set[str] = set()
    for idx, cria in enumerate(crias, start=1):
        if cria.vitalidad not in {"viva", "muerta", "debil"}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Cría {idx}: vitalidad inválida",
            )
        if cria.vitalidad in VITALIDADES_INVENTARIO:
            if not cria.numero_identificacion or not cria.numero_identificacion.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Cría {idx}: la chapeta es obligatoria para crías vivas o débiles",
                )
            if not cria.sexo:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Cría {idx}: el sexo es obligatorio para crías vivas o débiles",
                )
            chapeta = cria.numero_identificacion.strip()
            if chapeta in chapetas:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Cría {idx}: chapeta duplicada en el mismo parto",
                )
            chapetas.add(chapeta)


def crear_animales_desde_parto(
    db: Session,
    *,
    finca_id: int,
    parto_id: int,
    madre: Animal,
    padre_id: int | None,
    fecha_parto: date,
    crias: list[CriaPartoInventario],
) -> list[CriaCreadaResponse]:
    validar_crias_parto(crias)
    creadas: list[CriaCreadaResponse] = []

    for cria in crias:
        if cria.vitalidad not in VITALIDADES_INVENTARIO:
            continue

        chapeta = cria.numero_identificacion.strip()
        existe = (
            db.query(Animal)
            .filter(
                Animal.finca_id == finca_id,
                Animal.numero_identificacion == chapeta,
            )
            .first()
        )
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un animal con chapeta {chapeta}",
            )

        categoria = "ternero" if cria.sexo == "macho" else "cria"
        nota = f"Nacimiento registrado desde parto #{parto_id}."
        if cria.observaciones:
            nota = f"{cria.observaciones.strip()} {nota}"

        nuevo = Animal(
            finca_id=finca_id,
            numero_identificacion=chapeta,
            nombre=cria.nombre,
            sexo=cria.sexo,
            fecha_nacimiento=fecha_parto,
            raza=cria.raza or madre.raza,
            color=cria.color or madre.color,
            madre_id=madre.id,
            padre_id=padre_id,
            peso_nacimiento=cria.peso_nacimiento,
            peso_actual=cria.peso_nacimiento,
            tipo_adquisicion="nacido_finca",
            fecha_ingreso=fecha_parto,
            finca_origen=None,
            estado="activo",
            categoria=categoria,
            proposito=cria.proposito or madre.proposito or "carne",
            lote_actual=cria.lote_actual or madre.lote_actual,
            potrero_actual=cria.potrero_actual or madre.potrero_actual,
            observaciones=nota,
        )
        db.add(nuevo)
        db.flush()
        creadas.append(
            CriaCreadaResponse(
                id=nuevo.id,
                numero_identificacion=nuevo.numero_identificacion,
                sexo=nuevo.sexo,
                nombre=nuevo.nombre,
            )
        )

    return creadas
