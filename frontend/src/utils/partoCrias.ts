import type { Animal } from '../types/animal';
import type { CriaPartoInventario } from '../types/reproductivo';

export function createEmptyCria(madre?: Animal | null): CriaPartoInventario {
  return {
    vitalidad: 'viva',
    numero_identificacion: '',
    nombre: '',
    sexo: '',
    peso_nacimiento: undefined,
    color: madre?.color || '',
    raza: madre?.raza || '',
    lote_actual: madre?.lote_actual || '',
    potrero_actual: madre?.potrero_actual || '',
    proposito: madre?.proposito || 'carne',
    observaciones: '',
  };
}

export function syncCriasCount(
  crias: CriaPartoInventario[],
  count: number,
  madre?: Animal | null,
): CriaPartoInventario[] {
  const safeCount = Math.min(Math.max(count, 1), 5);
  const next = [...crias];
  while (next.length < safeCount) {
    next.push(createEmptyCria(madre));
  }
  while (next.length > safeCount) {
    next.pop();
  }
  return next;
}

export function criaRequiereInventario(vitalidad: string): boolean {
  return vitalidad === 'viva' || vitalidad === 'debil';
}

export function validarCriasParto(crias: CriaPartoInventario[]): string | null {
  if (!crias.length) {
    return 'Debe indicar al menos una cría en el parto';
  }
  const chapetas = new Set<string>();
  for (let i = 0; i < crias.length; i++) {
    const cria = crias[i];
    if (criaRequiereInventario(cria.vitalidad)) {
      if (!cria.numero_identificacion?.trim()) {
        return `Cría ${i + 1}: la chapeta es obligatoria para crías vivas o débiles`;
      }
      if (!cria.sexo) {
        return `Cría ${i + 1}: el sexo es obligatorio para crías vivas o débiles`;
      }
      const chapeta = cria.numero_identificacion.trim();
      if (chapetas.has(chapeta)) {
        return `Cría ${i + 1}: chapeta duplicada en el mismo parto`;
      }
      chapetas.add(chapeta);
    }
  }
  return null;
}
