export interface ControlSanitario {
  id: number;
  finca_id: number;
  animal_id: number;
  tipo: 'vacuna' | 'tratamiento' | 'desparasitacion' | 'cirugia' | 'otro';
  fecha: string; // ISO date
  producto: string | null;
  dosis: string | null;
  via_administracion: 'intramuscular' | 'subcutanea' | 'oral' | 'topica' | 'intravenosa' | 'intramamaria' | null;
  lote_producto: string | null;
  fecha_vencimiento: string | null; // ISO date
  veterinario: string | null;
  diagnostico: string | null;
  peso_animal: number | null;
  temperatura: number | null;
  costo: number | null;
  proxima_dosis: string | null; // ISO date
  dias_retiro_leche: number | null;
  dias_retiro_carne: number | null;
  observaciones: string | null;
  aplicado_por: number | null;
  created_at: string;
  updated_at: string;
  
  // Campos adicionales de la respuesta
  animal_numero?: string;
  animal_nombre?: string;
}

export interface ControlSanitarioCreate {
  animal_id: number;
  tipo: 'vacuna' | 'tratamiento' | 'desparasitacion' | 'cirugia' | 'otro';
  fecha: string; // ISO date
  producto?: string;
  dosis?: string;
  via_administracion?: 'intramuscular' | 'subcutanea' | 'oral' | 'topica' | 'intravenosa' | 'intramamaria';
  lote_producto?: string;
  fecha_vencimiento?: string; // ISO date
  veterinario?: string;
  diagnostico?: string;
  peso_animal?: number;
  temperatura?: number;
  costo?: number;
  proxima_dosis?: string; // ISO date
  dias_retiro_leche?: number;
  dias_retiro_carne?: number;
  observaciones?: string;
}

export interface ControlSanitarioUpdate {
  tipo?: 'vacuna' | 'tratamiento' | 'desparasitacion' | 'cirugia' | 'otro';
  fecha?: string;
  producto?: string;
  dosis?: string;
  via_administracion?: 'intramuscular' | 'subcutanea' | 'oral' | 'topica' | 'intravenosa' | 'intramamaria';
  lote_producto?: string;
  fecha_vencimiento?: string;
  veterinario?: string;
  diagnostico?: string;
  peso_animal?: number;
  temperatura?: number;
  costo?: number;
  proxima_dosis?: string;
  dias_retiro_leche?: number;
  dias_retiro_carne?: number;
  observaciones?: string;
}

export interface ControlSanitarioListResponse {
  total: number;
  items: ControlSanitario[];
  skip: number;
  limit: number;
}
