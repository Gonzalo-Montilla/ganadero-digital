"""
Schemas para Control Sanitario (vacunas, tratamientos, desparasitaciones)
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# ============================================
# Base Schemas
# ============================================

class ControlSanitarioBase(BaseModel):
    """Schema base para control sanitario"""
    animal_id: int = Field(..., description="ID del animal")
    tipo: str = Field(..., description="vacuna, tratamiento, desparasitacion, cirugia, otro")
    fecha: date = Field(..., description="Fecha del procedimiento")
    producto: Optional[str] = Field(None, description="Nombre del producto/medicamento")
    dosis: Optional[str] = Field(None, description="Dosis aplicada (ej: 5ml, 2cc)")
    via_administracion: Optional[str] = Field(None, description="intramuscular, subcutanea, oral, topica")
    lote_producto: Optional[str] = Field(None, description="Lote del producto")
    fecha_vencimiento: Optional[date] = Field(None, description="Fecha de vencimiento del producto")
    veterinario: Optional[str] = Field(None, description="Nombre del veterinario")
    diagnostico: Optional[str] = Field(None, description="Diagnóstico o motivo")
    peso_animal: Optional[float] = Field(None, gt=0, description="Peso del animal al momento del tratamiento")
    temperatura: Optional[float] = Field(None, description="Temperatura del animal (°C)")
    costo: Optional[float] = Field(None, ge=0, description="Costo del tratamiento")
    proxima_dosis: Optional[date] = Field(None, description="Fecha de la próxima dosis/refuerzo")
    dias_retiro_leche: Optional[int] = Field(None, ge=0, description="Días de retiro de leche")
    dias_retiro_carne: Optional[int] = Field(None, ge=0, description="Días de retiro de carne")
    observaciones: Optional[str] = Field(None, max_length=1000)

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        tipos_validos = ['vacuna', 'tratamiento', 'desparasitacion', 'cirugia', 'otro']
        if v.lower() not in tipos_validos:
            raise ValueError(f'Tipo debe ser uno de: {", ".join(tipos_validos)}')
        return v.lower()

    @field_validator('via_administracion')
    @classmethod
    def validar_via(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        vias_validas = ['intramuscular', 'subcutanea', 'oral', 'topica', 'intravenosa', 'intramamaria']
        if v.lower() not in vias_validas:
            raise ValueError(f'Vía debe ser una de: {", ".join(vias_validas)}')
        return v.lower()


# ============================================
# Create Schemas
# ============================================

class ControlSanitarioCreate(ControlSanitarioBase):
    """Schema para crear un registro sanitario"""
    pass


# ============================================
# Update Schemas
# ============================================

class ControlSanitarioUpdate(BaseModel):
    """Schema para actualizar un registro sanitario"""
    tipo: Optional[str] = None
    fecha: Optional[date] = None
    producto: Optional[str] = None
    dosis: Optional[str] = None
    via_administracion: Optional[str] = None
    lote_producto: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    veterinario: Optional[str] = None
    diagnostico: Optional[str] = None
    peso_animal: Optional[float] = Field(None, gt=0)
    temperatura: Optional[float] = None
    costo: Optional[float] = Field(None, ge=0)
    proxima_dosis: Optional[date] = None
    dias_retiro_leche: Optional[int] = Field(None, ge=0)
    dias_retiro_carne: Optional[int] = Field(None, ge=0)
    observaciones: Optional[str] = Field(None, max_length=1000)


# ============================================
# Response Schemas
# ============================================

class ControlSanitarioInDB(ControlSanitarioBase):
    """Schema de respuesta con datos de BD"""
    id: int
    finca_id: int
    aplicado_por: Optional[int] = None  # usuario_id
    
    class Config:
        from_attributes = True


class ControlSanitarioResponse(ControlSanitarioInDB):
    """Schema de respuesta con información adicional"""
    animal_numero: Optional[str] = None
    animal_nombre: Optional[str] = None


# ============================================
# List/Filter Schemas
# ============================================

class ControlSanitarioFilter(BaseModel):
    """Filtros para listar registros sanitarios"""
    animal_id: Optional[int] = None
    tipo: Optional[str] = None
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    producto: Optional[str] = None
    veterinario: Optional[str] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=100)


class ControlSanitarioListResponse(BaseModel):
    """Respuesta paginada de registros sanitarios"""
    total: int
    items: list[ControlSanitarioResponse]
    skip: int
    limit: int
