from datetime import date

from app.services.rules_engine import (
    calcular_dias_abiertos,
    calcular_fecha_probable_parto,
    carga_animal_por_hectarea,
    en_retiro_sanitario,
    ganancia_diaria_peso,
)


def test_calcular_fecha_probable_parto_default():
    fecha_servicio = date(2026, 1, 1)
    assert calcular_fecha_probable_parto(fecha_servicio) == date(2026, 10, 11)


def test_retiro_sanitario_activo():
    assert en_retiro_sanitario(date(2026, 6, 1), 10, date(2026, 6, 8)) is True
    assert en_retiro_sanitario(date(2026, 6, 1), 10, date(2026, 6, 12)) is False


def test_carga_animal_por_hectarea():
    assert carga_animal_por_hectarea(120, 40) == 3.0
    assert carga_animal_por_hectarea(120, 0) == 0.0


def test_ganancia_diaria_peso():
    assert ganancia_diaria_peso(250, 310, 30) == 2.0
    assert ganancia_diaria_peso(250, 310, 0) == 0.0


def test_dias_abiertos():
    assert calcular_dias_abiertos(date(2026, 1, 1), date(2026, 2, 1)) == 31
    assert calcular_dias_abiertos(None, date(2026, 2, 1)) is None
