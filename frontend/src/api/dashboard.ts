import api from './config';

export interface DashboardStats {
  total_animales: number;
  animales_activos: number;
  controles_sanitarios_mes: number;
  hembras_prenadas: number;
  produccion_leche_mes: number;
  balance_mes: number;
  alertas_pendientes: number;
  proximos_partos: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      // Obtener datos de diferentes endpoints
      const [animales, sanitarios, reproductivos, produccion, transacciones] = await Promise.all([
        api.get('/animales/'),
        api.get('/control-sanitario/'),
        api.get('/control-reproductivo/'),
        api.get('/produccion/'),
        api.get('/transacciones/'),
      ]);
      // Debug: ver qué datos llegan
      console.log('Dashboard - Datos recibidos:', {
        animales: animales.data,
        sanitarios: sanitarios.data,
        reproductivos: reproductivos.data,
        produccion: produccion.data,
        transacciones: transacciones.data,
      });

      // Calcular estadísticas
      const totalAnimales = animales.data.total || 0;
      const animalesActivos = animales.data.items?.filter((a: any) => a.estado === 'activo').length || 0;

      // Controles sanitarios del mes actual - usar fecha_evento en lugar de fecha_aplicacion
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const mesStr = inicioMes.toISOString().split('T')[0];
      const controlesMes = sanitarios.data.items?.filter((c: any) => c.fecha_evento >= mesStr).length || 0;

      // Hembras preñadas - buscar el último diagnóstico por animal
      const diagnosticosPorAnimal = new Map();
      reproductivos.data.items?.forEach((r: any) => {
        if (r.tipo_evento === 'diagnostico' && r.animal_id) {
          const existing = diagnosticosPorAnimal.get(r.animal_id);
          if (!existing || new Date(r.fecha_evento) > new Date(existing.fecha_evento)) {
            diagnosticosPorAnimal.set(r.animal_id, r);
          }
        }
      });
      const hembrasPrenádas = Array.from(diagnosticosPorAnimal.values())
        .filter((r: any) => r.diagnostico === 'prenada').length;

      // Producción de leche del mes
      const produccionMes = produccion.data.items
        ?.filter((p: any) => p.fecha >= mesStr)
        .reduce((sum: number, p: any) => sum + (p.cantidad_litros || 0), 0) || 0;

      // Balance del mes
      const ventasMes = transacciones.data.items
        ?.filter((t: any) => t.tipo === 'venta' && t.fecha >= mesStr)
        .reduce((sum: number, t: any) => sum + t.monto, 0) || 0;
      const gastosMes = transacciones.data.items
        ?.filter((t: any) => (t.tipo === 'compra' || t.tipo === 'gasto') && t.fecha >= mesStr)
        .reduce((sum: number, t: any) => sum + t.monto, 0) || 0;
      const balanceMes = ventasMes - gastosMes;

      // Próximos partos (próximos 30 días)
      const hoy = new Date();
      const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
      const proximosPartos = reproductivos.data.items?.filter((r: any) => {
        if (!r.fecha_probable_parto) return false;
        const fechaParto = new Date(r.fecha_probable_parto);
        return fechaParto >= hoy && fechaParto <= treintaDias;
      }).length || 0;

      console.log('Dashboard - Estadísticas calculadas:', {
        totalAnimales,
        animalesActivos,
        controlesMes,
        hembrasPrenádas,
        produccionMes,
        ventasMes,
        gastosMes,
        balanceMes,
        proximosPartos,
      });

      return {
        total_animales: totalAnimales,
        animales_activos: animalesActivos,
        controles_sanitarios_mes: controlesMes,
        hembras_prenadas: hembrasPrenádas,
        produccion_leche_mes: produccionMes,
        balance_mes: balanceMes,
        alertas_pendientes: proximosPartos + controlesMes,
        proximos_partos: proximosPartos,
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
      };
    }
  },
};
