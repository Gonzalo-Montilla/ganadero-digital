import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import Footer from '../components/Footer';
import { metricasService, type MetricasGraficas } from '../api/metricas';
import {
  ChartCard,
  ConciliacionLecheChart,
  FinanzasChart,
  InventarioCategoriasChart,
  InventarioEstadosChart,
  MargenRubrosPanel,
  ProduccionChart,
  ReproductivoChart,
} from '../components/metricas/MetricasCharts';
import { PieChart } from 'lucide-react';

const PERIODOS = [
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
];

export default function Metricas() {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const { user, logout } = useAuth();
  const [meses, setMeses] = useState(6);
  const [data, setData] = useState<MetricasGraficas | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    void loadMetricas(meses);
  }, [meses]);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const loadMetricas = async (periodo: number) => {
    try {
      setLoading(true);
      const response = await metricasService.getMetricas(periodo);
      setData(response);
    } catch (error) {
      console.error('Error cargando métricas:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppShell
        title="Métricas"
        subtitle="Análisis visual de inventario, finanzas, producción y reproducción"
        userName={user?.nombre_completo}
        role={user?.rol}
        online={online}
        onLogout={logout}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Periodo de analisis</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Periodo">
              {PERIODOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMeses(item.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    meses === item.value
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void loadMetricas(meses)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
              Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="gd-card p-10 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <p className="mt-4 text-sm font-medium text-slate-600">Cargando gráficas...</p>
          </div>
        ) : !data ? (
          <div className="gd-card p-10 text-center">
            <PieChart className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No se pudieron cargar las métricas</p>
            <p className="mt-1 text-xs text-slate-500">Verifica tu conexión e intenta de nuevo.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Inventario por categoría" subtitle="Animales activos">
                <InventarioCategoriasChart data={data.inventario_categorias} />
              </ChartCard>
              <ChartCard title="Inventario por estado" subtitle="Todos los registros">
                <InventarioEstadosChart data={data.inventario_estados} />
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Finanzas mensuales" subtitle={`Últimos ${data.meses} meses — ventas, gastos y compras`}>
                <FinanzasChart data={data.finanzas} />
              </ChartCard>
              <ChartCard title="Producción de leche" subtitle={`Litros totales por mes (${data.meses} meses)`}>
                <ProduccionChart data={data.produccion} />
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard
                title="Conciliación de leche"
                subtitle="Litros ordeñados (Producción) vs litros vendidos (Finanzas)"
              >
                <ConciliacionLecheChart data={data.conciliacion_leche} />
                {data.conciliacion_leche.some((p) => p.litros_ordeñados > 0 || p.litros_vendidos > 0) && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500">
                          <th className="py-2 pr-3">Mes</th>
                          <th className="py-2 pr-3">Ordeñados</th>
                          <th className="py-2 pr-3">Vendidos</th>
                          <th className="py-2 pr-3">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.conciliacion_leche.map((row) => (
                          <tr key={row.mes} className="border-b border-slate-100">
                            <td className="py-2 pr-3 font-medium text-slate-800">{row.etiqueta}</td>
                            <td className="py-2 pr-3 tabular-nums">{row.litros_ordeñados.toLocaleString('es-CO')} L</td>
                            <td className="py-2 pr-3 tabular-nums">{row.litros_vendidos.toLocaleString('es-CO')} L</td>
                            <td
                              className={`py-2 pr-3 tabular-nums font-semibold ${
                                row.diferencia === 0
                                  ? 'text-slate-600'
                                  : row.diferencia > 0
                                  ? 'text-amber-700'
                                  : 'text-red-600'
                              }`}
                            >
                              {row.diferencia > 0 ? '+' : ''}
                              {row.diferencia.toLocaleString('es-CO')} L
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>
              <ChartCard title="Margen por rubro" subtitle={`Ingresos menos gastos asignados (${data.meses} meses)`}>
                <MargenRubrosPanel data={data.margen_rubros} />
              </ChartCard>
            </section>

            <section>
              <ChartCard title="Actividad reproductiva" subtitle="Servicios y partos por mes">
                <ReproductivoChart data={data.reproductivo} />
              </ChartCard>
            </section>
          </div>
        )}
      </AppShell>
      <Footer />
    </>
  );
}
