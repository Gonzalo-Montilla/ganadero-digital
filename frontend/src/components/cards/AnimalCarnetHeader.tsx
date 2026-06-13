import AuthenticatedImage from '../AuthenticatedImage';
import { getMediaUrl } from '../../utils/mediaUrl';

interface AnimalCarnetHeaderProps {
  fotoUrl?: string | null;
  numero: string;
  nombre?: string | null;
  badge?: { label: string; className: string };
}

export default function AnimalCarnetHeader({ fotoUrl, numero, nombre, badge }: AnimalCarnetHeaderProps) {
  const iniciales = numero.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || '?';

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200">
        {fotoUrl ? (
          <AuthenticatedImage
            src={getMediaUrl(fotoUrl)}
            alt={numero}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-brand-800">
            <span className="text-[10px] font-bold leading-none">{iniciales}</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-bold text-slate-900">{numero}</h2>
          {badge ? (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </div>
        {nombre ? <p className="truncate text-sm text-slate-500">{nombre}</p> : null}
      </div>
    </div>
  );
}
