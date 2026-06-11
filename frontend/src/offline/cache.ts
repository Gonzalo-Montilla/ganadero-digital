import { getMeta, putMeta, getApiCache, putApiCache } from './db';

export function getDeviceId(): string {
  const key = 'gd_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function buildCacheKey(url: string, params?: unknown): string {
  const base = url.split('?')[0];
  if (!params || (typeof params === 'object' && Object.keys(params as object).length === 0)) {
    return base;
  }
  return `${base}?${JSON.stringify(params)}`;
}

export async function cacheGetResponse(url: string, params: unknown, data: unknown): Promise<void> {
  await putApiCache(buildCacheKey(url, params), data);
}

export async function cacheReadResponse(url: string, params?: unknown): Promise<unknown | null> {
  return getApiCache(buildCacheKey(url, params));
}

export async function getLastSyncAt(): Promise<string | null> {
  const meta = await getMeta('last_sync_at');
  return typeof meta === 'string' ? meta : null;
}

export async function setLastSyncAt(iso: string): Promise<void> {
  await putMeta('last_sync_at', iso);
}
