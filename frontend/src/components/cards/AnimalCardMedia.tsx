import type { ReactNode } from 'react';
import AuthenticatedImage from '../AuthenticatedImage';
import { getMediaUrl } from '../../utils/mediaUrl';

interface AnimalCardMediaProps {
  fotoUrl?: string | null;
  fallbackIcon: ReactNode;
  fallbackLabel?: string;
}

export default function AnimalCardMedia({ fotoUrl, fallbackIcon, fallbackLabel }: AnimalCardMediaProps) {
  if (fotoUrl) {
    return (
      <AuthenticatedImage
        src={getMediaUrl(fotoUrl)}
        alt={fallbackLabel || 'Animal'}
        className="h-full w-full object-cover transition group-hover:scale-105"
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-brand-800">
      {fallbackIcon}
      {fallbackLabel ? <span className="mt-1 text-xs font-bold">{fallbackLabel}</span> : null}
    </div>
  );
}
