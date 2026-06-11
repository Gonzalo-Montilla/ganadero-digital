import { useEffect, useState } from 'react';

interface AuthenticatedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export default function AuthenticatedImage({ src, alt, className }: AuthenticatedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setResolvedSrc(src);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const response = await fetch(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('No se pudo cargar la imagen');
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setResolvedSrc(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setResolvedSrc(null);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (!resolvedSrc) {
    return <div className={`bg-slate-100 ${className ?? ''}`} aria-hidden />;
  }

  return <img src={resolvedSrc} alt={alt} className={className} />;
}
