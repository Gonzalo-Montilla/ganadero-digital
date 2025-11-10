export interface ControlReproductivo {
  id: number;
  finca_id: number;
  animal_id: number;
  tipo_evento: 'servicio' | 'diagnostico' | 'parto' | 'aborto' | 'secado' | 'otro';
  fecha_evento: string; // ISO date
  
  // Campos para SERVICIO/MONTA
  toro_id: number | null;
  tipo_servicio: 'monta_natural' | 'inseminacion_artificial' | 'transferencia_embrion' | null;
  numero_servicio: number | null;
  pajuela_utilizada: string | null;
  toro_pajuela: string | null;
  
  // Campos para DIAGNÓSTICO
  diagnostico: 'prenada' | 'vacia' | 'dudosa' | null;
  metodo_diagnostico: 'palpacion' | 'ecografia' | 'laboratorio' | null;
  dias_gestacion: number | null;
  fecha_probable_parto: string | null; // ISO date
  
  // Campos para PARTO
  tipo_parto: 'normal' | 'asistido' | 'cesarea' | null;
  numero_crias: number | null;
  sexo_cria: 'macho' | 'hembra' | 'multiple' | null;
  peso_cria: number | null;
  facilidad_parto: 'facil' | 'normal' | 'dificil' | 'muy_dificil' | null;
  vitalidad_cria: 'viva' | 'muerta' | 'debil' | null;
  
  // Campos comunes
  veterinario: string | null;
  costo: number | null;
  observaciones: string | null;
  registrado_por: number | null;
  created_at: string;
  updated_at: string;
  
  // Campos adicionales de la respuesta
  animal_numero?: string;
  animal_nombre?: string;
  toro_numero?: string;
  toro_nombre?: string;
}

export interface ControlReproductivoCreate {
  animal_id: number;
  tipo_evento: 'servicio' | 'diagnostico' | 'parto' | 'aborto' | 'secado' | 'otro';
  fecha_evento: string; // ISO date
  toro_id?: number;
  tipo_servicio?: 'monta_natural' | 'inseminacion_artificial' | 'transferencia_embrion';
  numero_servicio?: number;
  pajuela_utilizada?: string;
  toro_pajuela?: string;
  diagnostico?: 'prenada' | 'vacia' | 'dudosa';
  metodo_diagnostico?: 'palpacion' | 'ecografia' | 'laboratorio';
  dias_gestacion?: number;
  fecha_probable_parto?: string;
  tipo_parto?: 'normal' | 'asistido' | 'cesarea';
  numero_crias?: number;
  sexo_cria?: 'macho' | 'hembra' | 'multiple';
  peso_cria?: number;
  facilidad_parto?: 'facil' | 'normal' | 'dificil' | 'muy_dificil';
  vitalidad_cria?: 'viva' | 'muerta' | 'debil';
  veterinario?: string;
  costo?: number;
  observaciones?: string;
}

export interface ControlReproductivoUpdate {
  tipo_evento?: 'servicio' | 'diagnostico' | 'parto' | 'aborto' | 'secado' | 'otro';
  fecha_evento?: string;
  toro_id?: number;
  tipo_servicio?: 'monta_natural' | 'inseminacion_artificial' | 'transferencia_embrion';
  numero_servicio?: number;
  pajuela_utilizada?: string;
  toro_pajuela?: string;
  diagnostico?: 'prenada' | 'vacia' | 'dudosa';
  metodo_diagnostico?: 'palpacion' | 'ecografia' | 'laboratorio';
  dias_gestacion?: number;
  fecha_probable_parto?: string;
  tipo_parto?: 'normal' | 'asistido' | 'cesarea';
  numero_crias?: number;
  sexo_cria?: 'macho' | 'hembra' | 'multiple';
  peso_cria?: number;
  facilidad_parto?: 'facil' | 'normal' | 'dificil' | 'muy_dificil';
  vitalidad_cria?: 'viva' | 'muerta' | 'debil';
  veterinario?: string;
  costo?: number;
  observaciones?: string;
}

export interface ControlReproductivoListResponse {
  total: number;
  items: ControlReproductivo[];
  skip: number;
  limit: number;
}
