import api from './config';

export interface Alerta {
  id: string;
  tipo: 'parto' | 'vacuna' | 'sanitario' | 'reproductivo' | 'otro';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  fecha: string;
  animal_id?: number;
  animal_numero?: string;
  animal_nombre?: string;
}

export const alertasService = {
  async getAlertas(): Promise<Alerta[]> {
    try {
      const [reproductivos, sanitarios] = await Promise.all([
        api.get('/control-reproductivo/'),
        api.get('/control-sanitario/'),
      ]);

      const alertas: Alerta[] = [];
      const hoy = new Date();
      const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Alertas de próximos partos (30 días)
      reproductivos.data.items?.forEach((r: any) => {
        if (r.fecha_probable_parto && r.diagnostico === 'prenada') {
          const fechaParto = new Date(r.fecha_probable_parto);
          if (fechaParto >= hoy && fechaParto <= treintaDias) {
            const diasRestantes = Math.ceil((fechaParto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            alertas.push({
              id: `parto-${r.id}`,
              tipo: 'parto',
              prioridad: diasRestantes <= 7 ? 'alta' : 'media',
              titulo: 'Próximo Parto',
              descripcion: `${r.animal_numero || 'Animal'} - Parto estimado en ${diasRestantes} días`,
              fecha: r.fecha_probable_parto,
              animal_id: r.animal_id,
              animal_numero: r.animal_numero,
              animal_nombre: r.animal_nombre,
            });
          }
        }
      });

      // Alertas de vacunas/tratamientos recientes (últimos 30 días)
      sanitarios.data.items?.forEach((s: any) => {
        const fechaEvento = new Date(s.fecha_evento);
        const diasDesde = Math.ceil((hoy.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasDesde <= 30 && diasDesde >= 0) {
          alertas.push({
            id: `sanitario-${s.id}`,
            tipo: 'sanitario',
            prioridad: 'baja',
            titulo: `Control: ${s.tipo_evento}`,
            descripcion: `${s.animal_numero || 'Animal'} - ${s.producto || s.tipo_evento} hace ${diasDesde} días`,
            fecha: s.fecha_evento,
            animal_id: s.animal_id,
            animal_numero: s.animal_numero,
            animal_nombre: s.animal_nombre,
          });
        }
      });

      // Ordenar por fecha
      return alertas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    } catch (error) {
      console.error('Error obteniendo alertas:', error);
      return [];
    }
  },
};
