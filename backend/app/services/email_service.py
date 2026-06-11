"""
Servicio de envio de correo via SMTP (Gmail u otro proveedor).
"""
from __future__ import annotations

import logging
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Iterable

from app.core.config import settings
from app.services.email_templates import render_email_html, render_email_text

logger = logging.getLogger(__name__)


def smtp_configurado() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def _logo_path() -> Path:
    return Path(settings.EMAIL_LOGO_PATH)


def enviar_correo(
    *,
    destinatarios: Iterable[str],
    asunto: str,
    cuerpo_texto: str,
    cuerpo_html: str | None = None,
    logo_cid: str | None = None,
) -> None:
    recipients = [email.strip() for email in destinatarios if email and email.strip()]
    if not recipients:
        raise ValueError("No hay destinatarios validos")

    if not smtp_configurado():
        raise RuntimeError("SMTP no configurado. Revisa SMTP_HOST, SMTP_USER y SMTP_PASSWORD en .env")

    remitente = settings.SMTP_FROM or settings.SMTP_USER
    mensaje = MIMEMultipart("mixed")
    mensaje["Subject"] = asunto
    mensaje["From"] = f"{settings.SMTP_FROM_NAME} <{remitente}>"
    mensaje["To"] = ", ".join(recipients)

    alternativas = MIMEMultipart("alternative")
    alternativas.attach(MIMEText(cuerpo_texto, "plain", "utf-8"))

    if cuerpo_html:
        if logo_cid:
            relacionado = MIMEMultipart("related")
            relacionado.attach(MIMEText(cuerpo_html, "html", "utf-8"))
            logo_path = _logo_path()
            if logo_path.exists():
                with logo_path.open("rb") as archivo:
                    imagen = MIMEImage(archivo.read(), _subtype="png")
                imagen.add_header("Content-ID", f"<{logo_cid}>")
                imagen.add_header("Content-Disposition", "inline", filename="logo-finca-el-progreso.png")
                relacionado.attach(imagen)
            alternativas.attach(relacionado)
        else:
            alternativas.attach(MIMEText(cuerpo_html, "html", "utf-8"))

    mensaje.attach(alternativas)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587, timeout=30) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(remitente, recipients, mensaje.as_string())

    logger.info("Correo enviado a %s | asunto: %s", recipients, asunto)


def enviar_correo_marca(
    *,
    destinatarios: Iterable[str],
    asunto: str,
    titulo: str,
    contenido_html: str,
    lineas_texto: list[str],
    subtitulo: str | None = None,
    badge: str | None = None,
    badge_variant: str = "sistema",
    preheader: str | None = None,
) -> None:
    """Envia un correo usando la plantilla HTML estandar de marca."""
    logo_cid = settings.EMAIL_LOGO_CID if _logo_path().exists() else None
    enviar_correo(
        destinatarios=destinatarios,
        asunto=asunto,
        cuerpo_texto=render_email_text(titulo=titulo, lineas=lineas_texto),
        cuerpo_html=render_email_html(
            titulo=titulo,
            subtitulo=subtitulo,
            contenido_html=contenido_html,
            badge=badge,
            badge_variant=badge_variant,
            preheader=preheader or subtitulo or titulo,
            logo_cid=logo_cid,
        ),
        logo_cid=logo_cid,
    )
