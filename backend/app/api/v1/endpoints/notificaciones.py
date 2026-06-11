"""
Endpoints para notificaciones por correo.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_admin, get_db
from app.models.finca import Finca
from app.models.usuario import Usuario
from app.services.email_service import smtp_configurado
from app.services.notificaciones_service import (
    enviar_alertas_diarias,
    enviar_correo_prueba,
    enviar_resumen_alertas_usuario,
)

router = APIRouter()


@router.post("/prueba")
def enviar_prueba(
    current_user: Usuario = Depends(get_current_admin),
) -> dict[str, str]:
    """Envia un correo de prueba al usuario autenticado."""
    if not smtp_configurado():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMTP no configurado en el servidor",
        )

    try:
        enviar_correo_prueba(current_user.email, current_user.nombre_completo)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"No se pudo enviar el correo de prueba: {exc}",
        ) from exc

    return {"mensaje": f"Correo de prueba enviado a {current_user.email}"}


@router.post("/mis-alertas")
def enviar_mis_alertas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
) -> dict[str, Any]:
    """Envia ahora el resumen de alertas de la finca al usuario autenticado."""
    if not smtp_configurado():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMTP no configurado en el servidor",
        )

    finca = db.query(Finca).filter(Finca.id == current_user.finca_id).first()
    if not finca:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finca no encontrada")

    try:
        total = enviar_resumen_alertas_usuario(db, usuario=current_user, finca=finca)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"No se pudo enviar el resumen: {exc}",
        ) from exc

    return {
        "mensaje": f"Resumen enviado a {current_user.email}",
        "alertas": total,
    }


@router.post("/ejecutar-diarias")
def ejecutar_alertas_diarias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
) -> dict[str, Any]:
    """Dispara manualmente el envio diario a todos los usuarios con notificaciones activas."""
    if not smtp_configurado():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMTP no configurado en el servidor",
        )

    try:
        resultado = enviar_alertas_diarias(db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error enviando alertas diarias: {exc}",
        ) from exc

    return {
        "mensaje": "Proceso de alertas diarias ejecutado",
        "resultado": resultado,
        "hora_programada": f"{settings.NOTIFICATIONS_DAILY_HOUR:02d}:{settings.NOTIFICATIONS_DAILY_MINUTE:02d}",
        "zona_horaria": settings.TIMEZONE,
        "ejecutado_por": current_user.email,
    }
