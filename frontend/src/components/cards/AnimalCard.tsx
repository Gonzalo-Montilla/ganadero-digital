import { Beef } from 'lucide-react';
import EntityCard from './EntityCard';
import AuthenticatedImage from '../AuthenticatedImage';
import { getMediaUrl } from '../../utils/mediaUrl';
import type { Animal } from '../../types/animal';

const estadoBadge: Record<string, string> = {
  activo: 'bg-emerald-100 text-emerald-700',
  vendido: 'bg-sky-100 text-sky-700',
  muerto: 'bg-rose-100 text-rose-700',
  eliminado: 'bg-slate-100 text-slate-600',
};

interface AnimalCardProps {
  animal: Animal;
  selected?: boolean;
  onSelectToggle?: () => void;
  onClick: () => void;
}

export default function AnimalCard({ animal, selected, onSelectToggle, onClick }: AnimalCardProps) {
  const listoFaena =
    animal.estado === 'activo' &&
    animal.proposito !== 'leche' &&
    animal.peso_actual != null &&
    animal.peso_actual >= (animal.categoria?.match(/novilla|vaquillona|ternera/i) ? 380 : 420);

  return (
    <EntityCard
      onClick={onClick}
      title={animal.nombre || animal.numero_identificacion}
      subtitle={`#${animal.numero_identificacion}`}
      meta={[
        animal.raza ? `Raza: ${animal.raza}` : '',
        animal.categoria ? `Cat: ${animal.categoria}` : '',
        animal.peso_actual ? `${animal.peso_actual} kg` : '',
      ].filter(Boolean)}
      badge={{
        label: animal.estado,
        className: estadoBadge[animal.estado] ?? 'bg-slate-100 text-slate-700',
      }}
      selectable={animal.estado === 'activo'}
      selected={selected}
      onSelectToggle={onSelectToggle}
      media={
        animal.foto_url ? (
          <AuthenticatedImage
            src={getMediaUrl(animal.foto_url)}
            alt={animal.nombre || animal.numero_identificacion}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-brand-800">
            <Beef className="h-10 w-10 opacity-70" />
            <span className="mt-1 text-xs font-bold">{animal.numero_identificacion}</span>
          </div>
        )
      }
      footer={
        listoFaena ? (
          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
            Listo faena
          </span>
        ) : undefined
      }
    />
  );
}
