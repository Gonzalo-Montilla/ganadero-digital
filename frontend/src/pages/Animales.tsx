import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animalesService } from '../api/animales';
import type { Animal } from '../types/animal';
import { useAuth } from '../context/AuthContext';
import AnimalModal from '../components/AnimalModal';
import AnimalDetailsModal from '../components/AnimalDetailsModal';
import AppShell from '../components/AppShell';
import { Beef } from 'lucide-react';

export default function Animales() {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('activo');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loteDestino, setLoteDestino] = useState('');
  const [potreroDestino, setPotreroDestino] = useState('');
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadAnimales();
  }, [filtroEstado]);

  useEffect(() => {
    const onAnimalesUpdated = () => loadAnimales();
    window.addEventListener('gd-animales-updated', onAnimalesUpdated);
    return () => window.removeEventListener('gd-animales-updated', onAnimalesUpdated);
  }, [filtroEstado]);

  const loadAnimales = async () => {
    try {
      setLoading(true);
      const params: { estado?: string } = {};
      if (filtroEstado !== 'todos') {
        params.estado = filtroEstado;
      }
      const response = await animalesService.getAnimalesAll(params);
      setAnimales(response.items);
      setTotal(response.total);
      setSelectedIds([]);
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

  const handleView = async (animal: Animal) => {
    try {
      const freshAnimal = await animalesService.getAnimal(animal.id);
      setSelectedAnimal(freshAnimal);
    } catch (error) {
      console.error('Error loading animal details:', error);
      setSelectedAnimal(animal);
    }
    setIsDetailsModalOpen(true);
  };

  useEffect(() => {
    const animalIdParam = searchParams.get('animal_id');
    if (!animalIdParam || loading) {
      return;
    }

    const animalId = Number(animalIdParam);
    if (!Number.isFinite(animalId)) {
      return;
    }

    const abrirDesdeAlerta = async () => {
      const enLista = animales.find((item) => item.id === animalId);
      if (enLista) {
        await handleView(enLista);
      } else {
        try {
          const freshAnimal = await animalesService.getAnimal(animalId);
          setSelectedAnimal(freshAnimal);
          setIsDetailsModalOpen(true);
        } catch (error) {
          console.error('No se pudo abrir el animal desde la alerta:', error);
        }
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('animal_id');
      nextParams.delete('animal_numero');
      setSearchParams(nextParams, { replace: true });
    };

    void abrirDesdeAlerta();
  }, [loading, animales, searchParams, setSearchParams]);

  const toggleSelected = (animalId: number) => {
    setSelectedIds((prev) =>
      prev.includes(animalId) ? prev.filter((id) => id !== animalId) : [...prev, animalId]
    );
  };

  const handleBulkMove = async () => {
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un animal');
      return;
    }
    try {
      await animalesService.moverLote(selectedIds, loteDestino || undefined, potreroDestino || undefined);
      setLoteDestino('');
      setPotreroDestino('');
      await loadAnimales();
    } catch (error) {
      console.error('Error en movimiento masivo:', error);
      alert('No se pudo mover el lote seleccionado');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  return (
    <AppShell
      title="Inventario de Animales"
      subtitle="Consulta rapida y movimientos por lote"
      userName={user?.nombre_completo}
      role={user?.rol}
      onLogout={logout}
      online={isOnline}
      rightSlot={
        <button
          onClick={() => {
            setSelectedAnimal(null);
            setIsModalOpen(true);
          }}
          className="gd-btn-primary !py-2"
        >
          + Nuevo animal
        </button>
      }
    >
      <section className="gd-card mb-5 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Total visibles</p>
            <p className="text-3xl font-extrabold text-slate-900">{total}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'activo', label: 'Activos' },
              { key: 'vendido', label: 'Vendidos' },
              { key: 'muerto', label: 'Muertos' },
              { key: 'todos', label: 'Todos' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFiltroEstado(item.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  filtroEstado === item.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <input value={loteDestino} onChange={(e) => setLoteDestino(e.target.value)} placeholder="Lote destino" className="gd-input" />
          <input
            value={potreroDestino}
            onChange={(e) => setPotreroDestino(e.target.value)}
            placeholder="Potrero destino"
            className="gd-input"
          />
          <button onClick={handleBulkMove} className="gd-btn-secondary">
            Mover seleccionados ({selectedIds.length})
          </button>
        </div>
      </section>

      <section className="gd-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-600">Cargando animales...</div>
        ) : animales.length === 0 ? (
          <div className="p-10 text-center">
            <Beef className="mx-auto h-12 w-12 text-brand-700" />
            <p className="mt-2 font-semibold text-slate-700">No hay animales registrados.</p>
            <p className="text-sm text-slate-500">Crea el primero para empezar el control de campo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Sel.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Chapeta</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Sexo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Raza</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">F. nacimiento</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {animales.map((animal) => (
                  <tr key={animal.id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(animal.id)} onChange={() => toggleSelected(animal.id)} />
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{animal.numero_identificacion}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{animal.nombre || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{animal.sexo === 'macho' ? 'Macho' : 'Hembra'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{animal.raza}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{animal.categoria || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(animal.fecha_nacimiento)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`gd-pill ${
                          animal.estado === 'activo'
                            ? 'bg-emerald-100 text-emerald-700'
                            : animal.estado === 'vendido'
                            ? 'bg-sky-100 text-sky-700'
                            : animal.estado === 'muerto'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {animal.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleView(animal)} className="mr-3 font-semibold text-brand-700 hover:text-brand-900">
                        Ver
                      </button>
                      <button onClick={() => handleEdit(animal)} className="mr-3 font-semibold text-sky-700 hover:text-sky-900">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(animal)} className="font-semibold text-rose-700 hover:text-rose-900">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
    </AppShell>
  );
}
