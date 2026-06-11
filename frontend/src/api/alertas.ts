import apiClient from './client';

export interface Alerta {
  id: string;
  tipo: 'parto' | 'vacuna' | 'sanitario' | 'reproductivo' | 'retiro_sanitario' | 'dias_abiertos' | 'otro';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  fecha: string;
  animal_id?: number;
  animal_numero?: string;
  animal_nombre?: string;
}

interface DashboardAlertaResponse {
  tipo: string;
  prioridad: 'alta' | 'media' | 'baja';
  animal_id: number;
  animal_numero?: string;
  animal_nombre?: string;
  mensaje: string;
  fecha_limite?: string;
}

export const alertasService = {
  async getAlertas(): Promise<Alerta[]> {
    try {
      const response = await apiClient.get('/dashboard/alertas');
      const items = (response.data?.alertas ?? []) as DashboardAlertaResponse[];
      return items.map((item) => ({
        id: `${item.tipo}-${item.animal_id}-${item.fecha_limite ?? 'na'}`,
        tipo: (item.tipo as Alerta['tipo']) || 'otro',
        prioridad: item.prioridad,
        titulo: item.tipo?.replace('_', ' ')?.toUpperCase?.() ?? 'ALERTA',
        descripcion: item.mensaje,
        fecha: item.fecha_limite ?? new Date().toISOString(),
        animal_id: item.animal_id,
        animal_numero: item.animal_numero,
        animal_nombre: item.animal_nombre,
      }));
    } catch (error) {
      console.error('Error obteniendo alertas:', error);
      return [];
    }
  },
};
