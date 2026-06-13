"""
Envio de alertas ganaderas por correo electronico.
"""
from __future__ import annotations

from datetime import date
from html import escape

from sqlalchemy.orm import Session

from app.models.finca import Finca
from app.models.usuario import Usuario
from app.schemas.dashboard import AlertaGanadera
from app.services.alertas_service import obtener_alertas_finca
from app.services.email_service import enviar_correo_marca
from app.services.email_templates import render_data_table, render_info_box

TIPO_LABELS = {
    "vacuna": "Vacuna / refuerzo",
    "parto": "Parto proximo",
    "dias_abiertos": "Dias abiertos",
    "retiro_sanitario": "Retiro sanitario",
    "listo_faena": "Listo para faena",
}


def _format_fecha(value: date | None) -> str:
    if not value:
        return "Sin fecha"
    return value.strftime("%d/%m/%Y")


def _render_contenido_alertas(alertas: list[AlertaGanadera], finca_nombre: str, hoy: date) -> str:
    resumen = render_info_box(
        f"<strong>Finca:</strong> {escape(finca_nombre)}<br/>"
        f"<strong>Fecha:</strong> {_format_fecha(hoy)}<br/>"
        f"<strong>Alertas activas:</strong> {len(alertas)}",
        variant="sistema",
    )

    if not alertas:
        estado = render_info_box(
            "<strong>Todo en orden.</strong> No hay alertas pendientes para hoy.",
            variant="exito",
        )
        return f"{resumen}<div style='height:16px'></div>{estado}"

    filas = []
    for alerta in alertas:
        animal = escape(alerta.animal_nombre or alerta.animal_numero)
        tipo = escape(TIPO_LABELS.get(alerta.tipo, alerta.tipo.replace("_", " ").title()))
        prioridad = alerta.prioridad.upper()
        color = "#b91c1c" if alerta.prioridad == "alta" else "#a16207"
        filas.append([
            tipo,
            f"{animal}<br/><span style='color:#64748b;font-size:12px;'>#{escape(alerta.animal_numero)}</span>",
            escape(alerta.mensaje),
            f"<span style='color:{color};font-weight:700;'>{prioridad}</span>",
        ])

    tabla = render_data_table(["Tipo", "Animal", "Detalle", "Prioridad"], filas)
    return f"{resumen}<div style='height:16px'></div>{tabla}"


def _lineas_texto_alertas(alertas: list[AlertaGanadera], finca_nombre: str, hoy: date) -> list[str]:
    lineas = [
        f"Finca: {finca_nombre}",
        f"Fecha: {_format_fecha(hoy)}",
        f"Total alertas: {len(alertas)}",
        "",
    ]
    if not alertas:
        lineas.append("Todo en orden. No hay alertas pendientes para hoy.")
    else:
        for alerta in alertas:
            animal = alerta.animal_nombre or alerta.animal_numero
            lineas.append(
                f"- [{alerta.prioridad.upper()}] {TIPO_LABELS.get(alerta.tipo, alerta.tipo)} | "
                f"{animal} (#{alerta.animal_numero}) | {alerta.mensaje}"
            )
    lineas.append("")
    lineas.append("Ingresa al sistema para revisar y actuar.")
    return lineas


def enviar_resumen_alertas_usuario(
    db: Session,
    *,
    usuario: Usuario,
    finca: Finca,
    hoy: date | None = None,
) -> int:
    hoy = hoy or date.today()
    alertas = obtener_alertas_finca(db, finca.id, hoy)
    asunto = f"Finca El Progreso | {len(alertas)} alerta(s) — {finca.nombre}"

    enviar_correo_marca(
        destinatarios=[usuario.email],
        asunto=asunto,
        titulo="Resumen diario de alertas",
        subtitulo=f"Hola {usuario.nombre_completo}, este es el estado de tu finca hoy.",
        badge="Alertas",
        badge_variant="alertas" if alertas else "exito",
        preheader=f"{len(alertas)} alerta(s) pendientes en {finca.nombre}",
        contenido_html=_render_contenido_alertas(alertas, finca.nombre, hoy),
        lineas_texto=_lineas_texto_alertas(alertas, finca.nombre, hoy),
    )
    return len(alertas)


def enviar_correo_prueba(destinatario: str, nombre_usuario: str) -> None:
    contenido = render_info_box(
        f"Hola <strong>{escape(nombre_usuario)}</strong>,<br/><br/>"
        "Este es un correo de prueba del sistema.<br/>"
        f"Si lo recibiste, la configuracion SMTP con Gmail esta funcionando correctamente.",
        variant="prueba",
    )
    enviar_correo_marca(
        destinatarios=[destinatario],
        asunto="Prueba de correo — Finca El Progreso",
        titulo="Correo de prueba",
        subtitulo="Verificacion de configuracion SMTP",
        badge="Prueba",
        badge_variant="prueba",
        preheader="Prueba de correo del sistema Finca El Progreso",
        contenido_html=contenido,
        lineas_texto=[
            f"Hola {nombre_usuario},",
            "",
            "Este es un correo de prueba del sistema Finca El Progreso.",
            "Si lo recibiste, la configuracion SMTP con Gmail esta funcionando.",
        ],
    )


def enviar_alertas_diarias(db: Session) -> dict[str, int]:
    usuarios = (
        db.query(Usuario)
        .filter(
            Usuario.activo.is_(True),
            Usuario.recibir_notificaciones.is_(True),
        )
        .all()
    )

    enviados = 0
    errores = 0
    for usuario in usuarios:
        finca = db.query(Finca).filter(Finca.id == usuario.finca_id).first()
        if not finca:
            errores += 1
            continue
        try:
            enviar_resumen_alertas_usuario(db, usuario=usuario, finca=finca)
            enviados += 1
        except Exception:
            errores += 1

    return {"enviados": enviados, "errores": errores, "usuarios": len(usuarios)}
