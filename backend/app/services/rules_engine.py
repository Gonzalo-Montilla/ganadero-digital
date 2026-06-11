"""
Motor de reglas de negocio ganadero.
Funciones puras para soportar automatizaciones y alertas.
"""
from __future__ import annotations

from datetime import date, timedelta


GESTATION_DAYS_DEFAULT = 283


def calcular_fecha_probable_parto(fecha_servicio: date, dias_gestacion: int = GESTATION_DAYS_DEFAULT) -> date:
    return fecha_servicio + timedelta(days=dias_gestacion)


def calcular_dias_abiertos(ultimo_parto: date | None, hoy: date) -> int | None:
    if ultimo_parto is None:
        return None
    return max((hoy - ultimo_parto).days, 0)


def en_retiro_sanitario(fecha_aplicacion: date, dias_retiro: int | None, hoy: date) -> bool:
    if not dias_retiro or dias_retiro <= 0:
        return False
    return hoy < (fecha_aplicacion + timedelta(days=dias_retiro))


def carga_animal_por_hectarea(total_animales_activos: int, area_hectareas: float | None) -> float:
    if not area_hectareas or area_hectareas <= 0:
        return 0.0
    return round(total_animales_activos / area_hectareas, 2)


def ganancia_diaria_peso(peso_inicial: float, peso_final: float, dias: int) -> float:
    if dias <= 0:
        return 0.0
    return round((peso_final - peso_inicial) / dias, 3)
