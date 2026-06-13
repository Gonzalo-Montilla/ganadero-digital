import type { Alerta } from '../api/alertas';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatearDescripcionAlerta(mensaje: string, tipo: Alerta['tipo']): string {
  const vacunaMatch = mensaje.match(/pendiente:\s*(.+)/i);
  if (tipo === 'vacuna' && vacunaMatch?.[1]) {
    return `Pendiente: ${vacunaMatch[1].trim()}`;
  }

  if (tipo === 'parto') {
    return mensaje.replace(/^parto proximo en /i, 'En ').replace(/^Parto proximo en /i, 'En ');
  }

  return mensaje;
}

export function formatearUrgenciaFecha(fechaIso: string | undefined, tipo: Alerta['tipo']): string {
  if (!fechaIso || fechaIso === 'na') {
    if (tipo === 'dias_abiertos') {
      return 'Revisión recomendada';
    }
    return 'Sin fecha límite';
  }

  const hoy = startOfDay(new Date());
  const limite = startOfDay(new Date(fechaIso));
  const diffMs = limite.getTime() - hoy.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    const dias = Math.abs(diffDias);
    return dias === 1 ? 'Venció ayer' : `Venció hace ${dias} días`;
  }
  if (diffDias === 0) return 'Vence hoy';
  if (diffDias === 1) return 'Vence mañana';
  if (diffDias <= 7) return `Faltan ${diffDias} días`;
  if (diffDias <= 30) return `Faltan ${diffDias} días`;

  return `Programado para ${limite.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}`;
}
