import EntityCard from './EntityCard';
import AnimalCardMedia from './AnimalCardMedia';
import type { Transaccion } from '../../types/transaccion';
import { RUBRO_VENTA_LABELS } from '../../constants/rubroVenta';
import type { RubroVenta } from '../../constants/rubroVenta';
import { Coins, ReceiptText, ShoppingCart, Wallet } from 'lucide-react';

const tipoConfig: Record<string, { className: string; Icon: typeof Coins }> = {
  venta: { className: 'bg-emerald-100 text-emerald-800', Icon: Coins },
  compra: { className: 'bg-sky-100 text-sky-800', Icon: ShoppingCart },
  gasto: { className: 'bg-rose-100 text-rose-800', Icon: Wallet },
};

const formatMonto = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m);

interface Props {
  transaccion: Transaccion;
  animalFotoUrl?: string | null;
  onClick: () => void;
}

export default function TransaccionCard({ transaccion, animalFotoUrl, onClick }: Props) {
  const cfg = tipoConfig[transaccion.tipo] ?? { className: 'bg-slate-100 text-slate-700', Icon: ReceiptText };
  const Icon = cfg.Icon;
  const rubro =
    transaccion.tipo === 'venta'
      ? RUBRO_VENTA_LABELS[(transaccion.rubro_venta || 'otro') as RubroVenta]
      : transaccion.tipo;

  const tieneAnimal = Boolean(transaccion.animal_id && transaccion.animal_numero);

  return (
    <EntityCard
      onClick={onClick}
      title={formatMonto(transaccion.monto)}
      subtitle={transaccion.concepto}
      meta={[
        new Date(transaccion.fecha).toLocaleDateString('es-CO'),
        rubro,
        tieneAnimal ? transaccion.animal_numero! : '',
        transaccion.tercero ? `Tercero: ${transaccion.tercero}` : '',
      ].filter(Boolean)}
      badge={{ label: transaccion.tipo, className: cfg.className }}
      media={
        tieneAnimal ? (
          <AnimalCardMedia
            fotoUrl={animalFotoUrl}
            fallbackIcon={<Icon className="h-10 w-10 text-slate-400" />}
            fallbackLabel={transaccion.animal_numero || undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <Icon className="h-10 w-10 text-slate-400" />
          </div>
        )
      }
    />
  );
}
