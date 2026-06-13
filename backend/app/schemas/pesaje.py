"""
Schemas para historial de pesajes.
"""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class PesajeCreate(BaseModel):
    fecha: date
    peso_kg: float = Field(..., gt=0)
    observaciones: Optional[str] = Field(None, max_length=500)


class PesajeResponse(BaseModel):
    id: int
    animal_id: int
    finca_id: int
    fecha: date
    peso_kg: float
    observaciones: Optional[str] = None
    registrado_por: Optional[int] = None

    class Config:
        from_attributes = True


class AnimalFaenaCandidato(BaseModel):
    id: int
    numero_identificacion: str
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    proposito: Optional[str] = None
    peso_actual: Optional[float] = None
    peso_objetivo: float
    ultima_fecha_pesaje: Optional[date] = None
    ganancia_kg_dia: Optional[float] = None
