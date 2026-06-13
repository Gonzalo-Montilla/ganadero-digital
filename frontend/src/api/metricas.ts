import apiClient from './client';

export interface DistribucionItem {
  nombre: string;
  valor: number;
}

export interface PuntoFinanzas {
  etiqueta: string;
  mes: string;
  ventas: number;
  ventas_leche: number;
  ventas_animales: number;
  ventas_otros: number;
  gastos: number;
  compras: number;
  balance: number;
}

export interface PuntoProduccion {
  etiqueta: string;
  mes: string;
  litros: number;
}

export interface PuntoReproductivo {
  etiqueta: string;
  mes: string;
  servicios: number;
  partos: number;
}

export interface PuntoConciliacionLeche {
  etiqueta: string;
  mes: string;
  litros_ordeñados: number;
  litros_vendidos: number;
  diferencia: number;
  ingreso_leche: number;
}

export interface ResumenMargenRubro {
  ingresos_leche: number;
  gastos_leche: number;
  margen_leche: number;
  ingresos_ceba: number;
  gastos_ceba: number;
  margen_ceba: number;
  gastos_general: number;
}

export interface MetricasGraficas {
  meses: number;
  inventario_categorias: DistribucionItem[];
  inventario_estados: DistribucionItem[];
  finanzas: PuntoFinanzas[];
  produccion: PuntoProduccion[];
  reproductivo: PuntoReproductivo[];
  conciliacion_leche: PuntoConciliacionLeche[];
  margen_rubros: ResumenMargenRubro;
}

const DEFAULT_MARGEN_RUBROS: ResumenMargenRubro = {
  ingresos_leche: 0,
  gastos_leche: 0,
  margen_leche: 0,
  ingresos_ceba: 0,
  gastos_ceba: 0,
  margen_ceba: 0,
  gastos_general: 0,
};

/** Tolera respuestas de backend aún sin conciliación/margen (deploy desincronizado). */
function normalizeMetricas(raw: Partial<MetricasGraficas> & { meses?: number }): MetricasGraficas {
  return {
    meses: raw.meses ?? 6,
    inventario_categorias: raw.inventario_categorias ?? [],
    inventario_estados: raw.inventario_estados ?? [],
    finanzas: (raw.finanzas ?? []).map((punto) => ({
      ...punto,
      ventas_leche: punto.ventas_leche ?? 0,
      ventas_animales: punto.ventas_animales ?? 0,
      ventas_otros: punto.ventas_otros ?? 0,
    })),
    produccion: raw.produccion ?? [],
    reproductivo: raw.reproductivo ?? [],
    conciliacion_leche: raw.conciliacion_leche ?? [],
    margen_rubros: raw.margen_rubros ?? DEFAULT_MARGEN_RUBROS,
  };
}

export const metricasService = {
  async getMetricas(meses: number = 6): Promise<MetricasGraficas> {
    const response = await apiClient.get('/dashboard/metricas', { params: { meses } });
    return normalizeMetricas(response.data);
  },
};

export default metricasService;
