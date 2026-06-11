import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { DistribucionItem, PuntoFinanzas, PuntoProduccion, PuntoReproductivo } from '../../api/metricas';
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
  const hasData = data.some((p) => p.ventas > 0 || p.gastos > 0 || p.compras > 0);
  if (!hasData) {
    return <EmptyChart message="Aún no hay transacciones en este periodo." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={48} />
        <Tooltip formatter={(value, name) => [formatCOP(Number(value ?? 0)), String(name ?? '')]} />
        <Legend />
        <Bar dataKey="ventas" name="Ventas" fill={CHART_SEMANTIC.ventas} radius={[4, 4, 0, 0]} />
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

export { ChartCard, EmptyChart };
