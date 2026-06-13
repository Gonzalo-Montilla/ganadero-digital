import RecordDetailModal from './cards/RecordDetailModal';
import type { ControlReproductivo } from '../types/reproductivo';

const tipoBadge: Record<string, string> = {
  servicio: 'bg-sky-100 text-sky-800',
  diagnostico: 'bg-purple-100 text-purple-800',
  parto: 'bg-emerald-100 text-emerald-800',
  aborto: 'bg-rose-100 text-rose-800',
  secado: 'bg-slate-100 text-slate-700',
  otro: 'bg-slate-100 text-slate-700',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  control: ControlReproductivo | null;
  animalFotoUrl?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onRegistrarParto?: () => void;
  puedeParto?: boolean;
}

export default function ReproductivoDetailsModal({
  isOpen,
  onClose,
  control,
  animalFotoUrl,
  onEdit,
  onDelete,
  onRegistrarParto,
  puedeParto,
}: Props) {
  if (!control) return null;

  return (
    <RecordDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={control.animal_numero || `Hembra #${control.animal_id}`}
      subtitle={control.animal_nombre || undefined}
      badge={{ label: control.tipo_evento, className: tipoBadge[control.tipo_evento] ?? tipoBadge.otro }}
      animalCarnet={{
        fotoUrl: animalFotoUrl,
        numero: control.animal_numero || `#${control.animal_id}`,
        nombre: control.animal_nombre,
      }}
      actions={[
        {
          label: 'Registrar parto',
          onClick: () => onRegistrarParto?.(),
          variant: 'success',
          hidden: !puedeParto || !onRegistrarParto,
        },
        { label: 'Editar', onClick: onEdit, variant: 'brand' },
        { label: 'Eliminar', onClick: onDelete, variant: 'danger' },
      ]}
    >
      <dl>
        <RecordDetailModal.Row
          label="Fecha"
          value={new Date(control.fecha_evento).toLocaleDateString('es-CO', { dateStyle: 'long' })}
        />
        {control.diagnostico ? (
          <RecordDetailModal.Row label="Diagnóstico" value={control.diagnostico.toUpperCase()} />
        ) : null}
        {control.tipo_servicio ? <RecordDetailModal.Row label="Tipo servicio" value={control.tipo_servicio} /> : null}
        {control.toro_numero ? (
          <RecordDetailModal.Row
            label="Toro"
            value={`${control.toro_numero}${control.toro_nombre ? ` — ${control.toro_nombre}` : ''}`}
          />
        ) : null}
        {control.numero_crias ? <RecordDetailModal.Row label="Crías" value={control.numero_crias} /> : null}
        {control.veterinario ? <RecordDetailModal.Row label="Veterinario" value={control.veterinario} /> : null}
        {control.observaciones ? <RecordDetailModal.Row label="Observaciones" value={control.observaciones} /> : null}
      </dl>
    </RecordDetailModal>
  );
}
