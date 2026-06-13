import RecordDetailModal from './cards/RecordDetailModal';
import type { RegistroProduccion } from '../types/produccion';

const tipoBadge: Record<string, string> = {
  leche: 'bg-sky-100 text-sky-800',
  carne: 'bg-rose-100 text-rose-800',
  lana: 'bg-purple-100 text-purple-800',
  otro: 'bg-slate-100 text-slate-700',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  registro: RegistroProduccion | null;
  animalFotoUrl?: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProduccionDetailsModal({
  isOpen,
  onClose,
  registro,
  animalFotoUrl,
  onEdit,
  onDelete,
}: Props) {
  if (!registro) return null;

  const cantidad =
    registro.tipo_produccion === 'leche' && registro.cantidad_litros
      ? `${registro.cantidad_litros} L`
      : registro.tipo_produccion === 'carne' && registro.peso_venta
      ? `${registro.peso_venta} kg`
      : null;

  return (
    <RecordDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={registro.animal_numero || `Animal #${registro.animal_id}`}
      subtitle={registro.animal_nombre || undefined}
      badge={{
        label: registro.tipo_produccion,
        className: tipoBadge[registro.tipo_produccion] ?? tipoBadge.otro,
      }}
      animalCarnet={{
        fotoUrl: animalFotoUrl,
        numero: registro.animal_numero || `#${registro.animal_id}`,
        nombre: registro.animal_nombre,
      }}
      actions={[
        { label: 'Editar', onClick: onEdit, variant: 'brand' },
        { label: 'Eliminar', onClick: onDelete, variant: 'danger' },
      ]}
    >
      <dl>
        <RecordDetailModal.Row
          label="Fecha"
          value={new Date(registro.fecha).toLocaleDateString('es-CO', { dateStyle: 'long' })}
        />
        {cantidad ? <RecordDetailModal.Row label="Cantidad" value={cantidad} /> : null}
        {registro.turno ? <RecordDetailModal.Row label="Turno" value={registro.turno} /> : null}
        {registro.calidad ? <RecordDetailModal.Row label="Calidad" value={registro.calidad} /> : null}
        {registro.observaciones ? <RecordDetailModal.Row label="Observaciones" value={registro.observaciones} /> : null}
      </dl>
    </RecordDetailModal>
  );
}
