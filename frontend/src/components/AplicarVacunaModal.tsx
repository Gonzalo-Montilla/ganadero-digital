import { useEffect, useRef, useState } from 'react';
import { HeartPulse, Syringe } from 'lucide-react';
import { sanitariosService } from '../api/sanitarios';
import type { ControlSanitario } from '../types/sanitario';
import { useAuth } from '../context/AuthContext';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { defaultProximaDosisAnual } from '../utils/vacunaPendiente';

interface AplicarVacunaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  registro: ControlSanitario | null;
}

export default function AplicarVacunaModal({
  isOpen,
  onClose,
  onSaved,
  registro,
}: AplicarVacunaModalProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    fecha_aplicacion: hoy,
    veterinario: '',
    dosis: '',
    via_administracion: '',
    lote_producto: '',
    proxima_dosis: '',
    dias_retiro_leche: '',
    dias_retiro_carne: '',
    costo: '',
    observaciones: '',
  });

  useEffect(() => {
    if (!isOpen || !registro) return;

    setError('');
    setFormData({
      fecha_aplicacion: hoy,
      veterinario: user?.nombre_completo || registro.veterinario || '',
      dosis: registro.dosis || '',
      via_administracion: registro.via_administracion || '',
      lote_producto: registro.lote_producto || '',
      proxima_dosis: defaultProximaDosisAnual(hoy),
      dias_retiro_leche: registro.dias_retiro_leche?.toString() || '',
      dias_retiro_carne: registro.dias_retiro_carne?.toString() || '',
      costo: registro.costo?.toString() || '',
      observaciones: '',
    });
  }, [isOpen, registro, user?.nombre_completo, hoy]);

  useModalFocusTrap(isOpen, onClose, modalRef, submitRef);

  if (!isOpen || !registro) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sanitariosService.aplicarVacuna(registro.id, {
        fecha_aplicacion: formData.fecha_aplicacion,
        veterinario: formData.veterinario || undefined,
        dosis: formData.dosis || undefined,
        via_administracion: formData.via_administracion
          ? (formData.via_administracion as NonNullable<ControlSanitario['via_administracion']>)
          : undefined,
        lote_producto: formData.lote_producto || undefined,
        proxima_dosis: formData.proxima_dosis || undefined,
        dias_retiro_leche: formData.dias_retiro_leche ? Number(formData.dias_retiro_leche) : undefined,
        dias_retiro_carne: formData.dias_retiro_carne ? Number(formData.dias_retiro_carne) : undefined,
        costo: formData.costo ? Number(formData.costo) : undefined,
        observaciones: formData.observaciones || undefined,
      });

      window.dispatchEvent(new Event('gd-sanidad-updated'));
      onSaved();
      onClose();
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setError(typeof detail === 'string' ? detail : 'No se pudo registrar la aplicación');
    } finally {
      setLoading(false);
    }
  };

  const animalLabel = registro.animal_nombre || registro.animal_numero || `#${registro.animal_id}`;

  return (
    <div
      className="gd-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aplicar-vacuna-title"
        className="gd-modal-panel gd-modal-surface max-h-[90vh] w-full max-w-2xl overflow-y-auto"
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 id="aplicar-vacuna-title" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            <Syringe className="h-5 w-5 text-brand-700" aria-hidden />
            Aplicar vacuna
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Registra la aplicación en la hoja de vida de{' '}
            <strong>{animalLabel}</strong> ({registro.producto || 'vacuna'}).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gd-modal-body space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Fecha de aplicación *</label>
              <input
                type="date"
                required
                value={formData.fecha_aplicacion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fecha_aplicacion: e.target.value,
                    proxima_dosis: prev.proxima_dosis || defaultProximaDosisAnual(e.target.value),
                  }))
                }
                className="gd-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Aplicada por</label>
              <input
                type="text"
                value={formData.veterinario}
                onChange={(e) => setFormData({ ...formData, veterinario: e.target.value })}
                placeholder="Veterinario o responsable"
                className="gd-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Producto</label>
              <input type="text" value={registro.producto || ''} disabled className="gd-input bg-slate-50" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Dosis</label>
              <input
                type="text"
                value={formData.dosis}
                onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
                placeholder="Ej: 2 cc"
                className="gd-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Vía</label>
              <select
                value={formData.via_administracion}
                onChange={(e) => setFormData({ ...formData, via_administracion: e.target.value })}
                className="gd-input"
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
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Lote producto</label>
              <input
                type="text"
                value={formData.lote_producto}
                onChange={(e) => setFormData({ ...formData, lote_producto: e.target.value })}
                className="gd-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Próxima dosis</label>
              <input
                type="date"
                value={formData.proxima_dosis}
                onChange={(e) => setFormData({ ...formData, proxima_dosis: e.target.value })}
                className="gd-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Costo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                className="gd-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Retiro leche (días)</label>
              <input
                type="number"
                min="0"
                value={formData.dias_retiro_leche}
                onChange={(e) => setFormData({ ...formData, dias_retiro_leche: e.target.value })}
                className="gd-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Retiro carne (días)</label>
              <input
                type="number"
                min="0"
                value={formData.dias_retiro_carne}
                onChange={(e) => setFormData({ ...formData, dias_retiro_carne: e.target.value })}
                className="gd-input"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Observaciones</label>
            <textarea
              rows={3}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="gd-input"
              placeholder="Detalle de la aplicación en campo..."
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
            <HeartPulse className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Al guardar se crea un nuevo registro en la hoja de vida del animal y se cierra la alerta de esta
              vacuna pendiente.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="gd-btn-secondary" disabled={loading}>
              Cancelar
            </button>
            <button ref={submitRef} type="submit" className="gd-btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Registrar aplicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
