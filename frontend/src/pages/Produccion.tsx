import { useState, useEffect } from 'react';
import { produccionService } from '../api/produccion';
import ProduccionModal from '../components/ProduccionModal';
import ProduccionDetailsModal from '../components/ProduccionDetailsModal';
import ProduccionCard from '../components/cards/ProduccionCard';
import EntityCardGrid from '../components/cards/EntityCardGrid';
import type { RegistroProduccion } from '../types/produccion';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { useAnimalPhotos } from '../hooks/useAnimalPhotos';

export default function ProduccionPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const { photos: animalPhotos } = useAnimalPhotos();
  const [registros, setRegistros] = useState<RegistroProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  const openDetails = (registro: RegistroProduccion) => {
    setSelectedRegistro(registro);
    setIsDetailsOpen(true);
  };

  const openEdit = () => {
    setIsDetailsOpen(false);
    setIsModalOpen(true);
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await produccionService.deleteRegistro(id);
      setIsDetailsOpen(false);
      setSelectedRegistro(null);
      loadRegistros();
    } catch (error) {
      console.error('Error eliminando registro:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleModalSave = () => {
    loadRegistros();
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
      subtitle="Litros ordeñados (operación). El dinero por leche o venta de animales va en Finanzas."
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
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <strong>Producción</strong> registra litros ordeñados por vaca.{' '}
          <strong>Finanzas → Venta</strong> registra ingresos: venta de leche (las vacas siguen en inventario) o venta de animal para sacrificio/faena (sale del inventario).
        </div>
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

        {/* Tarjetas */}
        <div className="gd-card overflow-hidden">
          <EntityCardGrid
            loading={loading}
            empty={!loading && registrosFiltrados.length === 0}
            emptyMessage="No hay registros de producción"
            emptyAction={
              <button type="button" onClick={handleNuevo} className="font-semibold text-brand-600">
                + Crear el primer registro
              </button>
            }
          >
            {registrosFiltrados.map((registro) => (
              <ProduccionCard
                key={registro.id}
                registro={registro}
                animalFotoUrl={animalPhotos.get(registro.animal_id)?.foto_url}
                onClick={() => openDetails(registro)}
              />
            ))}
          </EntityCardGrid>
        </div>
      </div>

      <ProduccionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        registro={selectedRegistro}
        animalFotoUrl={selectedRegistro ? animalPhotos.get(selectedRegistro.animal_id)?.foto_url : null}
        onEdit={openEdit}
        onDelete={() => selectedRegistro && void handleEliminar(selectedRegistro.id)}
      />
      <ProduccionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        registro={selectedRegistro}
      />
    </AppShell>
  );
}
