import EntityCard from './EntityCard';
import AnimalCardMedia from './AnimalCardMedia';
import type { RegistroProduccion } from '../../types/produccion';
import { Droplets } from 'lucide-react';

const tipoBadge: Record<string, string> = {
  leche: 'bg-sky-100 text-sky-800',
  carne: 'bg-rose-100 text-rose-800',
  lana: 'bg-purple-100 text-purple-800',
  otro: 'bg-slate-100 text-slate-700',
};

interface Props {
  registro: RegistroProduccion;
  animalFotoUrl?: string | null;
  onClick: () => void;
}

export default function ProduccionCard({ registro, animalFotoUrl, onClick }: Props) {
  const cantidad =
    registro.tipo_produccion === 'leche' && registro.cantidad_litros
      ? `${registro.cantidad_litros} L`
      : registro.tipo_produccion === 'carne' && registro.peso_venta
      ? `${registro.peso_venta} kg`
      : '';

  return (
    <EntityCard
      onClick={onClick}
      title={registro.animal_numero || `#${registro.animal_id}`}
      subtitle={registro.animal_nombre || undefined}
      meta={[
        new Date(registro.fecha).toLocaleDateString('es-CO'),
        cantidad,
        registro.turno ? `Turno: ${registro.turno}` : '',
      ].filter(Boolean)}
      badge={{
        label: registro.tipo_produccion,
        className: tipoBadge[registro.tipo_produccion] ?? tipoBadge.otro,
      }}
      media={
        <AnimalCardMedia
          fotoUrl={animalFotoUrl}
          fallbackIcon={<Droplets className="h-10 w-10 text-sky-500" />}
          fallbackLabel={registro.animal_numero || undefined}
        />
      }
    />
  );
}
