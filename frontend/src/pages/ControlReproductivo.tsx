import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reproductivosService } from '../api/reproductivos';
import ControlReproductivoModal from '../components/ControlReproductivoModal';
import ReproductivoDetailsModal from '../components/ReproductivoDetailsModal';
import ReproductivoCard from '../components/cards/ReproductivoCard';
import EntityCardGrid from '../components/cards/EntityCardGrid';
import type { ControlReproductivo, PartoPrefill } from '../types/reproductivo';
import {
  puedeRegistrarPartoDesdeDiagnostico,
  encontrarDiagnosticoPrenadaAbierto,
} from '../utils/gestacion';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { useAnimalPhotos } from '../hooks/useAnimalPhotos';

export default function ControlReproductivoPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [searchParams, setSearchParams] = useSearchParams();
  const { photos: animalPhotos } = useAnimalPhotos();
  const [controles, setControles] = useState<ControlReproductivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');
  const [filtroAnimalId, setFiltroAnimalId] = useState<number | null>(null);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<ControlReproductivo | null>(null);
  const [partoPrefill, setPartoPrefill] = useState<PartoPrefill | null>(null);
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
    if (!accion || !animalIdParam) return;

    const animalId = Number(animalIdParam);
    if (!Number.isFinite(animalId)) return;

    const limpiarParams = () => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('animal_id');
      nextParams.delete('animal_numero');
      nextParams.delete('accion');
      setSearchParams(nextParams, { replace: true });
      setAccionProcesada(true);
    };

    if (accion === 'registrar_parto') {
      const diagnostico = encontrarDiagnosticoPrenadaAbierto(animalId, controles);
      if (diagnostico) {
        void handleRegistrarParto(diagnostico).finally(limpiarParams);
      } else {
        void abrirPartoSinDiagnostico(animalId).finally(limpiarParams);
      }
      return;
    }

    if (accion === 'nuevo_servicio') {
      setSelectedControl(null);
      setPartoPrefill(null);
      setIsModalOpen(true);
      limpiarParams();
    }
  }, [loading, controles, searchParams, accionProcesada]);

  const loadControles = async () => {
    try {
      setLoading(true);
      const response = await reproductivosService.getControlesReproductivos({
        tipo_evento: filtroTipo || undefined,
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
    setPartoPrefill(null);
    setIsModalOpen(true);
  };

  const openDetails = (control: ControlReproductivo) => {
    setSelectedControl(control);
    setIsDetailsOpen(true);
  };

  const openEdit = () => {
    setPartoPrefill(null);
    setIsDetailsOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedControl(null);
    setPartoPrefill(null);
  };

  const puedeRegistrarParto = (control: ControlReproductivo) =>
    puedeRegistrarPartoDesdeDiagnostico(control, controles);

  const abrirPartoSinDiagnostico = async (animalId: number) => {
    setSelectedControl(null);
    let toroId: number | null = null;
    let animalNumero: string | undefined;
    let animalNombre: string | null | undefined;
    try {
      const historial = await reproductivosService.getControlesByAnimal(animalId);
      const ultimoServicio = historial.find(
        (c) => c.tipo_evento === 'servicio' && c.toro_id,
      );
      toroId = ultimoServicio?.toro_id ?? null;
      animalNumero = historial[0]?.animal_numero;
      animalNombre = historial[0]?.animal_nombre;
    } catch (error) {
      console.error('Error buscando historial:', error);
    }
    setPartoPrefill({
      animal_id: animalId,
      animal_numero: animalNumero,
      animal_nombre: animalNombre,
      toro_id: toroId,
    });
    setIsModalOpen(true);
  };

  const handleRegistrarParto = async (diagnostico: ControlReproductivo) => {
    setSelectedControl(null);

    let toroId = diagnostico.toro_id;
    if (!toroId) {
      try {
        const historial = await reproductivosService.getControlesByAnimal(diagnostico.animal_id);
        const ultimoServicio = historial.find(
          (c) => c.tipo_evento === 'servicio' && c.toro_id,
        );
        toroId = ultimoServicio?.toro_id ?? null;
      } catch (error) {
        console.error('Error buscando servicio previo:', error);
      }
    }

    setPartoPrefill({
      animal_id: diagnostico.animal_id,
      animal_numero: diagnostico.animal_numero,
      animal_nombre: diagnostico.animal_nombre,
      toro_id: toroId,
      diagnostico_id: diagnostico.id,
    });
    setIsModalOpen(true);
  };

  const handleEliminar = async (control: ControlReproductivo) => {
    const extra =
      control.tipo_evento === 'parto'
        ? '\n\nNota: las crías ya dadas de alta en inventario no se eliminan automáticamente.'
        : '';
    if (!confirm(`¿Estás seguro de eliminar este registro?${extra}`)) return;

    try {
      await reproductivosService.deleteControlReproductivo(control.id);
      setIsDetailsOpen(false);
      setSelectedControl(null);
      loadControles();
      window.dispatchEvent(new CustomEvent('gd-reproductivo-updated'));
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
      title="Control Reproductivo"
      subtitle="Servicios, diagnosticos y partos"
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
        <div className="gd-card p-4 md:p-5 mb-6">
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
                <option value="servicio">Servicio</option>
                <option value="diagnostico">Diagnóstico</option>
                <option value="parto">Parto</option>
                <option value="aborto">Aborto</option>
                <option value="secado">Secado</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Buscar Hembra
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
            emptyMessage="No hay registros reproductivos"
            emptyAction={
              <button type="button" onClick={handleNuevo} className="font-semibold text-brand-600">
                + Crear el primer registro
              </button>
            }
          >
            {controlesFiltrados.map((control) => (
              <ReproductivoCard
                key={control.id}
                control={control}
                animalFotoUrl={animalPhotos.get(control.animal_id)?.foto_url}
                highlightParto={puedeRegistrarParto(control)}
                onClick={() => openDetails(control)}
              />
            ))}
          </EntityCardGrid>
        </div>
      </div>

      <ReproductivoDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        control={selectedControl}
        animalFotoUrl={selectedControl ? animalPhotos.get(selectedControl.animal_id)?.foto_url : null}
        puedeParto={selectedControl ? puedeRegistrarParto(selectedControl) : false}
        onRegistrarParto={() => {
          if (!selectedControl) return;
          setIsDetailsOpen(false);
          void handleRegistrarParto(selectedControl);
        }}
        onEdit={openEdit}
        onDelete={() => selectedControl && void handleEliminar(selectedControl)}
      />
      <ControlReproductivoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleModalSave}
        control={selectedControl}
        partoPrefill={partoPrefill}
      />
    </AppShell>
  );
}
