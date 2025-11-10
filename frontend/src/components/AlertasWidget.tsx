import { useState, useEffect } from 'react';
import { alertasService, type Alerta } from '../api/alertas';

export default function AlertasWidget() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlertas();
  }, []);

  const loadAlertas = async () => {
    try {
      setLoading(true);
      const data = await alertasService.getAlertas();
      setAlertas(data.slice(0, 5)); // Solo mostrar las 5 más importantes
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'border-l-4 border-red-500 bg-red-50';
      case 'media': return 'border-l-4 border-yellow-500 bg-yellow-50';
      default: return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'parto': return '🍼';
      case 'vacuna': return '💉';
      case 'sanitario': return '🏥';
      case 'reproductivo': return '🐄';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">🔔 Alertas</h2>
        <span className="text-sm text-gray-500">{alertas.length} activas</span>
      </div>

      {alertas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p>No hay alertas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`p-3 rounded-lg ${getPrioridadColor(alerta.prioridad)} transition hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getTipoIcon(alerta.tipo)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {alerta.titulo}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">
                    {alerta.descripcion}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alerta.fecha).toLocaleDateString('es-CO')}
                  </p>
                </div>
                {alerta.prioridad === 'alta' && (
                  <span className="text-red-500 text-xs font-bold">!</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
