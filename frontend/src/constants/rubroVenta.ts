export type RubroVenta = 'animal_sacrificio' | 'leche' | 'otro';

export const RUBRO_VENTA_LABELS: Record<RubroVenta, string> = {
  animal_sacrificio: 'Animal para sacrificio/faena',
  leche: 'Venta de leche',
  otro: 'Otra venta',
};

export const RUBRO_VENTA_HINTS: Record<RubroVenta, string> = {
  animal_sacrificio: 'Venta del animal vivo para faena. El animal sale del inventario.',
  leche: 'Ingreso por litros vendidos (cooperativa, planta, cliente). Las vacas siguen en inventario.',
  otro: 'Otros ingresos no clasificados arriba.',
};
