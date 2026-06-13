import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DistribucionItem, PuntoConciliacionLeche, PuntoFinanzas, PuntoProduccion, PuntoReproductivo, ResumenMargenRubro } from '../../api/metricas';
import { CHART_SEMANTIC, colorForEstado, colorForIndex } from '../../utils/chartColors';

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const formatLitros = (value: number) => `${value.toLocaleString('es-CO')} L`;

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
      {message}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <article className="gd-card p-5">
      <h3 className="gd-section-title">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </article>
  );
}

export function InventarioCategoriasChart({ data }: { data: DistribucionItem[] }) {
  if (!data.length) {
    return <EmptyChart message="Sin animales activos registrados." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="valor"
          nameKey="nombre"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          stroke="#fff"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.nombre} fill={colorForIndex(index)} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${Number(value ?? 0)} animales`, 'Cantidad']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function InventarioEstadosChart({ data }: { data: DistribucionItem[] }) {
  if (!data.length) {
    return <EmptyChart message="Sin datos de inventario." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="nombre" width={90} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [`${Number(value ?? 0)}`, 'Animales']} />
        <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.nombre} fill={colorForEstado(entry.nombre)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FinanzasChart({ data }: { data: PuntoFinanzas[] }) {
  const normalized = data.map((p) => ({
    ...p,
    ventas_leche: p.ventas_leche ?? 0,
    ventas_animales: p.ventas_animales ?? 0,
  }));
  const hasData = normalized.some(
    (p) => p.ventas > 0 || p.gastos > 0 || p.compras > 0 || p.ventas_leche > 0 || p.ventas_animales > 0,
  );
  if (!hasData) {
    return <EmptyChart message="Aún no hay transacciones en este periodo." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={normalized}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={48} />
        <Tooltip formatter={(value, name) => [formatCOP(Number(value ?? 0)), String(name ?? '')]} />
        <Legend />
        <Bar dataKey="ventas_leche" name="Venta leche" stackId="ventas" fill="#0284c7" radius={[4, 4, 0, 0]} />
        <Bar dataKey="ventas_animales" name="Venta animales" stackId="ventas" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill={CHART_SEMANTIC.gastos} radius={[4, 4, 0, 0]} />
        <Bar dataKey="compras" name="Compras" fill={CHART_SEMANTIC.compras} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProduccionChart({ data }: { data: PuntoProduccion[] }) {
  const hasData = data.some((p) => p.litros > 0);
  if (!hasData) {
    return <EmptyChart message="Sin registros de leche en este periodo." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${v} L`} width={56} />
        <Tooltip formatter={(value) => [formatLitros(Number(value ?? 0)), 'Litros']} />
        <Legend />
        <Line
          type="monotone"
          dataKey="litros"
          name="Producción leche"
          stroke={CHART_SEMANTIC.produccion}
          strokeWidth={3}
          dot={{ r: 4, fill: CHART_SEMANTIC.produccion, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReproductivoChart({ data }: { data: PuntoReproductivo[] }) {
  const hasData = data.some((p) => p.servicios > 0 || p.partos > 0);
  if (!hasData) {
    return <EmptyChart message="Sin servicios ni partos en este periodo." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} width={32} />
        <Tooltip />
        <Legend />
        <Bar dataKey="servicios" name="Servicios" fill={CHART_SEMANTIC.servicios} radius={[4, 4, 0, 0]} />
        <Bar dataKey="partos" name="Partos" fill={CHART_SEMANTIC.partos} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ConciliacionLecheChart({ data }: { data: PuntoConciliacionLeche[] }) {
  const hasData = data.some((p) => p.litros_ordeñados > 0 || p.litros_vendidos > 0);
  if (!hasData) {
    return <EmptyChart message="Sin datos de leche para conciliar en este periodo." />;
  }

  const chartData = data.map((p) => ({
    ...p,
    litros_ordeñados: p.litros_ordeñados,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${v} L`} width={56} />
        <Tooltip
          formatter={(value, name) => {
            const label = String(name ?? '');
            if (label === 'Ingreso leche') return [formatCOP(Number(value ?? 0)), label];
            return [formatLitros(Number(value ?? 0)), label];
          }}
        />
        <Legend />
        <Bar dataKey="litros_ordeñados" name="Litros ordeñados" fill="#0284c7" radius={[4, 4, 0, 0]} />
        <Bar dataKey="litros_vendidos" name="Litros vendidos" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function MargenCard({
  titulo,
  ingresos,
  gastos,
  margen,
  color,
}: {
  titulo: string;
  ingresos: number;
  gastos: number;
  margen: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">{titulo}</p>
      <dl className="mt-3 space-y-1 text-xs text-slate-600">
        <div className="flex justify-between gap-2">
          <dt>Ingresos</dt>
          <dd className="font-medium tabular-nums text-slate-900">{formatCOP(ingresos)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Gastos asignados</dt>
          <dd className="font-medium tabular-nums text-red-700">{formatCOP(gastos)}</dd>
        </div>
      </dl>
      <p className={`mt-3 text-lg font-bold tabular-nums ${color}`}>{formatCOP(margen)}</p>
      <p className="text-xs text-slate-500">Margen del periodo</p>
    </div>
  );
}

export function MargenRubrosPanel({ data }: { data: ResumenMargenRubro }) {
  const hasData =
    data.ingresos_leche > 0 ||
    data.ingresos_ceba > 0 ||
    data.gastos_leche > 0 ||
    data.gastos_ceba > 0 ||
    data.gastos_general > 0;

  if (!hasData) {
    return <EmptyChart message="Registra ventas y gastos con rubro para ver márgenes." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MargenCard
        titulo="Rubro leche"
        ingresos={data.ingresos_leche}
        gastos={data.gastos_leche}
        margen={data.margen_leche}
        color={data.margen_leche >= 0 ? 'text-sky-700' : 'text-red-600'}
      />
      <MargenCard
        titulo="Rubro ceba / faena"
        ingresos={data.ingresos_ceba}
        gastos={data.gastos_ceba}
        margen={data.margen_ceba}
        color={data.margen_ceba >= 0 ? 'text-emerald-700' : 'text-red-600'}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2 lg:col-span-1">
        <p className="text-sm font-semibold text-slate-800">Gastos generales</p>
        <p className="mt-3 text-lg font-bold tabular-nums text-slate-900">{formatCOP(data.gastos_general)}</p>
        <p className="text-xs text-slate-500">No asignados a un rubro específico</p>
      </div>
    </div>
  );
}

export { ChartCard, EmptyChart };

