import { useState, useEffect } from 'react';
import { transaccionesService } from '../api/transacciones';
import TransaccionModal from '../components/TransaccionModal';
import type { Transaccion } from '../types/transaccion';

export default function TransaccionesPage() {
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">← Volver</button>
              <h1 className="text-3xl font-bold text-gray-900">💰 Transacciones</h1>
            </div>
            <button onClick={() => { setSelectedTransaccion(null); setIsModalOpen(true); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              + Nueva Transacción
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Balance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Ventas</div>
            <div className="text-2xl font-bold text-green-600">{formatMonto(balance.ventas)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Compras</div>
            <div className="text-2xl font-bold text-blue-600">{formatMonto(balance.compras)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Gastos</div>
            <div className="text-2xl font-bold text-red-600">{formatMonto(balance.gastos)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Balance Neto</div>
            <div className={`text-2xl font-bold ${balance.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMonto(balance.neto)}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filtrar:</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="px-3 py-2 border rounded-md">
              <option value="">Todas</option>
              <option value="venta">Ventas</option>
              <option value="compra">Compras</option>
              <option value="gasto">Gastos</option>
            </select>
            <div className="text-sm text-gray-600 ml-auto"><strong>{total}</strong> registros</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div></div>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay transacciones</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-4 text-green-600 hover:text-green-700">+ Crear primera transacción</button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tercero</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transacciones.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(t.fecha).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        t.tipo === 'venta' ? 'bg-green-100 text-green-800' :
                        t.tipo === 'compra' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>{t.tipo}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{t.concepto}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.tercero || '-'}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold">{formatMonto(t.monto)}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button onClick={() => { setSelectedTransaccion(t); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                      <button onClick={() => handleEliminar(t.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TransaccionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadTransacciones} transaccion={selectedTransaccion} />
    </div>
  );
}
