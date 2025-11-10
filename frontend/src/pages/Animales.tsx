import { useState, useEffect } from 'react';
import { animalesService } from '../api/animales';
import type { Animal } from '../types/animal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnimalModal from '../components/AnimalModal';
import AnimalDetailsModal from '../components/AnimalDetailsModal';

export default function Animales() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('activo');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAnimales();
  }, [filtroEstado]);

  const loadAnimales = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 200 };
      if (filtroEstado !== 'todos') {
        params.estado = filtroEstado;
      }
      const response = await animalesService.getAnimales(params);
      setAnimales(response.items);
      setTotal(response.items.length);
    } catch (error) {
      console.error('Error loading animales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

  const handleDelete = async (animal: Animal) => {
    if (!confirm(`¿Estás seguro de eliminar a ${animal.nombre || animal.numero_identificacion}?`)) {
      return;
    }

    try {
      await animalesService.deleteAnimal(animal.id);
      loadAnimales();
    } catch (error) {
      console.error('Error deleting animal:', error);
      alert('Error al eliminar el animal');
    }
  };

  const handleView = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsDetailsModalOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-900">🐄 Animales</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.nombre_completo}
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
        {/* Stats y Filtros */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total de Animales</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
            <button
              onClick={() => {
                setSelectedAnimal(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              + Nuevo Animal
            </button>
          </div>
          
          {/* Filtros de Estado */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroEstado('activo')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filtroEstado === 'activo'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ✅ Activos
            </button>
            <button
              onClick={() => setFiltroEstado('vendido')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filtroEstado === 'vendido'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💸 Vendidos
            </button>
            <button
              onClick={() => setFiltroEstado('muerto')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filtroEstado === 'muerto'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⚰️ Muertos
            </button>
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filtroEstado === 'todos'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Todos
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Cargando...</div>
          ) : animales.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p className="text-xl mb-4">🐄</p>
              <p>No hay animales registrados</p>
              <p className="text-sm text-gray-500 mt-2">
                Crea tu primer animal usando el botón "Nuevo Animal"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sexo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Raza
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha Nac.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {animales.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {animal.numero_identificacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {animal.nombre || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {animal.sexo === 'macho' ? '♂ Macho' : '♀ Hembra'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {animal.raza}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {animal.categoria || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(animal.fecha_nacimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            animal.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : animal.estado === 'vendido'
                              ? 'bg-blue-100 text-blue-800'
                              : animal.estado === 'muerto'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {animal.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <button
                          onClick={() => handleView(animal)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEdit(animal)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(animal)}
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
      </main>

      {/* Modal Crear/Editar */}
      <AnimalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          loadAnimales();
        }}
        animal={selectedAnimal}
      />

      {/* Modal Detalles */}
      <AnimalDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        animal={selectedAnimal}
      />
    </div>
  );
}
