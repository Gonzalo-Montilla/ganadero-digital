import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dashboardService, type DashboardStats } from '../api/dashboard';
import AlertasWidget from '../components/AlertasWidget';
import Footer from '../components/Footer';
import AppShell from '../components/AppShell';
import { Activity, Baby, BarChart3, DollarSign, HeartPulse, Stethoscope, Wallet } from 'lucide-react';

const quickActions = [
  { to: '/animales', Icon: Activity, title: 'Animales', description: 'Inventario y hoja de vida' },
  { to: '/control-sanitario', Icon: Stethoscope, title: 'Sanidad', description: 'Vacunas y tratamientos' },
  { to: '/control-reproductivo', Icon: Baby, title: 'Reproductivo', description: 'Servicios y partos' },
  { to: '/produccion', Icon: BarChart3, title: 'Produccion', description: 'Leche, peso y rendimiento' },
  { to: '/transacciones', Icon: Wallet, title: 'Finanzas', description: 'Ingresos y gastos' },
];

export default function Dashboard() {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<boolean>(isOnline);

  useEffect(() => {
    loadStats();
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  const kpis = [
    {
      label: 'Total Animales',
      value: stats?.total_animales ?? 0,
      detail: `${stats?.animales_activos ?? 0} activos`,
      Icon: Activity,
      to: '/animales',
    },
    {
      label: 'Alertas Sanitarias',
      value: stats?.controles_sanitarios_mes ?? 0,
      detail: 'revisar esta semana',
      Icon: HeartPulse,
      to: '/control-sanitario',
    },
    {
      label: 'Hembras Prenadas',
      value: stats?.hembras_prenadas ?? 0,
      detail: `${stats?.proximos_partos ?? 0} partos proximos`,
      Icon: Baby,
      to: '/control-reproductivo',
    },
    {
      label: 'Balance del Mes',
      value: formatMoney(stats?.balance_mes ?? 0),
      detail: 'ingresos - gastos',
      Icon: DollarSign,
      to: '/transacciones',
    },
  ];

  return (
    <>
      <AppShell
        title="Panel de Finca"
        subtitle="Resumen del dia y tareas prioritarias"
        userName={user?.nombre_completo}
        role={user?.rol}
        online={online}
        onLogout={logout}
        rightSlot={
          <button onClick={loadStats} className="gd-btn-secondary !py-2">
            Actualizar
          </button>
        }
      >
        {loading ? (
          <div className="gd-card p-10 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <p className="mt-4 text-sm font-medium text-slate-600">Cargando indicadores...</p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className="gd-card p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">{item.value}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
                    </div>
                    <item.Icon className="h-8 w-8 text-brand-700" />
                  </div>
                </button>
              ))}
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="gd-card p-5">
                <p className="text-sm font-semibold text-slate-500">Carga animal</p>
                <p className="mt-1 text-3xl font-extrabold text-brand-700">{stats?.carga_animal_hectarea ?? 0}</p>
                <p className="text-xs text-slate-500">cabezas por hectarea</p>
              </div>
              <div className="gd-card p-5">
                <p className="text-sm font-semibold text-slate-500">Costo por litro</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatMoney(stats?.costo_por_litro ?? 0)}</p>
                <p className="text-xs text-slate-500">estimado mensual</p>
              </div>
              <div className="gd-card p-5">
                <p className="text-sm font-semibold text-slate-500">Costo por kilo</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatMoney(stats?.costo_por_kg_estimado ?? 0)}</p>
                <p className="text-xs text-slate-500">estimado por activo</p>
              </div>
            </section>

            <section className="mt-5">
              <AlertasWidget />
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="gd-card p-5">
                <h3 className="gd-section-title">Analisis de descarte</h3>
                {stats?.analisis_descarte?.length ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {stats.analisis_descarte.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="rounded-xl bg-slate-50 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No hay animales marcados para descarte.</p>
                )}
              </div>

              <div className="gd-card p-5">
                <h3 className="gd-section-title">Proyeccion de inventario</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {Object.entries(stats?.proyeccion_inventario || {}).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">{key.split('_').join(' ')}</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-5 gd-card p-5">
              <h3 className="gd-section-title">Acciones rapidas</h3>
              <p className="mt-1 text-sm text-slate-500">Todo en pocos toques para trabajar en campo.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {quickActions.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-left transition hover:border-brand-300 hover:bg-brand-100"
                  >
                    <item.Icon className="h-7 w-7 text-brand-700" />
                    <p className="mt-2 text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </AppShell>
      <Footer />
    </>
  );
}
