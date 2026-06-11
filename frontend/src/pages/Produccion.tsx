import { useState, useEffect } from 'react';
import { produccionService } from '../api/produccion';
import ProduccionModal from '../components/ProduccionModal';
import type { RegistroProduccion } from '../types/produccion';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

export default function ProduccionPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
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
      case 'leche': return 'Leche';
      case 'carne': return 'Carne';
      case 'lana': return 'Lana';
      default: return 'Otro';
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
    <AppShell
      title="Registros de Produccion"
      subtitle="Leche, carne y rendimiento"
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
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Total Leche</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalLeche.toFixed(1)} L</div>
          </div>
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Promedio Diario</div>
            <div className="text-2xl font-bold text-green-600">{stats.promedioDiario.toFixed(1)} L</div>
          </div>
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Registros Hoy</div>
            <div className="text-2xl font-bold text-purple-600">{stats.registrosHoy}</div>
          </div>
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Registros este Mes</div>
            <div className="text-2xl font-bold text-orange-600">{stats.registrosMes}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="gd-card p-4 md:p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Tipo de Producción
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="gd-input"
              >
                <option value="">Todos</option>
                <option value="leche">Leche</option>
                <option value="carne">Carne</option>
                <option value="lana">Lana</option>
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
                <strong>{registrosFiltrados.length}</strong> de <strong>{total}</strong> registros
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
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No hay registros de producción</p>
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
                {registrosFiltrados.map((registro) => (
                  <article key={registro.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{registro.animal_numero || `ID: ${registro.animal_id}`}</p>
                        <p className="text-xs text-slate-500">{formatDate(registro.fecha)}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${getTipoColor(registro.tipo_produccion)}`}>
                        {getTipoIcon(registro.tipo_produccion)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {registro.tipo_produccion === 'leche' && registro.cantidad_litros ? `${registro.cantidad_litros} L` : ''}
                      {registro.tipo_produccion === 'carne' && registro.peso_venta ? `${registro.peso_venta} kg` : ''}
                    </p>
                    {registro.turno ? <p className="text-xs text-slate-500">Turno: {registro.turno}</p> : null}
                    {registro.calidad ? <p className="text-xs text-slate-500">Calidad: {registro.calidad}</p> : null}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleEditar(registro)} className="gd-btn-secondary !px-3 !py-2 text-xs">Editar</button>
                      <button onClick={() => handleEliminar(registro.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Eliminar</button>
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalles</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Calidad</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {registrosFiltrados.map((registro) => (
                      <tr key={registro.id} className="hover:bg-brand-50/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDate(registro.fecha)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-slate-900">{registro.animal_numero || `ID: ${registro.animal_id}`}</div>
                          {registro.animal_nombre && <div className="text-slate-500">{registro.animal_nombre}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(registro.tipo_produccion)}`}>
                            {getTipoIcon(registro.tipo_produccion)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {registro.tipo_produccion === 'leche' && registro.cantidad_litros && <span className="font-semibold text-blue-600">{registro.cantidad_litros} L</span>}
                          {registro.tipo_produccion === 'carne' && registro.peso_venta && <span className="font-semibold text-red-600">{registro.peso_venta} kg</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {registro.turno && <div>Turno: {registro.turno}</div>}
                          {registro.observaciones && <div className="text-xs text-slate-500 truncate max-w-xs">{registro.observaciones}</div>}
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
                          <button onClick={() => handleEditar(registro)} className="text-sky-600 hover:text-sky-800 mr-3">Editar</button>
                          <button onClick={() => handleEliminar(registro.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
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
      <ProduccionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        registro={selectedRegistro}
      />
    </AppShell>
  );
}
