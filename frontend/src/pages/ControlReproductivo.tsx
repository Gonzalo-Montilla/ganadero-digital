import { useState, useEffect } from 'react';
import { reproductivosService } from '../api/reproductivos';
import ControlReproductivoModal from '../components/ControlReproductivoModal';
import type { ControlReproductivo } from '../types/reproductivo';

export default function ControlReproductivoPage() {
  const [controles, setControles] = useState<ControlReproductivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<ControlReproductivo | null>(null);

  useEffect(() => {
    loadControles();
  }, [filtroTipo]);

  const loadControles = async () => {
    try {
      setLoading(true);
      const response = await reproductivosService.getControlesReproductivos({
        tipo_evento: filtroTipo || undefined,
        limit: 50,
      });
      setControles(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Error cargando controles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setSelectedControl(null);
    setIsModalOpen(true);
  };

  const handleEditar = (control: ControlReproductivo) => {
    setSelectedControl(control);
    setIsModalOpen(true);
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await reproductivosService.deleteControlReproductivo(id);
      loadControles();
    } catch (error) {
      console.error('Error eliminando registro:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleModalSave = () => {
    loadControles();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'servicio': return '🐂';
      case 'diagnostico': return '🔬';
      case 'parto': return '🍼';
      case 'aborto': return '❌';
      case 'secado': return '🚫';
      default: return '📋';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'servicio': return 'bg-blue-100 text-blue-800';
      case 'diagnostico': return 'bg-purple-100 text-purple-800';
      case 'parto': return 'bg-green-100 text-green-800';
      case 'aborto': return 'bg-red-100 text-red-800';
      case 'secado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiagnosticoColor = (diagnostico: string | null) => {
    switch (diagnostico) {
      case 'prenada': return 'text-green-600 font-semibold';
      case 'vacia': return 'text-red-600';
      case 'dudosa': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  // Filtrar localmente por animal
  const controlesFiltrados = filtroAnimal
    ? controles.filter((c) =>
        c.animal_numero?.toLowerCase().includes(filtroAnimal.toLowerCase()) ||
        c.animal_nombre?.toLowerCase().includes(filtroAnimal.toLowerCase())
      )
    : controles;

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
                🍼 Control Reproductivo
              </h1>
            </div>
            <button
              onClick={handleNuevo}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 flex items-center gap-2"
            >
              <span>+</span> Nuevo Registro
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Evento
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Todos</option>
                <option value="servicio">🐂 Servicio</option>
                <option value="diagnostico">🔬 Diagnóstico</option>
                <option value="parto">🍼 Parto</option>
                <option value="aborto">❌ Aborto</option>
                <option value="secado">🚫 Secado</option>
                <option value="otro">📋 Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Hembra
              </label>
              <input
                type="text"
                value={filtroAnimal}
                onChange={(e) => setFiltroAnimal(e.target.value)}
                placeholder="Número o nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <strong>{controlesFiltrados.length}</strong> de <strong>{total}</strong> registros
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando registros...</p>
            </div>
          ) : controlesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay registros reproductivos</p>
              <button
                onClick={handleNuevo}
                className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
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
                      Hembra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnóstico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veterinario
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {controlesFiltrados.map((control) => (
                    <tr key={control.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(control.fecha_evento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">
                          {control.animal_numero || `ID: ${control.animal_id}`}
                        </div>
                        {control.animal_nombre && (
                          <div className="text-gray-500">{control.animal_nombre}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(control.tipo_evento)}`}>
                          {getTipoIcon(control.tipo_evento)} {control.tipo_evento}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {control.tipo_evento === 'servicio' && (
                          <div className="text-xs">
                            {control.tipo_servicio && (
                              <div>{control.tipo_servicio.replace('_', ' ')}</div>
                            )}
                            {control.toro_numero && <div>Toro: {control.toro_numero}</div>}
                            {control.toro_pajuela && <div>{control.toro_pajuela}</div>}
                          </div>
                        )}
                        {control.tipo_evento === 'parto' && (
                          <div className="text-xs">
                            {control.numero_crias && <div>{control.numero_crias} cría(s)</div>}
                            {control.sexo_cria && <div>{control.sexo_cria}</div>}
                            {control.peso_cria && <div>{control.peso_cria} kg</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getDiagnosticoColor(control.diagnostico)}>
                          {control.diagnostico ? control.diagnostico.toUpperCase() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {control.veterinario || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditar(control)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(control.id)}
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
      <ControlReproductivoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        control={selectedControl}
      />
    </div>
  );
}
