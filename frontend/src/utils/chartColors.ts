/**
 * Paleta accesible (tonos distintos para deuteranopia/protanopia).
 * Basada en Wong / Okabe-Ito.
 */
export const CHART_PALETTE = [
  '#0072B2', // azul
  '#E69F00', // naranja
  '#CC79A7', // rosa
  '#56B4E9', // celeste
  '#D55E00', // rojo-naranja
  '#009E73', // verde azulado (único verde)
  '#F0E442', // amarillo
  '#999999', // gris
] as const;

export const CHART_SEMANTIC = {
  ventas: '#0072B2',
  gastos: '#D55E00',
  compras: '#CC79A7',
  produccion: '#0072B2',
  servicios: '#56B4E9',
  partos: '#E69F00',
} as const;

/** Colores fijos por etiqueta de estado de inventario */
export const ESTADO_CHART_COLORS: Record<string, string> = {
  Activos: '#0072B2',
  Vendidos: '#E69F00',
  Muertos: '#D55E00',
  Eliminados: '#999999',
  Transferidos: '#CC79A7',
  Desconocido: '#56B4E9',
};

export function colorForIndex(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

export function colorForEstado(nombre: string): string {
  return ESTADO_CHART_COLORS[nombre] ?? colorForIndex(nombre.length);
}
