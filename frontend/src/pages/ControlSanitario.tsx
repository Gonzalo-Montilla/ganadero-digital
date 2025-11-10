import { useState, useEffect } from 'react';
import { sanitariosService } from '../api/sanitarios';
import ControlSanitarioModal from '../components/ControlSanitarioModal';
import type { ControlSanitario } from '../types/sanitario';

export default function ControlSanitarioPage() {
  const [controles, setControles] = useState<ControlSanitario[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<ControlSanitario | null>(null);

  useEffect(() => {
    loadControles();
  }, [filtroTipo]);

  const loadControles = async () => {
    try {
      setLoading(true);
      const response = await sanitariosService.getControlesSanitarios({
        tipo: filtroTipo || undefined,
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

  const handleEditar = (control: ControlSanitario) => {
    setSelectedControl(control);
    setIsModalOpen(true);
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await sanitariosService.deleteControlSanitario(id);
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
      case 'vacuna': return '💉';
      case 'desparasitacion': return '🪱';
      case 'tratamiento': return '💊';
      case 'cirugia': return '🏥';
      default: return '📋';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'vacuna': return 'bg-blue-100 text-blue-800';
      case 'desparasitacion': return 'bg-green-100 text-green-800';
      case 'tratamiento': return 'bg-yellow-100 text-yellow-800';
      case 'cirugia': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
                💉 Control Sanitario
              </h1>
            </div>
            <button
              onClick={handleNuevo}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todos</option>
                <option value="vacuna">💉 Vacuna</option>
                <option value="desparasitacion">🪱 Desparasitación</option>
                <option value="tratamiento">💊 Tratamiento</option>
                <option value="cirugia">🏥 Cirugía</option>
                <option value="otro">📋 Otro</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando registros...</p>
            </div>
          ) : controlesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay registros sanitarios</p>
              <button
                onClick={handleNuevo}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
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
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veterinario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Próxima Dosis
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
                        {formatDate(control.fecha)}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(control.tipo)}`}>
                          {getTipoIcon(control.tipo)} {control.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {control.producto || '-'}
                        </div>
                        {control.dosis && (
                          <div className="text-xs text-gray-500">{control.dosis}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {control.veterinario || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {control.proxima_dosis ? (
                          <span className="text-orange-600 font-medium">
                            {formatDate(control.proxima_dosis)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
      <ControlSanitarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        control={selectedControl}
      />
    </div>
  );
}
