import { useState, useEffect } from 'react';
import { sanitariosService } from '../api/sanitarios';
import ControlSanitarioModal from '../components/ControlSanitarioModal';
import type { ControlSanitario } from '../types/sanitario';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

export default function ControlSanitarioPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
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
      case 'vacuna': return 'Vacuna';
      case 'desparasitacion': return 'Desparasitación';
      case 'tratamiento': return 'Tratamiento';
      case 'cirugia': return 'Cirugía';
      default: return 'Otro';
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
    <AppShell
      title="Control Sanitario"
      subtitle="Vacunas, tratamientos y seguimiento"
      userName={user?.nombre_completo}
      role={user?.rol}
      onLogout={logout}
      online={isOnline}
      rightSlot={
        <button onClick={handleNuevo} className="gd-btn-primary !py-2">
          + Nuevo registro
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        <div className="gd-card mb-6 p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Tipo de Evento
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="gd-input"
              >
                <option value="">Todos</option>
                <option value="vacuna">Vacuna</option>
                <option value="desparasitacion">Desparasitación</option>
                <option value="tratamiento">Tratamiento</option>
                <option value="cirugia">Cirugía</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Buscar Animal
              </label>
              <input
                type="text"
                value={filtroAnimal}
                onChange={(e) => setFiltroAnimal(e.target.value)}
                placeholder="Número o nombre..."
                className="gd-input"
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <strong>{controlesFiltrados.length}</strong> de <strong>{total}</strong> registros
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="gd-card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Cargando registros...</p>
            </div>
          ) : controlesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No hay registros sanitarios</p>
              <button
                onClick={handleNuevo}
                className="mt-4 text-brand-600 hover:text-brand-700 font-semibold"
              >
                + Crear el primer registro
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {controlesFiltrados.map((control) => (
                  <article key={control.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{control.animal_numero || `ID: ${control.animal_id}`}</p>
                        <p className="text-xs text-slate-500">{formatDate(control.fecha)}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${getTipoColor(control.tipo)}`}>
                        {getTipoIcon(control.tipo)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{control.producto || 'Sin producto'}</p>
                    {control.veterinario ? <p className="text-xs text-slate-500">Vet: {control.veterinario}</p> : null}
                    {control.proxima_dosis ? <p className="text-xs text-orange-600">Próxima: {formatDate(control.proxima_dosis)}</p> : null}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleEditar(control)} className="gd-btn-secondary !px-3 !py-2 text-xs">Editar</button>
                      <button onClick={() => handleEliminar(control.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Eliminar</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Animal</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Veterinario</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Próxima Dosis</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {controlesFiltrados.map((control) => (
                      <tr key={control.id} className="hover:bg-brand-50/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDate(control.fecha)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-slate-900">{control.animal_numero || `ID: ${control.animal_id}`}</div>
                          {control.animal_nombre && <div className="text-slate-500">{control.animal_nombre}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(control.tipo)}`}>
                            {getTipoIcon(control.tipo)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          <div className="max-w-xs truncate">{control.producto || '-'}</div>
                          {control.dosis && <div className="text-xs text-slate-500">{control.dosis}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{control.veterinario || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {control.proxima_dosis ? <span className="text-orange-600 font-medium">{formatDate(control.proxima_dosis)}</span> : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEditar(control)} className="text-sky-600 hover:text-sky-800 mr-3">Editar</button>
                          <button onClick={() => handleEliminar(control.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
    </AppShell>
  );
}
