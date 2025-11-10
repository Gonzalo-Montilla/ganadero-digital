export interface Animal {
  id: number;
  finca_id: number;
  numero_identificacion: string;
  nombre: string | null;
  foto_url: string | null;
  sexo: 'macho' | 'hembra';
  fecha_nacimiento: string;
  raza: string;
  color: string | null;
  madre_id: number | null;
  padre_id: number | null;
  peso_nacimiento: number | null;
  peso_actual: number | null;
  peso_anterior: number | null;
  ultima_fecha_pesaje: string | null;
  tipo_adquisicion: string;
  fecha_ingreso: string;
  finca_origen: string | null;
  estado: string;
  fecha_salida: string | null;
  motivo_salida: string | null;
  categoria: string | null;
  proposito: string;
  lote_actual: string | null;
  potrero_actual: string | null;
  numero_registro_ica: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimalCreate {
  numero_identificacion: string;
  nombre?: string;
  sexo: 'macho' | 'hembra';
  fecha_nacimiento: string;
  raza: string;
  color?: string;
  peso_nacimiento?: number;
  tipo_adquisicion: string;
  fecha_ingreso: string;
  categoria?: string;
  proposito: string;
  madre_id?: number;
  padre_id?: number;
  finca_origen?: string;
  lote_actual?: string;
  potrero_actual?: string;
  observaciones?: string;
}

export interface AnimalUpdate {
  nombre?: string;
  peso_actual?: number;
  categoria?: string;
  estado?: string;
  lote_actual?: string;
  potrero_actual?: string;
  observaciones?: string;
}

export interface AnimalesListResponse {
  total: number;
  items: Animal[];
  skip: number;
  limit: number;
}
