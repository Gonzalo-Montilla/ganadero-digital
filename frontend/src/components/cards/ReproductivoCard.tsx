import EntityCard from './EntityCard';
import AnimalCardMedia from './AnimalCardMedia';
import type { ControlReproductivo } from '../../types/reproductivo';
import { Baby } from 'lucide-react';

const tipoBadge: Record<string, string> = {
  servicio: 'bg-sky-100 text-sky-800',
  diagnostico: 'bg-purple-100 text-purple-800',
  parto: 'bg-emerald-100 text-emerald-800',
  aborto: 'bg-rose-100 text-rose-800',
  secado: 'bg-slate-100 text-slate-700',
  otro: 'bg-slate-100 text-slate-700',
};

interface Props {
  control: ControlReproductivo;
  animalFotoUrl?: string | null;
  onClick: () => void;
  highlightParto?: boolean;
}

export default function ReproductivoCard({ control, animalFotoUrl, onClick, highlightParto }: Props) {
  return (
    <EntityCard
      onClick={onClick}
      title={control.animal_numero || `#${control.animal_id}`}
      subtitle={control.animal_nombre || undefined}
      meta={[
        new Date(control.fecha_evento).toLocaleDateString('es-CO'),
        control.diagnostico ? control.diagnostico.toUpperCase() : '',
        control.tipo_evento === 'parto' && control.numero_crias ? `${control.numero_crias} cría(s)` : '',
      ].filter(Boolean)}
      badge={{ label: control.tipo_evento, className: tipoBadge[control.tipo_evento] ?? tipoBadge.otro }}
      media={
        <AnimalCardMedia
          fotoUrl={animalFotoUrl}
          fallbackIcon={<Baby className="h-10 w-10 text-rose-500" />}
          fallbackLabel={control.animal_numero || undefined}
        />
      }
      footer={
        highlightParto ? (
          <span className="text-[10px] font-semibold text-emerald-700">Puede registrar parto</span>
        ) : undefined
      }
    />
  );
}
