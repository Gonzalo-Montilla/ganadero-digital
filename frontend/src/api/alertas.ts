import apiClient from './client';
import {
  formatearDescripcionAlerta,
  formatearUrgenciaFecha,
} from '../utils/alertasDisplay';

export interface Alerta {
  id: string;
  tipo: 'parto' | 'vacuna' | 'sanitario' | 'reproductivo' | 'retiro_sanitario' | 'dias_abiertos' | 'otro';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  descripcionCorta: string;
  urgenciaTexto: string;
  tieneFechaLimite: boolean;
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

export const TIPO_LABELS: Record<string, string> = {
  vacuna: 'Vacuna / refuerzo',
  parto: 'Parto próximo',
  sanitario: 'Control sanitario',
  reproductivo: 'Control reproductivo',
  retiro_sanitario: 'Retiro sanitario',
  dias_abiertos: 'Días abiertos',
  otro: 'Alerta',
};

export function getRutaAlerta(tipo: Alerta['tipo']): string {
  switch (tipo) {
    case 'vacuna':
    case 'sanitario':
    case 'retiro_sanitario':
      return '/control-sanitario';
    case 'parto':
    case 'reproductivo':
    case 'dias_abiertos':
      return '/control-reproductivo';
    default:
      return '/animales';
  }
}

export function getRutaAlertaDetalle(alerta: Alerta): string {
  const base = getRutaAlerta(alerta.tipo);
  if (!alerta.animal_id) {
    return base;
  }

  const params = new URLSearchParams({ animal_id: String(alerta.animal_id) });
  if (alerta.animal_numero) {
    params.set('animal_numero', alerta.animal_numero);
  }
  if (alerta.tipo === 'parto') {
    params.set('accion', 'registrar_parto');
  }
  if (alerta.tipo === 'vacuna') {
    params.set('accion', 'aplicar_vacuna');
  }
  if (alerta.tipo === 'dias_abiertos') {
    params.set('accion', 'nuevo_servicio');
  }
  return `${base}?${params.toString()}`;
}

export const alertasService = {
  async getAlertas(): Promise<Alerta[]> {
    try {
      const response = await apiClient.get('/dashboard/alertas');
      const items = (response.data?.alertas ?? []) as DashboardAlertaResponse[];
      return items.map((item) => {
        const tipo = (item.tipo as Alerta['tipo']) || 'otro';
        const fecha = item.fecha_limite ?? '';
        return {
          id: `${item.tipo}-${item.animal_id}-${item.fecha_limite ?? 'na'}`,
          tipo,
          prioridad: item.prioridad,
          titulo: TIPO_LABELS[item.tipo] ?? TIPO_LABELS.otro,
          descripcion: item.mensaje,
          descripcionCorta: formatearDescripcionAlerta(item.mensaje, tipo),
          urgenciaTexto: formatearUrgenciaFecha(fecha || undefined, tipo),
          tieneFechaLimite: Boolean(fecha),
          fecha: fecha || new Date().toISOString(),
          animal_id: item.animal_id,
          animal_numero: item.animal_numero,
          animal_nombre: item.animal_nombre,
        };
      });
    } catch (error) {
      console.error('Error obteniendo alertas:', error);
      return [];
    }
  },
};
