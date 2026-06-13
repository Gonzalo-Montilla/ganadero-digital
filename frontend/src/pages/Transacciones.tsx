import { useState, useEffect } from 'react';
import { transaccionesService } from '../api/transacciones';
import TransaccionModal from '../components/TransaccionModal';
import TransaccionDetailsModal from '../components/TransaccionDetailsModal';
import TransaccionCard from '../components/cards/TransaccionCard';
import EntityCardGrid from '../components/cards/EntityCardGrid';
import type { Transaccion } from '../types/transaccion';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { useAnimalPhotos } from '../hooks/useAnimalPhotos';

export default function TransaccionesPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const { photos: animalPhotos } = useAnimalPhotos();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState<Transaccion | null>(null);

  const [balance, setBalance] = useState({
    ventas: 0,
    ventasLeche: 0,
    ventasAnimales: 0,
    compras: 0,
    gastos: 0,
    neto: 0,
  });

  useEffect(() => {
    loadTransacciones();
  }, [filtroTipo]);

  const loadTransacciones = async () => {
    try {
      setLoading(true);
      const response = await transaccionesService.getTransacciones({
        tipo: filtroTipo || undefined,
        limit: 100,
      });
      setTransacciones(response.items);
      setTotal(response.total);
      calculateBalance(response.items);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = (data: Transaccion[]) => {
    const ventasItems = data.filter((t) => t.tipo === 'venta');
    const ventas = ventasItems.reduce((sum, t) => sum + t.monto, 0);
    const ventasLeche = ventasItems
      .filter((t) => t.rubro_venta === 'leche')
      .reduce((sum, t) => sum + t.monto, 0);
    const ventasAnimales = ventasItems
      .filter((t) => t.rubro_venta === 'animal_sacrificio' || (!t.rubro_venta && t.animal_id))
      .reduce((sum, t) => sum + t.monto, 0);
    const compras = data.filter(t => t.tipo === 'compra').reduce((sum, t) => sum + t.monto, 0);
    const gastos = data.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.monto, 0);
    setBalance({ ventas, ventasLeche, ventasAnimales, compras, gastos, neto: ventas - compras - gastos });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar transacción?')) return;
    try {
      await transaccionesService.deleteTransaccion(id);
      setIsDetailsOpen(false);
      setSelectedTransaccion(null);
      loadTransacciones();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const openDetails = (t: Transaccion) => {
    setSelectedTransaccion(t);
    setIsDetailsOpen(true);
  };

  const openEdit = () => {
    setIsDetailsOpen(false);
    setIsModalOpen(true);
  };

  const formatMonto = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);

  return (
    <AppShell
      title="Transacciones"
      subtitle="Ventas, compras y gastos por rubro (leche, animales, gastos)"
      userName={user?.nombre_completo}
      role={user?.rol}
      onLogout={logout}
      online={isOnline}
      rightSlot={
        <button onClick={() => { setSelectedTransaccion(null); setIsModalOpen(true); }} className="gd-btn-primary !py-2">
          + Nueva transaccion
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Balance */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6 mb-6">
          {[
            { label: 'Ventas total', value: balance.ventas, className: 'text-green-600' },
            { label: 'Venta leche', value: balance.ventasLeche, className: 'text-sky-700' },
            { label: 'Venta animales', value: balance.ventasAnimales, className: 'text-emerald-700' },
            { label: 'Compras', value: balance.compras, className: 'text-blue-600' },
            { label: 'Gastos', value: balance.gastos, className: 'text-red-600' },
            {
              label: 'Balance Neto',
              value: balance.neto,
              className: balance.neto >= 0 ? 'text-green-600' : 'text-red-600',
            },
          ].map((item) => (
            <div key={item.label} className="gd-card min-w-0 p-4 sm:p-5">
              <div className="truncate text-xs sm:text-sm text-slate-600">{item.label}</div>
              <div
                className={`mt-1 text-sm sm:text-base lg:text-lg xl:text-xl font-bold tabular-nums leading-tight ${item.className}`}
                title={formatMonto(item.value)}
              >
                {formatMonto(item.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="gd-card p-4 md:p-5 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="text-sm font-semibold text-slate-700">Filtrar:</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="gd-input max-w-[200px]">
              <option value="">Todas</option>
              <option value="venta">Ventas</option>
              <option value="compra">Compras</option>
              <option value="gasto">Gastos</option>
            </select>
            <div className="text-sm text-slate-600 md:ml-auto"><strong>{total}</strong> registros</div>
          </div>
        </div>

        {/* Tarjetas */}
        <div className="gd-card overflow-hidden">
          <EntityCardGrid
            loading={loading}
            empty={!loading && transacciones.length === 0}
            emptyMessage="No hay transacciones"
            emptyAction={
              <button type="button" onClick={() => setIsModalOpen(true)} className="font-semibold text-brand-600">
                + Crear primera transacción
              </button>
            }
          >
            {transacciones.map((t) => (
              <TransaccionCard
                key={t.id}
                transaccion={t}
                animalFotoUrl={t.animal_id ? animalPhotos.get(t.animal_id)?.foto_url : null}
                onClick={() => openDetails(t)}
              />
            ))}
          </EntityCardGrid>
        </div>
      </div>

      <TransaccionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        transaccion={selectedTransaccion}
        animalFotoUrl={
          selectedTransaccion?.animal_id ? animalPhotos.get(selectedTransaccion.animal_id)?.foto_url : null
        }
        onEdit={openEdit}
        onDelete={() => selectedTransaccion && void handleEliminar(selectedTransaccion.id)}
      />
      <TransaccionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadTransacciones}
        transaccion={selectedTransaccion}
      />
    </AppShell>
  );
}
