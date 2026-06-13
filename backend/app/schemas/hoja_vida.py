"""
Schemas para hoja de vida reproductiva del animal.
"""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class AnimalResumenGenealogia(BaseModel):
    id: int
    numero_identificacion: str
    nombre: Optional[str] = None
    sexo: str
    fecha_nacimiento: Optional[date] = None


class EventoHojaVidaReproductiva(BaseModel):
    id: int
    tipo_evento: str
    fecha_evento: date
    diagnostico: Optional[str] = None
    tipo_servicio: Optional[str] = None
    toro_numero: Optional[str] = None
    toro_nombre: Optional[str] = None
    hembra_numero: Optional[str] = None
    hembra_nombre: Optional[str] = None
    numero_crias: Optional[int] = None
    tipo_parto: Optional[str] = None
    facilidad_parto: Optional[str] = None
    vitalidad_cria: Optional[str] = None
    crias_registradas: list[AnimalResumenGenealogia] = Field(default_factory=list)


class HojaVidaReproductivaResponse(BaseModel):
    madre: Optional[AnimalResumenGenealogia] = None
    padre: Optional[AnimalResumenGenealogia] = None
    crias_en_inventario: list[AnimalResumenGenealogia] = Field(default_factory=list)
    progenie_como_padre: list[AnimalResumenGenealogia] = Field(default_factory=list)
    eventos: list[EventoHojaVidaReproductiva] = Field(default_factory=list)
