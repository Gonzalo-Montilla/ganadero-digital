import { useState, useEffect, useRef } from 'react';
import { reproductivosService } from '../api/reproductivos';
import { animalesService } from '../api/animales';
import type { ControlReproductivo, ControlReproductivoCreate, CriaPartoInventario, PartoPrefill } from '../types/reproductivo';
import type { Animal } from '../types/animal';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { createEmptyCria, syncCriasCount, criaRequiereInventario, validarCriasParto } from '../utils/partoCrias';
import { calcularFppDesdeDiagnostico } from '../utils/gestacion';
import { isOfflineQueued } from '../types';
import { Baby, Microscope, SquarePen, Stethoscope, Syringe } from 'lucide-react';

interface ControlReproductivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  control?: ControlReproductivo | null;
  partoPrefill?: PartoPrefill | null;
}

export default function ControlReproductivoModal({ isOpen, onClose, onSave, control, partoPrefill }: ControlReproductivoModalProps) {
  const modalTitleId = 'control-reproductivo-modal-title';
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLSelectElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hembras, setHembras] = useState<Animal[]>([]);
  const [machos, setMachos] = useState<Animal[]>([]);
  const [crias, setCrias] = useState<CriaPartoInventario[]>([createEmptyCria()]);
  
  const [formData, setFormData] = useState<any>({
    animal_id: '',
    tipo_evento: 'servicio',
    fecha_evento: new Date().toISOString().split('T')[0],
    toro_id: '',
    tipo_servicio: '',
    numero_servicio: '',
    pajuela_utilizada: '',
    toro_pajuela: '',
    diagnostico: '',
    metodo_diagnostico: '',
    dias_gestacion: '',
    fecha_probable_parto: '',
    tipo_parto: '',
    numero_crias: '1',
    sexo_cria: '',
    peso_cria: '',
    facilidad_parto: '',
    vitalidad_cria: '',
    veterinario: '',
    costo: '',
    observaciones: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadAnimales();
    }
  }, [isOpen]);

  useModalFocusTrap(isOpen, onClose, modalRef, initialFocusRef);

  useEffect(() => {
    if (!isOpen) return;

    if (control) {
      setFormData({
        animal_id: control.animal_id,
        tipo_evento: control.tipo_evento,
        fecha_evento: control.fecha_evento,
        toro_id: control.toro_id || '',
        tipo_servicio: control.tipo_servicio || '',
        numero_servicio: control.numero_servicio || '',
        pajuela_utilizada: control.pajuela_utilizada || '',
        toro_pajuela: control.toro_pajuela || '',
        diagnostico: control.diagnostico || '',
        metodo_diagnostico: control.metodo_diagnostico || '',
        dias_gestacion: control.dias_gestacion || '',
        fecha_probable_parto: control.fecha_probable_parto || '',
        tipo_parto: control.tipo_parto || '',
        numero_crias: control.numero_crias || '',
        sexo_cria: control.sexo_cria || '',
        peso_cria: control.peso_cria || '',
        facilidad_parto: control.facilidad_parto || '',
        vitalidad_cria: control.vitalidad_cria || '',
        veterinario: control.veterinario || '',
        costo: control.costo || '',
        observaciones: control.observaciones || '',
      });
      return;
    }

    if (partoPrefill) {
      const madre = hembras.find((h) => h.id === partoPrefill.animal_id);
      setFormData({
        animal_id: partoPrefill.animal_id,
        tipo_evento: 'parto',
        fecha_evento: new Date().toISOString().split('T')[0],
        toro_id: partoPrefill.toro_id || '',
        tipo_servicio: '',
        numero_servicio: '',
        pajuela_utilizada: '',
        toro_pajuela: '',
        diagnostico: '',
        metodo_diagnostico: '',
        dias_gestacion: '',
        fecha_probable_parto: '',
        tipo_parto: '',
        numero_crias: '1',
        sexo_cria: '',
        peso_cria: '',
        facilidad_parto: '',
        vitalidad_cria: '',
        veterinario: '',
        costo: '',
        observaciones: '',
      });
      setCrias([createEmptyCria(madre)]);
      setSuccessMessage('');
      setError('');
      return;
    }

    resetForm();
  }, [control, partoPrefill, isOpen, hembras]);

  const resetForm = () => {
    setFormData({
      animal_id: '',
      tipo_evento: 'servicio',
      fecha_evento: new Date().toISOString().split('T')[0],
      toro_id: '',
      tipo_servicio: '',
      numero_servicio: '',
      pajuela_utilizada: '',
      toro_pajuela: '',
      diagnostico: '',
      metodo_diagnostico: '',
      dias_gestacion: '',
      fecha_probable_parto: '',
      tipo_parto: '',
      numero_crias: '1',
      sexo_cria: '',
      peso_cria: '',
      facilidad_parto: '',
      vitalidad_cria: '',
      veterinario: '',
      costo: '',
      observaciones: '',
    });
    setCrias([createEmptyCria()]);
    setSuccessMessage('');
    setError('');
  };

  useEffect(() => {
    if (!isOpen || control || formData.tipo_evento !== 'parto') return;
    const count = parseInt(formData.numero_crias, 10) || 1;
    const madre = hembras.find((h) => String(h.id) === String(formData.animal_id));
    setCrias((prev) => syncCriasCount(prev, count, madre));
  }, [formData.numero_crias, formData.animal_id, formData.tipo_evento, isOpen, control, hembras]);

  const updateCria = (index: number, patch: Partial<CriaPartoInventario>) => {
    setCrias((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  };

  const loadAnimales = async () => {
    try {
      const response = await animalesService.getAnimalesAll({ estado: 'activo' });
      const hembrasFiltered = response.items.filter(a => a.sexo === 'hembra');
      const machosFiltered = response.items.filter(a => a.sexo === 'macho');
      setHembras(hembrasFiltered);
      setMachos(machosFiltered);
    } catch (err) {
      console.error('Error cargando animales:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const isPartoNuevo = !control && formData.tipo_evento === 'parto';

      if (isPartoNuevo && !navigator.onLine) {
        setError('Registrar un parto con crías requiere conexión para crear los animales en inventario.');
        setLoading(false);
        return;
      }

      if (isPartoNuevo) {
        const validationError = validarCriasParto(crias);
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }
      }

      const data: ControlReproductivoCreate = {
        animal_id: parseInt(formData.animal_id),
        tipo_evento: formData.tipo_evento,
        fecha_evento: formData.fecha_evento,
        toro_id: formData.toro_id ? parseInt(formData.toro_id) : undefined,
        tipo_servicio: formData.tipo_servicio || undefined,
        numero_servicio: formData.numero_servicio ? parseInt(formData.numero_servicio) : undefined,
        pajuela_utilizada: formData.pajuela_utilizada || undefined,
        toro_pajuela: formData.toro_pajuela || undefined,
        diagnostico: formData.diagnostico || undefined,
        metodo_diagnostico: formData.metodo_diagnostico || undefined,
        dias_gestacion: formData.dias_gestacion ? parseInt(formData.dias_gestacion) : undefined,
        fecha_probable_parto: formData.fecha_probable_parto || undefined,
        tipo_parto: formData.tipo_parto || undefined,
        facilidad_parto: formData.facilidad_parto || undefined,
        veterinario: formData.veterinario || undefined,
        costo: formData.costo ? parseFloat(formData.costo) : undefined,
        observaciones: formData.observaciones || undefined,
      };

      if (isPartoNuevo) {
        data.crias = crias.map((c) => ({
          ...c,
          numero_identificacion: c.numero_identificacion?.trim() || undefined,
          nombre: c.nombre?.trim() || undefined,
          sexo: c.sexo || undefined,
        }));
      } else if (formData.tipo_evento === 'parto') {
        data.numero_crias = formData.numero_crias ? parseInt(formData.numero_crias) : undefined;
        data.sexo_cria = formData.sexo_cria || undefined;
        data.peso_cria = formData.peso_cria ? parseFloat(formData.peso_cria) : undefined;
        data.vitalidad_cria = formData.vitalidad_cria || undefined;
      }

      if (control) {
        const response = await reproductivosService.updateControlReproductivo(control.id, data);
        if (isOfflineQueued(response)) {
          setSuccessMessage('Registro guardado localmente. Se sincronizará al recuperar conexión.');
          window.dispatchEvent(new CustomEvent('gd-reproductivo-updated'));
          onSave();
          setTimeout(() => onClose(), 1800);
        } else {
          window.dispatchEvent(new CustomEvent('gd-reproductivo-updated'));
          onSave();
          onClose();
        }
      } else {
        const result = await reproductivosService.createControlReproductivo(data);
        if (isOfflineQueued(result)) {
          setSuccessMessage('Registro guardado localmente. Se sincronizará al recuperar conexión.');
          window.dispatchEvent(new CustomEvent('gd-reproductivo-updated'));
          onSave();
          setTimeout(() => onClose(), 1800);
        } else if (result.crias_creadas?.length) {
          window.dispatchEvent(new CustomEvent('gd-animales-updated'));
          window.dispatchEvent(new CustomEvent('gd-reproductivo-updated'));
          const chapetas = result.crias_creadas
            .map((c) => c.numero_identificacion)
            .join(', ');
          setSuccessMessage(
            `Parto registrado. Crías dadas de alta en inventario: ${chapetas}`,
          );
          onSave();
          setTimeout(() => onClose(), 1800);
        } else {
          window.dispatchEvent(new CustomEvent('gd-reproductivo-updated'));
          onSave();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tipoEvento = formData.tipo_evento;

  return (
    <div
      className="gd-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="gd-modal-panel gd-modal-surface max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="gd-modal-body p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 id={modalTitleId} className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              {control ? (
                <SquarePen className="h-6 w-6 text-brand-700" />
              ) : (
                <Baby className="h-6 w-6 text-brand-700" />
              )}
              {control ? 'Editar Registro Reproductivo' : partoPrefill ? 'Registrar parto' : 'Nuevo Registro Reproductivo'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          {partoPrefill && !control && (
            <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
              Nuevo evento de parto para{' '}
              <strong>
                {partoPrefill.animal_numero || partoPrefill.animal_id}
                {partoPrefill.animal_nombre ? ` — ${partoPrefill.animal_nombre}` : ''}
              </strong>
              . El diagnóstico de preñez no se modifica; solo se crea el registro del nacimiento.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hembra y Tipo de Evento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Hembra *
                </label>
                <select
                  ref={initialFocusRef}
                  required
                  disabled={Boolean(partoPrefill)}
                  value={formData.animal_id}
                  onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                  className="gd-input disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Seleccionar hembra</option>
                  {hembras.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.numero_identificacion} - {animal.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tipo de Evento *
                </label>
                <select
                  required
                  disabled={Boolean(partoPrefill) || Boolean(control)}
                  value={formData.tipo_evento}
                  onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                  className="gd-input disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="servicio">Servicio/Monta</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="parto">Parto</option>
                  <option value="aborto">Aborto</option>
                  <option value="secado">Secado</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Fecha del Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha del Evento *
              </label>
              <input
                type="date"
                required
                value={formData.fecha_evento}
                onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Campos para SERVICIO */}
            {tipoEvento === 'servicio' && (
              <>
                <div className="border-t pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Syringe className="h-4 w-4 text-brand-700" />
                    Datos del Servicio
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Servicio
                      </label>
                      <select
                        value={formData.tipo_servicio}
                        onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="monta_natural">Monta Natural</option>
                        <option value="inseminacion_artificial">Inseminación Artificial</option>
                        <option value="transferencia_embrion">Transferencia de Embrión</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Número de Servicio
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.numero_servicio}
                        onChange={(e) => setFormData({ ...formData, numero_servicio: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                        placeholder="1, 2, 3..."
                      />
                    </div>
                  </div>

                  {formData.tipo_servicio === 'monta_natural' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Toro
                      </label>
                      <select
                        value={formData.toro_id}
                        onChange={(e) => setFormData({ ...formData, toro_id: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Seleccionar toro</option>
                        {machos.map((animal) => (
                          <option key={animal.id} value={animal.id}>
                            {animal.numero_identificacion} - {animal.nombre || 'Sin nombre'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.tipo_servicio === 'inseminacion_artificial' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Código de Pajuela
                        </label>
                        <input
                          type="text"
                          value={formData.pajuela_utilizada}
                          onChange={(e) => setFormData({ ...formData, pajuela_utilizada: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Ej: ABC123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Toro/Código
                        </label>
                        <input
                          type="text"
                          value={formData.toro_pajuela}
                          onChange={(e) => setFormData({ ...formData, toro_pajuela: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Nombre/código del toro"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Campos para DIAGNÓSTICO */}
            {tipoEvento === 'diagnostico' && (
              <>
                <div className="border-t pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Microscope className="h-4 w-4 text-brand-700" />
                    Datos del Diagnóstico
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Resultado
                      </label>
                      <select
                        value={formData.diagnostico}
                        onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="prenada">Preñada</option>
                        <option value="vacia">Vacía</option>
                        <option value="dudosa">Dudosa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Método
                      </label>
                      <select
                        value={formData.metodo_diagnostico}
                        onChange={(e) => setFormData({ ...formData, metodo_diagnostico: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="palpacion">Palpación</option>
                        <option value="ecografia">Ecografía</option>
                        <option value="laboratorio">Laboratorio</option>
                      </select>
                    </div>
                  </div>

                  {formData.diagnostico === 'prenada' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Días de Gestación
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.dias_gestacion}
                          onChange={(e) => {
                            const dias = e.target.value;
                            const patch: Record<string, string> = { dias_gestacion: dias };
                            if (dias && formData.fecha_evento) {
                              patch.fecha_probable_parto = calcularFppDesdeDiagnostico(
                                formData.fecha_evento,
                                parseInt(dias, 10),
                              );
                            }
                            setFormData({ ...formData, ...patch });
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Ej: 60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Fecha Probable de Parto
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_probable_parto}
                          onChange={(e) => setFormData({ ...formData, fecha_probable_parto: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Se calcula sola al ingresar días de gestación. Necesaria para alertas de parto.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Campos para PARTO */}
            {tipoEvento === 'parto' && (
              <>
                <div className="border-t pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Stethoscope className="h-4 w-4 text-brand-700" />
                    Datos del Parto
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Parto
                      </label>
                      <select
                        value={formData.tipo_parto}
                        onChange={(e) => setFormData({ ...formData, tipo_parto: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="normal">Normal</option>
                        <option value="asistido">Asistido</option>
                        <option value="cesarea">Cesárea</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Facilidad del Parto
                      </label>
                      <select
                        value={formData.facilidad_parto}
                        onChange={(e) => setFormData({ ...formData, facilidad_parto: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="facil">Fácil</option>
                        <option value="normal">Normal</option>
                        <option value="dificil">Difícil</option>
                        <option value="muy_dificil">Muy Difícil</option>
                      </select>
                    </div>
                  </div>

                  {!control && (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Número de Crías
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={formData.numero_crias || '1'}
                            onChange={(e) =>
                              setFormData({ ...formData, numero_crias: e.target.value })
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Toro / Padre (opcional)
                          </label>
                          <select
                            value={formData.toro_id}
                            onChange={(e) => setFormData({ ...formData, toro_id: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                          >
                            <option value="">Inferir del último servicio</option>
                            {machos.map((animal) => (
                              <option key={animal.id} value={animal.id}>
                                {animal.numero_identificacion} - {animal.nombre || 'Sin nombre'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-slate-600">
                        Las crías vivas o débiles se registran automáticamente en el inventario de
                        animales. Las muertas quedan solo en el evento reproductivo.
                      </p>

                      <div className="mt-4 space-y-4">
                        {crias.map((cria, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
                          >
                            <h4 className="mb-3 text-sm font-semibold text-slate-800">
                              Cría {index + 1}
                            </h4>

                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Vitalidad *
                                </label>
                                <select
                                  required
                                  value={cria.vitalidad}
                                  onChange={(e) =>
                                    updateCria(index, {
                                      vitalidad: e.target.value as CriaPartoInventario['vitalidad'],
                                    })
                                  }
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                >
                                  <option value="viva">Viva</option>
                                  <option value="debil">Débil</option>
                                  <option value="muerta">Muerta</option>
                                </select>
                              </div>

                              {criaRequiereInventario(cria.vitalidad) && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Chapeta *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={cria.numero_identificacion || ''}
                                      onChange={(e) =>
                                        updateCria(index, { numero_identificacion: e.target.value })
                                      }
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                      placeholder="Ej: C-001"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Sexo *
                                    </label>
                                    <select
                                      required
                                      value={cria.sexo || ''}
                                      onChange={(e) =>
                                        updateCria(index, {
                                          sexo: e.target.value as CriaPartoInventario['sexo'],
                                        })
                                      }
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="macho">Macho</option>
                                      <option value="hembra">Hembra</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Nombre
                                    </label>
                                    <input
                                      type="text"
                                      value={cria.nombre || ''}
                                      onChange={(e) => updateCria(index, { nombre: e.target.value })}
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Peso al nacer (kg)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={cria.peso_nacimiento ?? ''}
                                      onChange={(e) =>
                                        updateCria(index, {
                                          peso_nacimiento: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                        })
                                      }
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Raza
                                    </label>
                                    <input
                                      type="text"
                                      value={cria.raza || ''}
                                      onChange={(e) => updateCria(index, { raza: e.target.value })}
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Lote
                                    </label>
                                    <input
                                      type="text"
                                      value={cria.lote_actual || ''}
                                      onChange={(e) =>
                                        updateCria(index, { lote_actual: e.target.value })
                                      }
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Potrero
                                    </label>
                                    <input
                                      type="text"
                                      value={cria.potrero_actual || ''}
                                      onChange={(e) =>
                                        updateCria(index, { potrero_actual: e.target.value })
                                      }
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Propósito
                                    </label>
                                    <select
                                      value={cria.proposito || 'carne'}
                                      onChange={(e) =>
                                        updateCria(index, { proposito: e.target.value })
                                      }
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    >
                                      <option value="carne">Carne</option>
                                      <option value="leche">Leche</option>
                                      <option value="doble_proposito">Doble propósito</option>
                                      <option value="reproduccion">Reproducción</option>
                                    </select>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700">
                                Observaciones de la cría
                              </label>
                              <input
                                type="text"
                                value={cria.observaciones || ''}
                                onChange={(e) =>
                                  updateCria(index, { observaciones: e.target.value })
                                }
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                placeholder="Notas sobre esta cría"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {control && (
                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <span className="block text-xs font-medium uppercase text-slate-500">
                          Nº crías
                        </span>
                        <span className="text-sm text-slate-800">{control.numero_crias ?? '—'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium uppercase text-slate-500">
                          Sexo
                        </span>
                        <span className="text-sm text-slate-800">{control.sexo_cria ?? '—'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium uppercase text-slate-500">
                          Peso prom.
                        </span>
                        <span className="text-sm text-slate-800">
                          {control.peso_cria != null ? `${control.peso_cria} kg` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium uppercase text-slate-500">
                          Vitalidad
                        </span>
                        <span className="text-sm text-slate-800">
                          {control.vitalidad_cria ?? '—'}
                        </span>
                      </div>
                      {control.crias_creadas && control.crias_creadas.length > 0 && (
                        <div className="col-span-full">
                          <span className="block text-xs font-medium uppercase text-slate-500">
                            Crías en inventario
                          </span>
                          <span className="text-sm text-slate-800">
                            {control.crias_creadas
                              .map((c) => c.numero_identificacion)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      <p className="col-span-full text-sm text-slate-500">
                        El alta de crías en inventario solo aplica al registrar un parto nuevo.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Campos comunes */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Veterinario
                  </label>
                  <input
                    type="text"
                    value={formData.veterinario}
                    onChange={(e) => setFormData({ ...formData, veterinario: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Nombre del veterinario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Costo ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="gd-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="gd-btn-primary disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
