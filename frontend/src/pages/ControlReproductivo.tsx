import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reproductivosService } from '../api/reproductivos';
import ControlReproductivoModal from '../components/ControlReproductivoModal';
import type { ControlReproductivo, PartoPrefill } from '../types/reproductivo';
import {
  puedeRegistrarPartoDesdeDiagnostico,
  encontrarDiagnosticoPrenadaAbierto,
} from '../utils/gestacion';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

export default function ControlReproductivoPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [searchParams, setSearchParams] = useSearchParams();
  const [controles, setControles] = useState<ControlReproductivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAnimal, setFiltroAnimal] = useState('');
  const [filtroAnimalId, setFiltroAnimalId] = useState<number | null>(null);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleEditar = (control: ControlReproductivo) => {
    setPartoPrefill(null);
    setSelectedControl(control);
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'servicio': return 'Servicio';
      case 'diagnostico': return 'Diagnóstico';
      case 'parto': return 'Parto';
      case 'aborto': return 'Aborto';
      case 'secado': return 'Secado';
      default: return 'Otro';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'servicio': return 'bg-blue-100 text-blue-800';
      case 'diagnostico': return 'bg-purple-100 text-purple-800';
      case 'parto': return 'bg-green-100 text-green-800';
      case 'aborto': return 'bg-red-100 text-red-800';
      case 'secado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiagnosticoColor = (diagnostico: string | null) => {
    switch (diagnostico) {
      case 'prenada': return 'text-green-600 font-semibold';
      case 'vacia': return 'text-red-600';
      case 'dudosa': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  // Filtrar localmente por animal
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

        {/* Tabla */}
        <div className="gd-card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Cargando registros...</p>
            </div>
          ) : controlesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No hay registros reproductivos</p>
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
                        <p className="text-xs text-slate-500">{formatDate(control.fecha_evento)}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${getTipoColor(control.tipo_evento)}`}>
                        {getTipoIcon(control.tipo_evento)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      {control.tipo_evento === 'servicio' ? (control.tipo_servicio || 'Servicio') : ''}
                      {control.tipo_evento === 'parto' && control.numero_crias ? `${control.numero_crias} cría(s)` : ''}
                    </p>
                    <p className={`mt-1 text-xs ${getDiagnosticoColor(control.diagnostico)}`}>
                      {control.diagnostico ? control.diagnostico.toUpperCase() : 'SIN DIAGNÓSTICO'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {puedeRegistrarParto(control) && (
                        <button
                          onClick={() => handleRegistrarParto(control)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          Registrar parto
                        </button>
                      )}
                      <button onClick={() => handleEditar(control)} className="gd-btn-secondary !px-3 !py-2 text-xs">Editar</button>
                      <button onClick={() => handleEliminar(control)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Eliminar</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hembra</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalles</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Diagnóstico</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Veterinario</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {controlesFiltrados.map((control) => (
                      <tr key={control.id} className="hover:bg-brand-50/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDate(control.fecha_evento)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-slate-900">{control.animal_numero || `ID: ${control.animal_id}`}</div>
                          {control.animal_nombre && <div className="text-slate-500">{control.animal_nombre}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(control.tipo_evento)}`}>
                            {getTipoIcon(control.tipo_evento)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {control.tipo_evento === 'servicio' && (
                            <div className="text-xs">
                              {control.tipo_servicio && <div>{control.tipo_servicio.replace('_', ' ')}</div>}
                              {control.toro_numero && <div>Toro: {control.toro_numero}</div>}
                              {control.toro_pajuela && <div>{control.toro_pajuela}</div>}
                            </div>
                          )}
                          {control.tipo_evento === 'parto' && (
                            <div className="text-xs">
                              {control.numero_crias && <div>{control.numero_crias} cría(s)</div>}
                              {control.sexo_cria && <div>{control.sexo_cria}</div>}
                              {control.peso_cria && <div>{control.peso_cria} kg</div>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getDiagnosticoColor(control.diagnostico)}>
                            {control.diagnostico ? control.diagnostico.toUpperCase() : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{control.veterinario || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {puedeRegistrarParto(control) && (
                            <button
                              onClick={() => handleRegistrarParto(control)}
                              className="mr-3 text-emerald-700 hover:text-emerald-900 font-semibold"
                            >
                              Registrar parto
                            </button>
                          )}
                          <button onClick={() => handleEditar(control)} className="text-sky-600 hover:text-sky-800 mr-3">Editar</button>
                          <button onClick={() => handleEliminar(control)} className="text-red-600 hover:text-red-900">Eliminar</button>
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
