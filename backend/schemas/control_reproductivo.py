"""
Schemas para Control Reproductivo (servicios, diagnósticos, partos)
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# ============================================
# Base Schemas
# ============================================

class ControlReproductivoBase(BaseModel):
    """Schema base para control reproductivo"""
    animal_id: int = Field(..., description="ID de la hembra")
    tipo_evento: str = Field(..., description="servicio, diagnostico, parto, aborto, secado, otro")
    fecha_evento: date = Field(..., description="Fecha del evento")
    
    # Campos para SERVICIO/MONTA
    toro_id: Optional[int] = Field(None, description="ID del toro (si es monta natural)")
    tipo_servicio: Optional[str] = Field(None, description="monta_natural, inseminacion_artificial, transferencia_embrion")
    numero_servicio: Optional[int] = Field(None, ge=1, description="Número de servicio (1, 2, 3...)")
    pajuela_utilizada: Optional[str] = Field(None, description="Código/nombre de la pajuela si es IA")
    toro_pajuela: Optional[str] = Field(None, description="Nombre/código del toro de la pajuela")
    
    # Campos para DIAGNÓSTICO
    diagnostico: Optional[str] = Field(None, description="prenada, vacia, dudosa")
    metodo_diagnostico: Optional[str] = Field(None, description="palpacion, ecografia, laboratorio")
    dias_gestacion: Optional[int] = Field(None, ge=0, description="Días de gestación estimados")
    fecha_probable_parto: Optional[date] = Field(None, description="Fecha estimada de parto")
    
    # Campos para PARTO
    tipo_parto: Optional[str] = Field(None, description="normal, asistido, cesarea")
    numero_crias: Optional[int] = Field(None, ge=1, le=5, description="Número de crías")
    sexo_cria: Optional[str] = Field(None, description="macho, hembra, multiple")
    peso_cria: Optional[float] = Field(None, gt=0, description="Peso de la cría en kg")
    facilidad_parto: Optional[str] = Field(None, description="facil, normal, dificil, muy_dificil")
    vitalidad_cria: Optional[str] = Field(None, description="viva, muerta, debil")
    
    # Campos comunes
    veterinario: Optional[str] = Field(None, description="Nombre del veterinario")
    costo: Optional[float] = Field(None, ge=0, description="Costo del procedimiento")
    observaciones: Optional[str] = Field(None, max_length=1000)

    @field_validator('tipo_evento')
    @classmethod
    def validar_tipo_evento(cls, v: str) -> str:
        tipos_validos = ['servicio', 'diagnostico', 'parto', 'aborto', 'secado', 'otro']
        if v.lower() not in tipos_validos:
            raise ValueError(f'Tipo debe ser uno de: {", ".join(tipos_validos)}')
        return v.lower()

    @field_validator('tipo_servicio')
    @classmethod
    def validar_tipo_servicio(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        tipos_validos = ['monta_natural', 'inseminacion_artificial', 'transferencia_embrion']
        if v.lower() not in tipos_validos:
            raise ValueError(f'Tipo de servicio debe ser uno de: {", ".join(tipos_validos)}')
        return v.lower()

    @field_validator('diagnostico')
    @classmethod
    def validar_diagnostico(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        diagnosticos_validos = ['prenada', 'vacia', 'dudosa']
        if v.lower() not in diagnosticos_validos:
            raise ValueError(f'Diagnóstico debe ser uno de: {", ".join(diagnosticos_validos)}')
        return v.lower()


# ============================================
# Create Schemas
# ============================================

class ControlReproductivoCreate(ControlReproductivoBase):
    """Schema para crear un registro reproductivo"""
    pass


# ============================================
# Update Schemas
# ============================================

class ControlReproductivoUpdate(BaseModel):
    """Schema para actualizar un registro reproductivo"""
    tipo_evento: Optional[str] = None
    fecha_evento: Optional[date] = None
    toro_id: Optional[int] = None
    tipo_servicio: Optional[str] = None
    numero_servicio: Optional[int] = Field(None, ge=1)
    pajuela_utilizada: Optional[str] = None
    toro_pajuela: Optional[str] = None
    diagnostico: Optional[str] = None
    metodo_diagnostico: Optional[str] = None
    dias_gestacion: Optional[int] = Field(None, ge=0)
    fecha_probable_parto: Optional[date] = None
    tipo_parto: Optional[str] = None
    numero_crias: Optional[int] = Field(None, ge=1, le=5)
    sexo_cria: Optional[str] = None
    peso_cria: Optional[float] = Field(None, gt=0)
    facilidad_parto: Optional[str] = None
    vitalidad_cria: Optional[str] = None
    veterinario: Optional[str] = None
    costo: Optional[float] = Field(None, ge=0)
    observaciones: Optional[str] = Field(None, max_length=1000)


# ============================================
# Response Schemas
# ============================================

class ControlReproductivoInDB(ControlReproductivoBase):
    """Schema de respuesta con datos de BD"""
    id: int
    finca_id: int
    registrado_por: Optional[int] = None  # usuario_id
    
    class Config:
        from_attributes = True


class ControlReproductivoResponse(ControlReproductivoInDB):
    """Schema de respuesta con información adicional"""
    animal_numero: Optional[str] = None
    animal_nombre: Optional[str] = None
    toro_numero: Optional[str] = None
    toro_nombre: Optional[str] = None


# ============================================
# List/Filter Schemas
# ============================================

class ControlReproductivoFilter(BaseModel):
    """Filtros para listar registros reproductivos"""
    animal_id: Optional[int] = None
    tipo_evento: Optional[str] = None
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    diagnostico: Optional[str] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=100)


class ControlReproductivoListResponse(BaseModel):
    """Respuesta paginada de registros reproductivos"""
    total: int
    items: list[ControlReproductivoResponse]
    skip: int
    limit: int


# ============================================
# Estadísticas Reproductivas
# ============================================

class EstadisticasReproductivas(BaseModel):
    """Estadísticas reproductivas de la finca"""
    total_hembras: int
    hembras_prenadas: int
    hembras_vacias: int
    servicios_ultimo_mes: int
    partos_ultimo_mes: int
    tasa_prenez: float = Field(..., description="Porcentaje de preñez")
    promedio_dias_gestacion: Optional[float] = None
    proximos_partos_30_dias: int
