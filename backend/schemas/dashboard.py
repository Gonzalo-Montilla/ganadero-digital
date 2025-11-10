"""
Schemas para Dashboard y Reportes
"""
from typing import Optional
from datetime import date
from pydantic import BaseModel


class InventarioResumen(BaseModel):
    """Resumen del inventario ganadero"""
    total_animales: int
    hembras: int
    machos: int
    terneros: int
    novillas: int
    vacas: int
    toros: int
    animales_activos: int
    animales_vendidos: int
    animales_muertos: int


class ControlSanitarioAlerta(BaseModel):
    """Alertas sanitarias"""
    proximas_vacunas: int = 0
    proximos_tratamientos: int = 0
    animales_pendientes_desparasitar: int = 0


class ControlReproductivoResumen(BaseModel):
    """Resumen reproductivo"""
    hembras_prenadas: int
    hembras_vacias: int
    tasa_prenez: float
    proximos_partos_30_dias: int
    servicios_mes_actual: int


class ProduccionResumen(BaseModel):
    """Resumen de producción"""
    produccion_leche_hoy: float = 0.0
    produccion_leche_mes: float = 0.0
    promedio_litros_vaca: float = 0.0


class FinanzasResumen(BaseModel):
    """Resumen financiero"""
    ventas_mes: float
    gastos_mes: float
    balance_mes: float
    total_balance: float


class DashboardCompleto(BaseModel):
    """Dashboard completo con todas las métricas"""
    inventario: InventarioResumen
    sanidad: ControlSanitarioAlerta
    reproduccion: ControlReproductivoResumen
    produccion: ProduccionResumen
    finanzas: FinanzasResumen
    ultima_actualizacion: date


class AlertaGanadera(BaseModel):
    """Alerta del sistema"""
    tipo: str  # vacuna, parto, tratamiento, bajo_peso
    prioridad: str  # alta, media, baja
    animal_id: int
    animal_numero: str
    animal_nombre: Optional[str]
    mensaje: str
    fecha_limite: Optional[date] = None


class AlertasResponse(BaseModel):
    """Respuesta con lista de alertas"""
    total: int
    alertas: list[AlertaGanadera]
