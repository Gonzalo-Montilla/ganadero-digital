"""
Programacion de tareas en background (alertas diarias por correo).
"""
from __future__ import annotations

import logging
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.db.database import SessionLocal
from app.services.email_service import smtp_configurado
from app.services.notificaciones_service import enviar_alertas_diarias

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone=ZoneInfo(settings.TIMEZONE))


def _job_alertas_diarias() -> None:
    if not settings.NOTIFICATIONS_ENABLED:
        return
    if not smtp_configurado():
        logger.warning("Alertas diarias omitidas: SMTP no configurado")
        return

    db = SessionLocal()
    try:
        resultado = enviar_alertas_diarias(db)
        logger.info("Alertas diarias enviadas: %s", resultado)
    except Exception:
        logger.exception("Error ejecutando alertas diarias")
    finally:
        db.close()


def iniciar_scheduler() -> None:
    if not settings.NOTIFICATIONS_ENABLED:
        logger.info("Scheduler de notificaciones desactivado")
        return

    if scheduler.running:
        return

    scheduler.add_job(
        _job_alertas_diarias,
        trigger=CronTrigger(
            hour=settings.NOTIFICATIONS_DAILY_HOUR,
            minute=settings.NOTIFICATIONS_DAILY_MINUTE,
            timezone=ZoneInfo(settings.TIMEZONE),
        ),
        id="alertas_diarias_email",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler iniciado: alertas diarias %02d:%02d (%s)",
        settings.NOTIFICATIONS_DAILY_HOUR,
        settings.NOTIFICATIONS_DAILY_MINUTE,
        settings.TIMEZONE,
    )


def detener_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
