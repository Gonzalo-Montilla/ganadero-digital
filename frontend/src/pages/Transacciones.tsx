import { useState, useEffect } from 'react';
import { transaccionesService } from '../api/transacciones';
import TransaccionModal from '../components/TransaccionModal';
import type { Transaccion } from '../types/transaccion';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

export default function TransaccionesPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState<Transaccion | null>(null);

  const [balance, setBalance] = useState({
    ventas: 0,
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
    const ventas = data.filter(t => t.tipo === 'venta').reduce((sum, t) => sum + t.monto, 0);
    const compras = data.filter(t => t.tipo === 'compra').reduce((sum, t) => sum + t.monto, 0);
    const gastos = data.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.monto, 0);
    setBalance({ ventas, compras, gastos, neto: ventas - compras - gastos });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar transacción?')) return;
    try {
      await transaccionesService.deleteTransaccion(id);
      loadTransacciones();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const formatMonto = (monto: number) => `$${monto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

  return (
    <AppShell
      title="Transacciones"
      subtitle="Ventas, compras y gastos operativos"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Ventas</div>
            <div className="text-2xl font-bold text-green-600">{formatMonto(balance.ventas)}</div>
          </div>
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Compras</div>
            <div className="text-2xl font-bold text-blue-600">{formatMonto(balance.compras)}</div>
          </div>
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Gastos</div>
            <div className="text-2xl font-bold text-red-600">{formatMonto(balance.gastos)}</div>
          </div>
          <div className="gd-card p-6">
            <div className="text-sm text-slate-600">Balance Neto</div>
            <div className={`text-2xl font-bold ${balance.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMonto(balance.neto)}
            </div>
          </div>
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

        {/* Tabla */}
        <div className="gd-card overflow-hidden">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div></div>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No hay transacciones</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-4 text-brand-600 hover:text-brand-700 font-semibold">+ Crear primera transacción</button>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {transacciones.map((t) => (
                  <article key={t.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t.concepto}</p>
                        <p className="text-xs text-slate-500">{new Date(t.fecha).toLocaleDateString('es-CO')}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        t.tipo === 'venta' ? 'bg-green-100 text-green-800' :
                        t.tipo === 'compra' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t.tipo}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Tercero: {t.tercero || '-'}</p>
                    <p className="mt-1 text-base font-extrabold text-slate-900">{formatMonto(t.monto)}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => { setSelectedTransaccion(t); setIsModalOpen(true); }} className="gd-btn-secondary !px-3 !py-2 text-xs">
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(t.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tercero</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Monto</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {transacciones.map((t) => (
                      <tr key={t.id} className="hover:bg-brand-50/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{new Date(t.fecha).toLocaleDateString('es-CO')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            t.tipo === 'venta' ? 'bg-green-100 text-green-800' :
                            t.tipo === 'compra' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>{t.tipo}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">{t.concepto}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{t.tercero || '-'}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">{formatMonto(t.monto)}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          <button onClick={() => { setSelectedTransaccion(t); setIsModalOpen(true); }} className="text-sky-600 hover:text-sky-800 mr-3">Editar</button>
                          <button onClick={() => handleEliminar(t.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
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

      <TransaccionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadTransacciones} transaccion={selectedTransaccion} />
    </AppShell>
  );
}
