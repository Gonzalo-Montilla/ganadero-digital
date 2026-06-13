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

export const metricasService = {
  async getMetricas(meses: number = 6): Promise<MetricasGraficas> {
    const response = await apiClient.get('/dashboard/metricas', { params: { meses } });
    return response.data;
  },
};

export default metricasService;
