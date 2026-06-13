"""
Aplica reglas de fecha probable de parto en registros reproductivos.
"""
from __future__ import annotations

from datetime import date

from app.services.rules_engine import (
    calcular_fecha_probable_parto,
    calcular_fpp_desde_diagnostico,
)


def enriquecer_fecha_probable_parto(data: dict) -> dict:
    """Calcula FPP en servicios y diagnósticos preñada cuando falta."""
    tipo = data.get("tipo_evento")
    if tipo == "servicio" and data.get("fecha_evento") and not data.get("fecha_probable_parto"):
        data["fecha_probable_parto"] = calcular_fecha_probable_parto(data["fecha_evento"])

    if (
        tipo == "diagnostico"
        and data.get("diagnostico") == "prenada"
        and data.get("dias_gestacion") is not None
        and data.get("fecha_evento")
        and not data.get("fecha_probable_parto")
    ):
        data["fecha_probable_parto"] = calcular_fpp_desde_diagnostico(
            data["fecha_evento"],
            int(data["dias_gestacion"]),
        )
    return data
