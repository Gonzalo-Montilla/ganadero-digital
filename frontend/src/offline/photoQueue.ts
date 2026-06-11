import { deletePhotoQueueItem, listPhotoQueueItems, putPhotoQueueItem, type PhotoQueueItem } from './db';
import apiClient from '../api/client';

function makePhotoId(): string {
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function enqueuePhoto(animalId: number, file: File): Promise<void> {
  await putPhotoQueueItem({
    id: makePhotoId(),
    animalId,
    fileName: file.name,
    mimeType: file.type || 'image/jpeg',
    blob: file,
    createdAt: new Date().toISOString(),
  });
}

export type PhotoFlushResult = {
  uploaded: number;
  failed: number;
};

export async function flushPhotoQueue(): Promise<PhotoFlushResult> {
  if (!navigator.onLine) {
    return { uploaded: 0, failed: 0 };
  }

  const pending = await listPhotoQueueItems();
  let uploaded = 0;
  let failed = 0;

  for (const item of pending) {
    if (item.animalId == null) {
      failed += 1;
      continue;
    }

    try {
      const formData = new FormData();
      const file = new File([item.blob], item.fileName, { type: item.mimeType });
      formData.append('file', file);
      await apiClient.post(`/imagenes/animales/${item.animalId}/foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await deletePhotoQueueItem(item.id);
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }

  return { uploaded, failed };
}

export async function countPendingPhotos(): Promise<number> {
  const items = await listPhotoQueueItems();
  return items.filter((item: PhotoQueueItem) => item.animalId != null).length;
}
