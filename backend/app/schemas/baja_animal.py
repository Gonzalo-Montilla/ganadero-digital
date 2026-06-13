"""
Schema para registrar baja por muerte (no confundir con venta/faena).
"""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class BajaMuerteRequest(BaseModel):
    fecha: date
    motivo: str = Field(..., min_length=3, max_length=500, description="Causa o circunstancia de la muerte")
    observaciones: Optional[str] = Field(None, max_length=1000)


class BajaMuerteResponse(BaseModel):
    id: int
    numero_identificacion: str
    estado: str
    fecha_salida: date
    motivo_salida: str
    mensaje: str
