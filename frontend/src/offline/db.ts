export interface OutboxOperation {
  id: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  url: string;
  payload?: unknown;
  createdAt: string;
}

const DB_NAME = 'ganadero_digital_offline';
const DB_VERSION = 2;
const OUTBOX_STORE = 'outbox';
const API_CACHE_STORE = 'apiCache';
const META_STORE = 'meta';
const PHOTO_QUEUE_STORE = 'photoQueue';

export interface PhotoQueueItem {
  id: string;
  animalId: number | null;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(API_CACHE_STORE)) {
        db.createObjectStore(API_CACHE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(PHOTO_QUEUE_STORE)) {
        db.createObjectStore(PHOTO_QUEUE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putOutboxOperation(operation: OutboxOperation): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    tx.objectStore(OUTBOX_STORE).put(operation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listOutboxOperations(): Promise<OutboxOperation[]> {
  const db = await openDb();
  const records = await new Promise<OutboxOperation[]>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const request = tx.objectStore(OUTBOX_STORE).getAll();
    request.onsuccess = () => resolve(request.result as OutboxOperation[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function countOutboxOperations(): Promise<number> {
  const db = await openDb();
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const request = tx.objectStore(OUTBOX_STORE).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return count;
}

export async function deleteOutboxOperation(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    tx.objectStore(OUTBOX_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function putApiCache(key: string, data: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(API_CACHE_STORE, 'readwrite');
    tx.objectStore(API_CACHE_STORE).put({ key, data, cachedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getApiCache(key: string): Promise<unknown | null> {
  const db = await openDb();
  const record = await new Promise<{ data: unknown } | undefined>((resolve, reject) => {
    const tx = db.transaction(API_CACHE_STORE, 'readonly');
    const request = tx.objectStore(API_CACHE_STORE).get(key);
    request.onsuccess = () => resolve(request.result as { data: unknown } | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record?.data ?? null;
}

export async function putMeta(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getMeta(key: string): Promise<unknown | null> {
  const db = await openDb();
  const record = await new Promise<{ value: unknown } | undefined>((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const request = tx.objectStore(META_STORE).get(key);
    request.onsuccess = () => resolve(request.result as { value: unknown } | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record?.value ?? null;
}

export async function putPhotoQueueItem(item: PhotoQueueItem): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE_STORE, 'readwrite');
    tx.objectStore(PHOTO_QUEUE_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listPhotoQueueItems(): Promise<PhotoQueueItem[]> {
  const db = await openDb();
  const records = await new Promise<PhotoQueueItem[]>((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE_STORE, 'readonly');
    const request = tx.objectStore(PHOTO_QUEUE_STORE).getAll();
    request.onsuccess = () => resolve(request.result as PhotoQueueItem[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function deletePhotoQueueItem(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE_STORE, 'readwrite');
    tx.objectStore(PHOTO_QUEUE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
