export interface Pesaje {
  id: number;
  animal_id: number;
  finca_id: number;
  fecha: string;
  peso_kg: number;
  observaciones?: string | null;
  registrado_por?: number | null;
}

export interface PesajeCreate {
  fecha: string;
  peso_kg: number;
  observaciones?: string | null;
}

export interface AnimalFaenaCandidato {
  id: number;
  numero_identificacion: string;
  nombre?: string | null;
  categoria?: string | null;
  proposito?: string | null;
  peso_actual?: number | null;
  peso_objetivo: number;
  ultima_fecha_pesaje?: string | null;
  ganancia_kg_dia?: number | null;
}
