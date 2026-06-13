import type { ControlSanitario } from '../types/sanitario';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Vacuna con próxima dosis vencida o dentro de 3 días (misma regla que alertas). */
export const DIAS_ALERTA_VACUNA = 3;

export function vacunaPendienteAplicar(control: ControlSanitario): boolean {
  if (control.tipo !== 'vacuna' || !control.proxima_dosis) {
    return false;
  }

  const hoy = startOfDay(new Date());
  const limite = startOfDay(new Date(control.proxima_dosis));
  const diffDias = Math.round((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return diffDias <= DIAS_ALERTA_VACUNA;
}

export function defaultProximaDosisAnual(fechaAplicacion: string): string {
  const base = new Date(fechaAplicacion);
  base.setFullYear(base.getFullYear() + 1);
  return base.toISOString().split('T')[0];
}
