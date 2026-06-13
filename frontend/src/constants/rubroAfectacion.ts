export type RubroAfectacion = 'leche' | 'ceba' | 'general';

export const RUBRO_AFECTACION_LABELS: Record<RubroAfectacion, string> = {
  leche: 'Leche (ordeño)',
  ceba: 'Ceba / faena',
  general: 'General (toda la finca)',
};

export const RUBRO_AFECTACION_HINTS: Record<RubroAfectacion, string> = {
  leche: 'Concentrados, sal mineral, insumos del tanque, mano de obra de ordeño.',
  ceba: 'Suplementos, pastos de engorde, manejo de lotes de ceba.',
  general: 'Gastos compartidos: administración, servicios, infraestructura común.',
};
