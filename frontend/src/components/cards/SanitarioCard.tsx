import EntityCard from './EntityCard';
import AnimalCardMedia from './AnimalCardMedia';
import type { ControlSanitario } from '../../types/sanitario';
import { HeartPulse } from 'lucide-react';
import { vacunaPendienteAplicar } from '../../utils/vacunaPendiente';

const tipoBadge: Record<string, string> = {
  vacuna: 'bg-sky-100 text-sky-800',
  desparasitacion: 'bg-emerald-100 text-emerald-800',
  tratamiento: 'bg-amber-100 text-amber-800',
  cirugia: 'bg-rose-100 text-rose-800',
  otro: 'bg-slate-100 text-slate-700',
};

interface Props {
  control: ControlSanitario;
  animalFotoUrl?: string | null;
  onClick: () => void;
}

export default function SanitarioCard({ control, animalFotoUrl, onClick }: Props) {
  const pendiente = vacunaPendienteAplicar(control);

  return (
    <EntityCard
      onClick={onClick}
      title={control.animal_numero || `#${control.animal_id}`}
      subtitle={control.producto || 'Sin producto'}
      meta={[
        new Date(control.fecha).toLocaleDateString('es-CO'),
        control.animal_nombre || '',
        control.veterinario ? `Vet: ${control.veterinario}` : '',
      ].filter(Boolean)}
      badge={{ label: control.tipo, className: tipoBadge[control.tipo] ?? tipoBadge.otro }}
      media={
        <AnimalCardMedia
          fotoUrl={animalFotoUrl}
          fallbackIcon={<HeartPulse className="h-10 w-10 text-emerald-600" />}
          fallbackLabel={control.animal_numero || undefined}
        />
      }
      footer={
        pendiente ? (
          <span className="text-[10px] font-semibold text-brand-700">Vacuna pendiente</span>
        ) : undefined
      }
    />
  );
}
