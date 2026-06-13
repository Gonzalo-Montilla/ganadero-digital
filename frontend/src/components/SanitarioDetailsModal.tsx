import RecordDetailModal from './cards/RecordDetailModal';
import type { ControlSanitario } from '../types/sanitario';
import { vacunaPendienteAplicar } from '../utils/vacunaPendiente';

const tipoBadge: Record<string, string> = {
  vacuna: 'bg-sky-100 text-sky-800',
  desparasitacion: 'bg-emerald-100 text-emerald-800',
  tratamiento: 'bg-amber-100 text-amber-800',
  cirugia: 'bg-rose-100 text-rose-800',
  otro: 'bg-slate-100 text-slate-700',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  control: ControlSanitario | null;
  animalFotoUrl?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onAplicarVacuna?: () => void;
}

export default function SanitarioDetailsModal({
  isOpen,
  onClose,
  control,
  animalFotoUrl,
  onEdit,
  onDelete,
  onAplicarVacuna,
}: Props) {
  if (!control) return null;

  const pendienteVacuna = vacunaPendienteAplicar(control);

  return (
    <RecordDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={control.animal_numero || `Animal #${control.animal_id}`}
      subtitle={control.animal_nombre || undefined}
      badge={{ label: control.tipo, className: tipoBadge[control.tipo] ?? tipoBadge.otro }}
      animalCarnet={{
        fotoUrl: animalFotoUrl,
        numero: control.animal_numero || `#${control.animal_id}`,
        nombre: control.animal_nombre,
      }}
      actions={[
        {
          label: 'Aplicar vacuna',
          onClick: () => onAplicarVacuna?.(),
          variant: 'success',
          hidden: !pendienteVacuna || !onAplicarVacuna,
        },
        { label: 'Editar', onClick: onEdit, variant: 'brand' },
        { label: 'Eliminar', onClick: onDelete, variant: 'danger' },
      ]}
    >
      <dl>
        <RecordDetailModal.Row
          label="Fecha"
          value={new Date(control.fecha).toLocaleDateString('es-CO', { dateStyle: 'long' })}
        />
        <RecordDetailModal.Row label="Producto" value={control.producto} />
        <RecordDetailModal.Row label="Dosis" value={control.dosis} />
        <RecordDetailModal.Row label="Veterinario" value={control.veterinario} />
        {control.proxima_dosis ? (
          <RecordDetailModal.Row
            label="Próxima dosis"
            value={new Date(control.proxima_dosis).toLocaleDateString('es-CO')}
          />
        ) : null}
        {control.dias_retiro_carne ? (
          <RecordDetailModal.Row label="Retiro carne" value={`${control.dias_retiro_carne} días`} />
        ) : null}
        {control.dias_retiro_leche ? (
          <RecordDetailModal.Row label="Retiro leche" value={`${control.dias_retiro_leche} días`} />
        ) : null}
        {control.observaciones ? <RecordDetailModal.Row label="Observaciones" value={control.observaciones} /> : null}
      </dl>
    </RecordDetailModal>
  );
}
