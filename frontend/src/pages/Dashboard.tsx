import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dashboardService, type DashboardStats } from '../api/dashboard';
import AlertasWidget from '../components/AlertasWidget';
import Footer from '../components/Footer';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
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

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">🐄 HACIENDA MÁLAGA</h1>
            <p className="text-sm text-gray-600">Ganadero Digital</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.nombre_completo} ({user?.rol})
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/animales')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Animales</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.total_animales || 0}</p>
                    <p className="text-xs text-green-600 mt-1">{stats?.animales_activos || 0} activos</p>
                  </div>
                  <div className="text-4xl">🐄</div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/control-sanitario')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Controles Mes</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.controles_sanitarios_mes || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">Sanitarios</p>
                  </div>
                  <div className="text-4xl">💉</div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/control-reproductivo')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Hembras Preñadas</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.hembras_prenadas || 0}</p>
                    {stats?.proximos_partos ? (
                      <p className="text-xs text-pink-600 mt-1">{stats.proximos_partos} partos próximos</p>
                    ) : null}
                  </div>
                  <div className="text-4xl">🤰</div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/transacciones')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Balance Mes</p>
                    <p className={`text-3xl font-bold ${(stats?.balance_mes || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoney(stats?.balance_mes || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Ingresos - Gastos</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
            </div>

            {/* Widget de Alertas */}
            <div className="mt-6">
              <AlertasWidget />
            </div>
          </>
        )}

        {/* Bienvenida */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ¡Bienvenido, {user?.nombre_completo}!
          </h2>
          <p className="text-gray-600">
            Este es tu panel de control. Desde aquí podrás gestionar tu finca, 
            registrar animales, llevar control sanitario y reproductivo, 
            y manejar las finanzas de tu explotación ganadera.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/animales')}
              className="block w-full text-left p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
            >
              <div className="text-3xl mb-2">🐂</div>
              <h3 className="font-semibold text-gray-900">Animales</h3>
              <p className="text-sm text-gray-600">Gestionar inventario</p>
            </button>
            <button
              onClick={() => navigate('/control-sanitario')}
              className="block w-full text-left p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <div className="text-3xl mb-2">💉</div>
              <h3 className="font-semibold text-gray-900">Sanidad</h3>
              <p className="text-sm text-gray-600">Control sanitario</p>
            </button>
            <button
              onClick={() => navigate('/control-reproductivo')}
              className="block w-full text-left p-4 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition"
            >
              <div className="text-3xl mb-2">🍼</div>
              <h3 className="font-semibold text-gray-900">Reproducción</h3>
              <p className="text-sm text-gray-600">Servicios y partos</p>
            </button>
            <button
              onClick={() => navigate('/produccion')}
              className="block w-full text-left p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition"
            >
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900">Producción</h3>
              <p className="text-sm text-gray-600">Leche, carne y más</p>
            </button>
            <button
              onClick={() => navigate('/transacciones')}
              className="block w-full text-left p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
            >
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold text-gray-900">Transacciones</h3>
              <p className="text-sm text-gray-600">Ingresos y gastos</p>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
