import { useState, useEffect, useRef } from 'react';
import { sanitariosService } from '../api/sanitarios';
import { animalesService } from '../api/animales';
import type { ControlSanitario, ControlSanitarioCreate } from '../types/sanitario';
import type { Animal } from '../types/animal';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { ShieldPlus, SquarePen } from 'lucide-react';

interface ControlSanitarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  control?: ControlSanitario | null;
}

export default function ControlSanitarioModal({ isOpen, onClose, onSave, control }: ControlSanitarioModalProps) {
  const modalTitleId = 'control-sanitario-modal-title';
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLSelectElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animales, setAnimales] = useState<Animal[]>([]);
  
  const [formData, setFormData] = useState<any>({
    animal_id: '',
    tipo: 'vacuna',
    fecha: new Date().toISOString().split('T')[0],
    producto: '',
    dosis: '',
    via_administracion: '',
    lote_producto: '',
    fecha_vencimiento: '',
    veterinario: '',
    diagnostico: '',
    peso_animal: '',
    temperatura: '',
    costo: '',
    proxima_dosis: '',
    dias_retiro_leche: '',
    dias_retiro_carne: '',
    observaciones: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadAnimales();
    }
  }, [isOpen]);

  useModalFocusTrap(isOpen, onClose, modalRef, initialFocusRef);

  useEffect(() => {
    if (control) {
      setFormData({
        animal_id: control.animal_id,
        tipo: control.tipo,
        fecha: control.fecha,
        producto: control.producto || '',
        dosis: control.dosis || '',
        via_administracion: control.via_administracion || '',
        lote_producto: control.lote_producto || '',
        fecha_vencimiento: control.fecha_vencimiento || '',
        veterinario: control.veterinario || '',
        diagnostico: control.diagnostico || '',
        peso_animal: control.peso_animal || '',
        temperatura: control.temperatura || '',
        costo: control.costo || '',
        proxima_dosis: control.proxima_dosis || '',
        dias_retiro_leche: control.dias_retiro_leche || '',
        dias_retiro_carne: control.dias_retiro_carne || '',
        observaciones: control.observaciones || '',
      });
    } else {
      setFormData({
        animal_id: '',
        tipo: 'vacuna',
        fecha: new Date().toISOString().split('T')[0],
        producto: '',
        dosis: '',
        via_administracion: '',
        lote_producto: '',
        fecha_vencimiento: '',
        veterinario: '',
        diagnostico: '',
        peso_animal: '',
        temperatura: '',
        costo: '',
        proxima_dosis: '',
        dias_retiro_leche: '',
        dias_retiro_carne: '',
        observaciones: '',
      });
    }
  }, [control, isOpen]);

  const loadAnimales = async () => {
    try {
      const response = await animalesService.getAnimalesAll({ estado: 'activo' });
      setAnimales(response.items);
    } catch (err) {
      console.error('Error cargando animales:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data: ControlSanitarioCreate = {
        animal_id: parseInt(formData.animal_id),
        tipo: formData.tipo,
        fecha: formData.fecha,
        producto: formData.producto || undefined,
        dosis: formData.dosis || undefined,
        via_administracion: formData.via_administracion || undefined,
        lote_producto: formData.lote_producto || undefined,
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        veterinario: formData.veterinario || undefined,
        diagnostico: formData.diagnostico || undefined,
        peso_animal: formData.peso_animal ? parseFloat(formData.peso_animal) : undefined,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : undefined,
        costo: formData.costo ? parseFloat(formData.costo) : undefined,
        proxima_dosis: formData.proxima_dosis || undefined,
        dias_retiro_leche: formData.dias_retiro_leche ? parseInt(formData.dias_retiro_leche) : undefined,
        dias_retiro_carne: formData.dias_retiro_carne ? parseInt(formData.dias_retiro_carne) : undefined,
        observaciones: formData.observaciones || undefined,
      };

      if (control) {
        await sanitariosService.updateControlSanitario(control.id, data);
      } else {
        await sanitariosService.createControlSanitario(data);
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                <ShieldPlus className="h-6 w-6 text-brand-700" />
              )}
              {control ? 'Editar Registro Sanitario' : 'Nuevo Registro Sanitario'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Animal y Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Animal *
                </label>
                <select
                  ref={initialFocusRef}
                  required
                  value={formData.animal_id}
                  onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                  className="gd-input"
                >
                  <option value="">Seleccionar animal</option>
                  {animales.map((animal) => (
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
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="gd-input"
                >
                  <option value="vacuna">Vacuna</option>
                  <option value="desparasitacion">Desparasitación</option>
                  <option value="tratamiento">Tratamiento</option>
                  <option value="cirugia">Cirugía</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Fecha y Producto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Fecha de Aplicación *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="gd-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Producto/Medicamento
                </label>
                <input
                  type="text"
                  value={formData.producto}
                  onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                  className="gd-input"
                  placeholder="Ej: Ivermectina, Brucelina"
                />
              </div>
            </div>

            {/* Dosis y Vía */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dosis
                </label>
                <input
                  type="text"
                  value={formData.dosis}
                  onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: 5ml, 2cc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vía de Administración
                </label>
                <select
                  value={formData.via_administracion}
                  onChange={(e) => setFormData({ ...formData, via_administracion: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="intramuscular">Intramuscular</option>
                  <option value="subcutanea">Subcutánea</option>
                  <option value="oral">Oral</option>
                  <option value="topica">Tópica</option>
                  <option value="intravenosa">Intravenosa</option>
                  <option value="intramamaria">Intramamaria</option>
                </select>
              </div>
            </div>

            {/* Lote y Vencimiento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lote del Producto
                </label>
                <input
                  type="text"
                  value={formData.lote_producto}
                  onChange={(e) => setFormData({ ...formData, lote_producto: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: L20231015"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Veterinario y Diagnóstico */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Veterinario
                </label>
                <input
                  type="text"
                  value={formData.veterinario}
                  onChange={(e) => setFormData({ ...formData, veterinario: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Nombre del veterinario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Diagnóstico/Motivo
                </label>
                <input
                  type="text"
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Prevención brucelosis"
                />
              </div>
            </div>

            {/* Peso, Temperatura y Costo */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Peso del Animal (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso_animal}
                  onChange={(e) => setFormData({ ...formData, peso_animal: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="450"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperatura}
                  onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="38.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Costo ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Próxima Dosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Próxima Dosis/Refuerzo
              </label>
              <input
                type="date"
                value={formData.proxima_dosis}
                onChange={(e) => setFormData({ ...formData, proxima_dosis: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">Para vacunas que requieren refuerzo</p>
            </div>

            {/* Días de Retiro */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Días de Retiro de Leche
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.dias_retiro_leche}
                  onChange={(e) => setFormData({ ...formData, dias_retiro_leche: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Días de Retiro de Carne
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.dias_retiro_carne}
                  onChange={(e) => setFormData({ ...formData, dias_retiro_carne: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                />
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
