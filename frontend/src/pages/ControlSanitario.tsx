import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sanitariosService } from '../api/sanitarios';
import ControlSanitarioModal from '../components/ControlSanitarioModal';
import SanitarioDetailsModal from '../components/SanitarioDetailsModal';
import SanitarioCard from '../components/cards/SanitarioCard';
import EntityCardGrid from '../components/cards/EntityCardGrid';
import AplicarVacunaModal from '../components/AplicarVacunaModal';
import type { ControlSanitario } from '../types/sanitario';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { vacunaPendienteAplicar } from '../utils/vacunaPendiente';
import { useAnimalPhotos } from '../hooks/useAnimalPhotos';

export default function ControlSanitarioPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [searchParams, setSearchParams] = useSearchParams();
  const { photos: animalPhotos } = useAnimalPhotos();
  const [controles, setControles] = useState<ControlSanitario[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');
  const [filtroAnimalId, setFiltroAnimalId] = useState<number | null>(null);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<ControlSanitario | null>(null);
  const [isAplicarModalOpen, setIsAplicarModalOpen] = useState(false);
  const [registroAplicar, setRegistroAplicar] = useState<ControlSanitario | null>(null);
  const [accionProcesada, setAccionProcesada] = useState(false);

  useEffect(() => {
    loadControles();
  }, [filtroTipo]);

  useEffect(() => {
    const animalIdParam = searchParams.get('animal_id');
    const animalNumero = searchParams.get('animal_numero');
    const accion = searchParams.get('accion');

    if (animalIdParam) {
      const parsed = Number(animalIdParam);
      if (Number.isFinite(parsed)) {
        setFiltroAnimalId(parsed);
      }
    }
    if (animalNumero) {
      setFiltroAnimal(animalNumero);
    }

    if (!accion && (animalIdParam || animalNumero)) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('animal_id');
      nextParams.delete('animal_numero');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (loading || accionProcesada) return;
    const accion = searchParams.get('accion');
    const animalIdParam = searchParams.get('animal_id');
    if (accion !== 'aplicar_vacuna' || !animalIdParam) return;

    const animalId = Number(animalIdParam);
    if (!Number.isFinite(animalId)) return;

    const pendiente = controles.find(
      (c) => c.animal_id === animalId && vacunaPendienteAplicar(c),
    );
    if (pendiente) {
      setRegistroAplicar(pendiente);
      setIsAplicarModalOpen(true);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('animal_id');
    nextParams.delete('animal_numero');
    nextParams.delete('accion');
    setSearchParams(nextParams, { replace: true });
    setAccionProcesada(true);
  }, [loading, controles, searchParams, accionProcesada]);

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

  const openDetails = (control: ControlSanitario) => {
    setSelectedControl(control);
    setIsDetailsOpen(true);
  };

  const openEdit = () => {
    setIsDetailsOpen(false);
    setIsModalOpen(true);
  };

  const handleAplicarVacuna = (control: ControlSanitario) => {
    setRegistroAplicar(control);
    setIsAplicarModalOpen(true);
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await sanitariosService.deleteControlSanitario(id);
      setIsDetailsOpen(false);
      setSelectedControl(null);
      loadControles();
    } catch (error) {
      console.error('Error eliminando registro:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleModalSave = () => {
    loadControles();
  };

  const controlesFiltrados = controles.filter((c) => {
    if (filtroAnimalId != null && c.animal_id !== filtroAnimalId) {
      return false;
    }
    if (!filtroAnimal) {
      return true;
    }
    return (
      c.animal_numero?.toLowerCase().includes(filtroAnimal.toLowerCase()) ||
      c.animal_nombre?.toLowerCase().includes(filtroAnimal.toLowerCase())
    );
  });

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
                {filtroAnimalId != null ? (
                  <span className="ml-2 gd-pill bg-brand-100 text-brand-800">Filtrado por alerta</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas */}
        <div className="gd-card overflow-hidden">
          <EntityCardGrid
            loading={loading}
            empty={!loading && controlesFiltrados.length === 0}
            emptyMessage="No hay registros sanitarios"
            emptyAction={
              <button type="button" onClick={handleNuevo} className="font-semibold text-brand-600">
                + Crear el primer registro
              </button>
            }
          >
            {controlesFiltrados.map((control) => (
              <SanitarioCard
                key={control.id}
                control={control}
                animalFotoUrl={animalPhotos.get(control.animal_id)?.foto_url}
                onClick={() => openDetails(control)}
              />
            ))}
          </EntityCardGrid>
        </div>
      </div>

      <SanitarioDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        control={selectedControl}
        animalFotoUrl={selectedControl ? animalPhotos.get(selectedControl.animal_id)?.foto_url : null}
        onEdit={openEdit}
        onDelete={() => selectedControl && void handleEliminar(selectedControl.id)}
        onAplicarVacuna={() => selectedControl && handleAplicarVacuna(selectedControl)}
      />
      <ControlSanitarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        control={selectedControl}
      />

      <AplicarVacunaModal
        isOpen={isAplicarModalOpen}
        onClose={() => {
          setIsAplicarModalOpen(false);
          setRegistroAplicar(null);
        }}
        onSaved={handleModalSave}
        registro={registroAplicar}
      />
    </AppShell>
  );
}
