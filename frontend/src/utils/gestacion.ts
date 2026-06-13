import type { ControlReproductivo } from '../types/reproductivo';

/** True si ya hubo parto, aborto o diagnóstico vacío/dudoso después de este registro. */
export function gestacionCerradaTrasRegistro(
  registro: ControlReproductivo,
  historial: ControlReproductivo[],
): boolean {
  return historial.some(
    (evento) =>
      evento.animal_id === registro.animal_id &&
      evento.fecha_evento > registro.fecha_evento &&
      (evento.tipo_evento === 'parto' ||
        evento.tipo_evento === 'aborto' ||
        (evento.tipo_evento === 'diagnostico' &&
          (evento.diagnostico === 'vacia' || evento.diagnostico === 'dudosa'))),
  );
}

export function puedeRegistrarPartoDesdeDiagnostico(
  control: ControlReproductivo,
  historial: ControlReproductivo[],
): boolean {
  if (control.tipo_evento !== 'diagnostico' || control.diagnostico !== 'prenada') {
    return false;
  }
  if (gestacionCerradaTrasRegistro(control, historial)) {
    return false;
  }
  const prenadasAbiertas = historial
    .filter(
      (c) =>
        c.animal_id === control.animal_id &&
        c.tipo_evento === 'diagnostico' &&
        c.diagnostico === 'prenada' &&
        !gestacionCerradaTrasRegistro(c, historial),
    )
    .sort((a, b) => b.fecha_evento.localeCompare(a.fecha_evento));
  return prenadasAbiertas[0]?.id === control.id;
}

export function encontrarDiagnosticoPrenadaAbierto(
  animalId: number,
  historial: ControlReproductivo[],
): ControlReproductivo | undefined {
  return historial
    .filter(
      (c) =>
        c.animal_id === animalId &&
        c.tipo_evento === 'diagnostico' &&
        c.diagnostico === 'prenada' &&
        !gestacionCerradaTrasRegistro(c, historial),
    )
    .sort((a, b) => b.fecha_evento.localeCompare(a.fecha_evento))[0];
}

/** Estima FPP cuando el usuario ingresa días de gestación en un diagnóstico. */
export function calcularFppDesdeDiagnostico(
  fechaDiagnostico: string,
  diasGestacion: number,
  gestacionTotal = 283,
): string {
  const base = new Date(fechaDiagnostico);
  const diasRestantes = Math.max(gestacionTotal - diasGestacion, 0);
  base.setDate(base.getDate() + diasRestantes);
  return base.toISOString().split('T')[0];
}
