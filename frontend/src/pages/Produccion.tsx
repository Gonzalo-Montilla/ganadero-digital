import { useState, useEffect } from 'react';
import { produccionService } from '../api/produccion';
import ProduccionModal from '../components/ProduccionModal';
import type { RegistroProduccion } from '../types/produccion';

export default function ProduccionPage() {
  const [registros, setRegistros] = useState<RegistroProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroProduccion | null>(null);

  // Estadísticas
  const [stats, setStats] = useState({
    totalLeche: 0,
    promedioDiario: 0,
    registrosHoy: 0,
    registrosMes: 0,
  });

  useEffect(() => {
    loadRegistros();
  }, [filtroTipo]);

  const loadRegistros = async () => {
    try {
      setLoading(true);
      const response = await produccionService.getRegistros({
        tipo_produccion: filtroTipo || undefined,
        limit: 100,
      });
      setRegistros(response.items);
      setTotal(response.total);
      calculateStats(response.items);
    } catch (error) {
      console.error('Error cargando registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: RegistroProduccion[]) => {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const mesStr = inicioMes.toISOString().split('T')[0];

    const lecheros = data.filter(r => r.tipo_produccion === 'leche');
    const totalLeche = lecheros.reduce((sum, r) => sum + (r.cantidad_litros || 0), 0);
    const registrosHoy = data.filter(r => r.fecha === hoy).length;
    const registrosMes = data.filter(r => r.fecha >= mesStr).length;

    // Calcular días únicos para promedio
    const diasUnicos = new Set(lecheros.map(r => r.fecha)).size;
    const promedioDiario = diasUnicos > 0 ? totalLeche / diasUnicos : 0;

    setStats({
      totalLeche,
      promedioDiario,
      registrosHoy,
      registrosMes,
    });
  };

  const handleNuevo = () => {
    setSelectedRegistro(null);
    setIsModalOpen(true);
  };

  const handleEditar = (registro: RegistroProduccion) => {
    setSelectedRegistro(registro);
    setIsModalOpen(true);
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await produccionService.deleteRegistro(id);
      loadRegistros();
    } catch (error) {
      console.error('Error eliminando registro:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleModalSave = () => {
    loadRegistros();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'leche': return '🥛';
      case 'carne': return '🥩';
      case 'lana': return '🧶';
      default: return '📦';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'leche': return 'bg-blue-100 text-blue-800';
      case 'carne': return 'bg-red-100 text-red-800';
      case 'lana': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrar localmente por animal
  const registrosFiltrados = filtroAnimal
    ? registros.filter((r) =>
        r.animal_numero?.toLowerCase().includes(filtroAnimal.toLowerCase()) ||
        r.animal_nombre?.toLowerCase().includes(filtroAnimal.toLowerCase())
      )
    : registros;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Registros de Producción
              </h1>
            </div>
            <button
              onClick={handleNuevo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <span>+</span> Nuevo Registro
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Leche</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalLeche.toFixed(1)} L</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Promedio Diario</div>
            <div className="text-2xl font-bold text-green-600">{stats.promedioDiario.toFixed(1)} L</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Registros Hoy</div>
            <div className="text-2xl font-bold text-purple-600">{stats.registrosHoy}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Registros este Mes</div>
            <div className="text-2xl font-bold text-orange-600">{stats.registrosMes}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Producción
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="leche">🥛 Leche</option>
                <option value="carne">🥩 Carne</option>
                <option value="lana">🧶 Lana</option>
                <option value="otro">📦 Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Animal
              </label>
              <input
                type="text"
                value={filtroAnimal}
                onChange={(e) => setFiltroAnimal(e.target.value)}
                placeholder="Número o nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <strong>{registrosFiltrados.length}</strong> de <strong>{total}</strong> registros
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando registros...</p>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay registros de producción</p>
              <button
                onClick={handleNuevo}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                + Crear el primer registro
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Animal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calidad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrosFiltrados.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(registro.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">
                          {registro.animal_numero || `ID: ${registro.animal_id}`}
                        </div>
                        {registro.animal_nombre && (
                          <div className="text-gray-500">{registro.animal_nombre}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(registro.tipo_produccion)}`}>
                          {getTipoIcon(registro.tipo_produccion)} {registro.tipo_produccion}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.tipo_produccion === 'leche' && registro.cantidad_litros && (
                          <span className="font-semibold text-blue-600">{registro.cantidad_litros} L</span>
                        )}
                        {registro.tipo_produccion === 'carne' && registro.peso_venta && (
                          <span className="font-semibold text-red-600">{registro.peso_venta} kg</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {registro.turno && <div>Turno: {registro.turno}</div>}
                        {registro.observaciones && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {registro.observaciones}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {registro.calidad && (
                          <span className={`capitalize ${
                            registro.calidad === 'alta' ? 'text-green-600 font-semibold' :
                            registro.calidad === 'media' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {registro.calidad}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditar(registro)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(registro.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ProduccionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        registro={selectedRegistro}
      />
    </div>
  );
}
