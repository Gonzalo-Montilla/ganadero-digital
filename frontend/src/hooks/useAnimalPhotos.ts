import { useEffect, useState } from 'react';
import { animalesService } from '../api/animales';

export interface AnimalPhotoInfo {
  foto_url: string | null;
  numero_identificacion: string;
  nombre: string | null;
}

/**
 * Mapa animal_id → foto y datos básicos para tarjetas de otros módulos.
 */
export function useAnimalPhotos() {
  const [photos, setPhotos] = useState<Map<number, AnimalPhotoInfo>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await animalesService.getAnimalesAll({});
      const map = new Map<number, AnimalPhotoInfo>();
      for (const animal of res.items) {
        map.set(animal.id, {
          foto_url: animal.foto_url ?? null,
          numero_identificacion: animal.numero_identificacion,
          nombre: animal.nombre ?? null,
        });
      }
      setPhotos(map);
    } catch (error) {
      console.error('Error cargando fotos de animales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener('gd-animales-updated', refresh);
    return () => window.removeEventListener('gd-animales-updated', refresh);
  }, []);

  return { photos, loading };
}
