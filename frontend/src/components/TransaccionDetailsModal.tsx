import RecordDetailModal from './cards/RecordDetailModal';
import type { Transaccion } from '../types/transaccion';
import { RUBRO_VENTA_LABELS } from '../constants/rubroVenta';
import type { RubroVenta } from '../constants/rubroVenta';
import { RUBRO_AFECTACION_LABELS } from '../constants/rubroAfectacion';
import type { RubroAfectacion } from '../constants/rubroAfectacion';

const tipoBadge: Record<string, string> = {
  venta: 'bg-emerald-100 text-emerald-800',
  compra: 'bg-sky-100 text-sky-800',
  gasto: 'bg-rose-100 text-rose-800',
};

const formatMonto = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaccion: Transaccion | null;
  animalFotoUrl?: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TransaccionDetailsModal({
  isOpen,
  onClose,
  transaccion,
  animalFotoUrl,
  onEdit,
  onDelete,
}: Props) {
  if (!transaccion) return null;

  const rubro =
    transaccion.tipo === 'venta'
      ? RUBRO_VENTA_LABELS[(transaccion.rubro_venta || 'otro') as RubroVenta]
      : transaccion.tipo === 'gasto' && transaccion.rubro_afectacion
      ? RUBRO_AFECTACION_LABELS[transaccion.rubro_afectacion as RubroAfectacion]
      : null;

  const fechaLabel = new Date(transaccion.fecha).toLocaleDateString('es-CO', { dateStyle: 'long' });
  const tieneAnimal = Boolean(transaccion.animal_id && transaccion.animal_numero);

  return (
    <RecordDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={transaccion.concepto}
      subtitle={fechaLabel}
      badge={{ label: transaccion.tipo, className: tipoBadge[transaccion.tipo] ?? 'bg-slate-100 text-slate-700' }}
      animalCarnet={
        tieneAnimal
          ? {
              fotoUrl: animalFotoUrl,
              numero: transaccion.animal_numero!,
              nombre: transaccion.animal_nombre,
            }
          : undefined
      }
      headerCaption={tieneAnimal ? transaccion.concepto : undefined}
      headerSubcaption={tieneAnimal ? fechaLabel : undefined}
      actions={[
        { label: 'Editar', onClick: onEdit, variant: 'brand' },
        { label: 'Eliminar', onClick: onDelete, variant: 'danger' },
      ]}
    >
      <dl>
        <RecordDetailModal.Row label="Monto" value={formatMonto(transaccion.monto)} />
        {rubro ? <RecordDetailModal.Row label="Rubro" value={rubro} /> : null}
        {transaccion.cantidad_litros ? (
          <RecordDetailModal.Row label="Litros" value={`${transaccion.cantidad_litros} L`} />
        ) : null}
        {!tieneAnimal && transaccion.animal_numero ? (
          <RecordDetailModal.Row
            label="Animal"
            value={`${transaccion.animal_numero}${transaccion.animal_nombre ? ` — ${transaccion.animal_nombre}` : ''}`}
          />
        ) : null}
        <RecordDetailModal.Row label="Tercero" value={transaccion.tercero} />
        <RecordDetailModal.Row label="Documento" value={transaccion.documento_tercero} />
        <RecordDetailModal.Row label="Método pago" value={transaccion.metodo_pago} />
        {transaccion.categoria_gasto ? (
          <RecordDetailModal.Row label="Categoría gasto" value={transaccion.categoria_gasto} />
        ) : null}
        {transaccion.observaciones ? (
          <RecordDetailModal.Row label="Observaciones" value={transaccion.observaciones} />
        ) : null}
      </dl>
    </RecordDetailModal>
  );
}
