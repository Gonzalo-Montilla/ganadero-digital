export const MOTIVOS_MUERTE = [
  { value: 'accidente', label: 'Accidente' },
  { value: 'enfermedad', label: 'Enfermedad' },
  { value: 'parto', label: 'Complicación de parto' },
  { value: 'depredador', label: 'Ataque / depredador' },
  { value: 'vejez', label: 'Vejez / debilitamiento' },
  { value: 'otro', label: 'Otra causa' },
] as const;

export type MotivoMuerte = (typeof MOTIVOS_MUERTE)[number]['value'];

export function labelMotivoMuerte(value: string): string {
  return MOTIVOS_MUERTE.find((m) => m.value === value)?.label ?? value;
}
