import apiClient from './client';

export interface DistribucionItem {
  nombre: string;
  valor: number;
}

export interface PuntoFinanzas {
  etiqueta: string;
  mes: string;
  ventas: number;
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

export interface MetricasGraficas {
  meses: number;
  inventario_categorias: DistribucionItem[];
  inventario_estados: DistribucionItem[];
  finanzas: PuntoFinanzas[];
  produccion: PuntoProduccion[];
  reproductivo: PuntoReproductivo[];
}

export const metricasService = {
  async getMetricas(meses: number = 6): Promise<MetricasGraficas> {
    const response = await apiClient.get('/dashboard/metricas', { params: { meses } });
    return response.data;
  },
};

export default metricasService;
