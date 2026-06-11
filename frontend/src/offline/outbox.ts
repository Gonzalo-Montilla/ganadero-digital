import axios from 'axios';
import { deleteOutboxOperation, listOutboxOperations, putOutboxOperation, type OutboxOperation } from './db';
import apiClient from '../api/client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

function emitOutboxChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('gd-outbox-changed'));
  }
}

function makeOutboxId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Guarda solo la ruta relativa al baseURL de la API. */
export function normalizeOutboxUrl(url: string): string {
  if (!url) return '/';

  if (url.startsWith(API_BASE)) {
    const path = url.slice(API_BASE.length);
    return path.startsWith('/') ? path : `/${path}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      const basePath = new URL(`${API_BASE}/`).pathname.replace(/\/$/, '');
      if (parsed.pathname.startsWith(basePath)) {
        const relative = parsed.pathname.slice(basePath.length);
        return relative.startsWith('/') ? relative : `/${relative}`;
      }
    } catch {
      // continuar
    }
  }

  return url.startsWith('/') ? url : `/${url}`;
}

/** Solo datos de finca; nunca login, refresh ni subida de archivos. */
export function isSyncableOperation(url: string): boolean {
  const path = normalizeOutboxUrl(url).toLowerCase();
  if (path.startsWith('/auth/')) return false;
  if (path.includes('/imagenes/')) return false;
  return true;
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (typeof item === 'object' && item && 'msg' in item ? String(item.msg) : String(item)))
        .join(', ');
    }
    if (error.response?.status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.';
    if (error.response?.status === 422) return 'Dato inválido o expirado en la cola. Se descartó la operación.';
    return error.message || 'Error al enviar al servidor';
  }
  return 'Error de red';
}

export async function enqueueOperation(
  method: OutboxOperation['method'],
  url: string,
  payload?: unknown,
): Promise<void> {
  if (!isSyncableOperation(url)) {
    return;
  }

  await putOutboxOperation({
    id: makeOutboxId(),
    method,
    url: normalizeOutboxUrl(url),
    payload,
    createdAt: new Date().toISOString(),
  });
  emitOutboxChanged();
}

/** Elimina operaciones que no deben reenviarse (p. ej. login atascado). */
export async function purgeNonSyncableOperations(): Promise<number> {
  const pending = await listOutboxOperations();
  let removed = 0;

  for (const operation of pending) {
    if (!isSyncableOperation(operation.url)) {
      await deleteOutboxOperation(operation.id);
      removed += 1;
    }
  }

  if (removed > 0) {
    emitOutboxChanged();
  }

  return removed;
}

export type FlushResult = {
  synced: number;
  failed: number;
  discarded: number;
  lastError?: string;
};

export async function flushOutbox(): Promise<FlushResult> {
  const pending = await listOutboxOperations();
  let synced = 0;
  let failed = 0;
  let discarded = 0;
  let lastError: string | undefined;

  for (const operation of pending) {
    if (!isSyncableOperation(operation.url)) {
      await deleteOutboxOperation(operation.id);
      discarded += 1;
      emitOutboxChanged();
      continue;
    }

    try {
      await apiClient.request({
        method: operation.method,
        url: normalizeOutboxUrl(operation.url),
        data: operation.payload,
        headers: {
          'x-offline-replay': '1',
        },
      });
      await deleteOutboxOperation(operation.id);
      synced += 1;
      emitOutboxChanged();
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 422 || error.response?.status === 401)) {
        await deleteOutboxOperation(operation.id);
        discarded += 1;
        lastError = extractErrorMessage(error);
        emitOutboxChanged();
        continue;
      }
      failed += 1;
      lastError = extractErrorMessage(error);
    }
  }

  return { synced, failed, discarded, lastError };
}
