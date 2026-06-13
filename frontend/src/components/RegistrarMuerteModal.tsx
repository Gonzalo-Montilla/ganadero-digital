import { useState } from 'react';
import { animalesService } from '../api/animales';
import type { Animal } from '../types/animal';
import { MOTIVOS_MUERTE } from '../constants/motivoMuerte';
import { Skull } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
  onSuccess: () => void;
}

export default function RegistrarMuerteModal({ isOpen, onClose, animal, onSuccess }: Props) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [motivoTipo, setMotivoTipo] = useState('enfermedad');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !animal) return null;

  const handleSubmit = async () => {
    const detalle = motivoDetalle.trim();
    const label = MOTIVOS_MUERTE.find((m) => m.value === motivoTipo)?.label ?? motivoTipo;
    const motivo = detalle ? `${label}: ${detalle}` : label;

    if (!fecha || motivo.length < 3) {
      alert('Indica la fecha y al menos una causa');
      return;
    }

    const confirmacion = confirm(
      `¿Registrar como MUERTO a ${animal.numero_identificacion}${animal.nombre ? ` (${animal.nombre})` : ''}?\n\n` +
        'Esto no es una venta. El animal saldrá del inventario activo.'
    );
    if (!confirmacion) return;

    try {
      setLoading(true);
      await animalesService.registrarMuerte(animal.id, {
        fecha,
        motivo,
        observaciones: observaciones.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error registrando muerte:', error);
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'No se pudo registrar la muerte';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-rose-100 p-2">
            <Skull className="h-5 w-5 text-rose-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registrar muerte</h2>
            <p className="text-sm text-slate-600">
              {animal.numero_identificacion}
              {animal.nombre ? ` — ${animal.nombre}` : ''}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Distinto de una venta por faena. No genera ingreso en Finanzas.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha del evento</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="gd-input w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Causa</label>
            <select
              value={motivoTipo}
              onChange={(e) => setMotivoTipo(e.target.value)}
              className="gd-input w-full"
            >
              {MOTIVOS_MUERTE.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Detalle (opcional)</label>
            <input
              type="text"
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              placeholder="Ej: Atropellado en la vía, neumonía..."
              className="gd-input w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="gd-input w-full"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="gd-btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Confirmar muerte'}
          </button>
        </div>
      </div>
    </div>
  );
}
