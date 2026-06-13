import type { RubroVenta } from '../constants/rubroVenta';
import type { RubroAfectacion } from '../constants/rubroAfectacion';

export interface Transaccion {
  id: number;
  finca_id: number;
  tipo: 'venta' | 'compra' | 'gasto';
  fecha: string;
  concepto: string;
  monto: number;

  animal_id?: number | null;
  numero_animales?: number | null;
  peso_total?: number | null;
  precio_por_kg?: number | null;

  rubro_venta?: RubroVenta | null;
  cantidad_litros?: number | null;
  precio_por_litro?: number | null;

  tercero?: string | null;
  documento_tercero?: string | null;
  metodo_pago?: string | null;
  categoria_gasto?: string | null;
  rubro_afectacion?: RubroAfectacion | null;
  observaciones?: string | null;

  animal_numero?: string | null;
  animal_nombre?: string | null;
  registrado_por?: number | null;
}

export interface TransaccionCreate {
  tipo: 'venta' | 'compra' | 'gasto';
  fecha: string;
  concepto: string;
  monto: number;
  animal_id?: number | null;
  numero_animales?: number | null;
  peso_total?: number | null;
  precio_por_kg?: number | null;
  rubro_venta?: RubroVenta | null;
  cantidad_litros?: number | null;
  precio_por_litro?: number | null;
  tercero?: string | null;
  documento_tercero?: string | null;
  metodo_pago?: string | null;
  categoria_gasto?: string | null;
  rubro_afectacion?: RubroAfectacion | null;
  observaciones?: string | null;
}

export interface TransaccionUpdate {
  tipo?: 'venta' | 'compra' | 'gasto';
  fecha?: string;
  concepto?: string;
  monto?: number;
  animal_id?: number | null;
  numero_animales?: number | null;
  peso_total?: number | null;
  precio_por_kg?: number | null;
  rubro_venta?: RubroVenta | null;
  cantidad_litros?: number | null;
  precio_por_litro?: number | null;
  tercero?: string | null;
  documento_tercero?: string | null;
  metodo_pago?: string | null;
  categoria_gasto?: string | null;
  rubro_afectacion?: RubroAfectacion | null;
  observaciones?: string | null;
}

export interface TransaccionListResponse {
  total: number;
  items: Transaccion[];
  skip: number;
  limit: number;
}

export interface ResumenFinanciero {
  total_ventas: number;
  total_compras: number;
  total_gastos: number;
  balance_neto: number;
  ventas_mes_actual: number;
  gastos_mes_actual: number;
  gasto_por_categoria: Record<string, number>;
  ventas_leche: number;
  ventas_animales: number;
  ventas_otros: number;
  gastos_leche: number;
  gastos_ceba: number;
  gastos_general: number;
  margen_leche: number;
  margen_ceba: number;
}
