import apiClient from './client';

export interface DashboardStats {
  total_animales: number;
  animales_activos: number;
  controles_sanitarios_mes: number;
  hembras_prenadas: number;
  produccion_leche_mes: number;
  balance_mes: number;
  alertas_pendientes: number;
  proximos_partos: number;
  carga_animal_hectarea: number;
  costo_por_litro: number;
  costo_por_kg_estimado: number;
  analisis_descarte: string[];
  proyeccion_inventario: Record<string, number>;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get('/dashboard/');
      const data = response.data;

      return {
        total_animales: data.inventario.total_animales ?? 0,
        animales_activos: data.inventario.animales_activos ?? 0,
        controles_sanitarios_mes: data.sanidad.proximas_vacunas ?? 0,
        hembras_prenadas: data.reproduccion.hembras_prenadas ?? 0,
        produccion_leche_mes: data.produccion.produccion_leche_mes ?? 0,
        balance_mes: data.finanzas.balance_mes ?? 0,
        alertas_pendientes: (data.sanidad.proximas_vacunas ?? 0) + (data.reproduccion.proximos_partos_30_dias ?? 0),
        proximos_partos: data.reproduccion.proximos_partos_30_dias ?? 0,
        carga_animal_hectarea: data.inventario.carga_animal_hectarea ?? 0,
        costo_por_litro: data.produccion.costo_por_litro ?? 0,
        costo_por_kg_estimado: data.finanzas.costo_por_kg_estimado ?? 0,
        analisis_descarte: data.analisis_descarte ?? [],
        proyeccion_inventario: data.proyeccion_inventario ?? {},
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total_animales: 0,
        animales_activos: 0,
        controles_sanitarios_mes: 0,
        hembras_prenadas: 0,
        produccion_leche_mes: 0,
        balance_mes: 0,
        alertas_pendientes: 0,
        proximos_partos: 0,
        carga_animal_hectarea: 0,
        costo_por_litro: 0,
        costo_por_kg_estimado: 0,
        analisis_descarte: [],
        proyeccion_inventario: {},
      };
    }
  },
};
