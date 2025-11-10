export interface RegistroProduccion {
  id: number;
  finca_id: number;
  animal_id: number;
  tipo_produccion: 'leche' | 'carne' | 'lana' | 'otro';
  fecha: string;
  
  // Producción lechera
  cantidad_litros?: number | null;
  turno?: 'manana' | 'tarde' | 'noche' | null;
  
  // Producción carne
  peso_venta?: number | null;
  
  // Otros
  calidad?: 'alta' | 'media' | 'baja' | null;
  observaciones?: string | null;
  
  // Info adicional
  animal_numero?: string | null;
  animal_nombre?: string | null;
  registrado_por?: number | null;
}

export interface RegistroProduccionCreate {
  animal_id: number;
  tipo_produccion: 'leche' | 'carne' | 'lana' | 'otro';
  fecha: string;
  cantidad_litros?: number | null;
  turno?: 'manana' | 'tarde' | 'noche' | null;
  peso_venta?: number | null;
  calidad?: 'alta' | 'media' | 'baja' | null;
  observaciones?: string | null;
}

export interface RegistroProduccionUpdate {
  tipo_produccion?: 'leche' | 'carne' | 'lana' | 'otro';
  fecha?: string;
  cantidad_litros?: number | null;
  turno?: 'manana' | 'tarde' | 'noche' | null;
  peso_venta?: number | null;
  calidad?: 'alta' | 'media' | 'baja' | null;
  observaciones?: string | null;
}

export interface RegistroProduccionListResponse {
  total: number;
  items: RegistroProduccion[];
  skip: number;
  limit: number;
}
