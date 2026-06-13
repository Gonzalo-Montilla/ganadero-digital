"""
Schemas para gráficas del módulo Métricas
"""
from pydantic import BaseModel, Field


class DistribucionItem(BaseModel):
    nombre: str
    valor: int


class PuntoFinanzas(BaseModel):
    etiqueta: str
    mes: str
    ventas: float = 0.0
    ventas_leche: float = 0.0
    ventas_animales: float = 0.0
    ventas_otros: float = 0.0
    gastos: float = 0.0
    compras: float = 0.0
    balance: float = 0.0


class PuntoProduccion(BaseModel):
    etiqueta: str
    mes: str
    litros: float = 0.0


class PuntoReproductivo(BaseModel):
    etiqueta: str
    mes: str
    servicios: int = 0
    partos: int = 0


class PuntoConciliacionLeche(BaseModel):
    etiqueta: str
    mes: str
    litros_ordeñados: float = 0.0
    litros_vendidos: float = 0.0
    diferencia: float = 0.0
    ingreso_leche: float = 0.0


class ResumenMargenRubro(BaseModel):
    ingresos_leche: float = 0.0
    gastos_leche: float = 0.0
    margen_leche: float = 0.0
    ingresos_ceba: float = 0.0
    gastos_ceba: float = 0.0
    margen_ceba: float = 0.0
    gastos_general: float = 0.0


class MetricasGraficas(BaseModel):
    meses: int = Field(description="Ventana temporal usada en las series")
    inventario_categorias: list[DistribucionItem] = []
    inventario_estados: list[DistribucionItem] = []
    finanzas: list[PuntoFinanzas] = []
    produccion: list[PuntoProduccion] = []
    reproductivo: list[PuntoReproductivo] = []
    conciliacion_leche: list[PuntoConciliacionLeche] = []
    margen_rubros: ResumenMargenRubro = Field(default_factory=ResumenMargenRubro)
