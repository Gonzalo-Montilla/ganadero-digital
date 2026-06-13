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

from app.services.gestacion_service import (

    contar_partos_confirmados_en_rango,

    gestacion_activa,

    hembrana_en_gestacion_activa,

    parto_reciente,

)

from app.services.rules_engine import en_retiro_sanitario



# Ventanas de alerta (días antes de la fecha límite; vencidas siempre entran)

DIAS_ALERTA_VACUNA = 3

DIAS_ALERTA_PARTO = 7

DIAS_VENCIDA_PRIORIDAD_ALTA = 1  # hoy, mañana o ya venció → alta





def contar_partos_activos_en_rango(

    db: Session, finca_id: int, hoy: date, dias_adelante: int

) -> int:

    """Compatibilidad con dashboard/estadísticas — solo preñeces confirmadas."""

    return contar_partos_confirmados_en_rango(db, finca_id, hoy, dias_adelante)





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

    limite_vacunas = hoy + timedelta(days=DIAS_ALERTA_VACUNA)

    limite_partos = hoy + timedelta(days=DIAS_ALERTA_PARTO)

    alertas: list[AlertaGanadera] = []

    alertas_retiro_vistas: set[int] = set()

    alertas_parto_por_animal: set[int] = set()



    vacunas_proximas = db.query(ControlSanitario).filter(

        ControlSanitario.finca_id == finca_id,

        ControlSanitario.tipo == "vacuna",

        ControlSanitario.proxima_dosis.isnot(None),

        ControlSanitario.proxima_dosis <= limite_vacunas,

    ).all()



    for vacuna in vacunas_proximas:

        animal = db.query(Animal).filter(

            Animal.id == vacuna.animal_id,

            Animal.finca_id == finca_id,

        ).first()

        if not animal or animal.estado != "activo":

            continue

        dias_restantes = (vacuna.proxima_dosis - hoy).days

        prioridad = "alta" if dias_restantes <= DIAS_VENCIDA_PRIORIDAD_ALTA else "media"

        if dias_restantes < 0:

            mensaje = f"Vacuna/refuerzo vencido: {vacuna.producto or 'N/A'}"

        else:

            mensaje = f"Vacuna/refuerzo pendiente: {vacuna.producto or 'N/A'}"

        alertas.append(

            AlertaGanadera(

                tipo="vacuna",

                prioridad=prioridad,

                animal_id=animal.id,

                animal_numero=animal.numero_identificacion,

                animal_nombre=animal.nombre,

                mensaje=mensaje,

                fecha_limite=vacuna.proxima_dosis,

            )

        )



    # Parto: solo diagnósticos preñada confirmados con FPP (no servicios sin confirmar)

    partos_candidatos = db.query(ControlReproductivo).filter(

        ControlReproductivo.finca_id == finca_id,

        ControlReproductivo.tipo_evento == "diagnostico",

        ControlReproductivo.diagnostico == "prenada",

        ControlReproductivo.fecha_probable_parto.isnot(None),

        ControlReproductivo.fecha_probable_parto <= limite_partos,

    ).all()



    for registro in partos_candidatos:

        if not gestacion_activa(db, registro, finca_id):

            continue

        if registro.animal_id in alertas_parto_por_animal:

            continue

        animal = db.query(Animal).filter(

            Animal.id == registro.animal_id,

            Animal.finca_id == finca_id,

        ).first()

        if not animal or animal.estado != "activo":

            continue

        alertas_parto_por_animal.add(animal.id)

        dias_restantes = (registro.fecha_probable_parto - hoy).days

        prioridad = "alta" if dias_restantes <= 3 else "media"

        if dias_restantes < 0:

            mensaje = f"Parto probable vencido hace {abs(dias_restantes)} dias"

        elif dias_restantes == 0:

            mensaje = "Parto probable hoy"

        else:

            mensaje = f"Parto proximo en {dias_restantes} dias"

        alertas.append(

            AlertaGanadera(

                tipo="parto",

                prioridad=prioridad,

                animal_id=animal.id,

                animal_numero=animal.numero_identificacion,

                animal_nombre=animal.nombre,

                mensaje=mensaje,

                fecha_limite=registro.fecha_probable_parto,

            )

        )



    for registro in _ultimos_diagnosticos_vacias_antiguas(db, finca_id, hoy):

        animal = db.query(Animal).filter(

            Animal.id == registro.animal_id,

            Animal.finca_id == finca_id,

        ).first()

        if not animal or animal.estado != "activo" or animal.sexo != "hembra":

            continue

        if hembrana_en_gestacion_activa(db, animal.id, finca_id):

            continue

        if parto_reciente(db, animal.id, finca_id, hoy):

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

