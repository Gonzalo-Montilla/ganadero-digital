import { countOutboxOperations } from './db';
import { flushOutbox, purgeNonSyncableOperations } from './outbox';
import { flushPhotoQueue } from './photoQueue';
import { pullServerUpdates } from '../api/sync';

let syncInProgress = false;

export type SyncResult = {
  synced: number;
  failed: number;
  discarded: number;
  remaining: number;
  message?: string;
};

export async function syncOfflineOperations(): Promise<SyncResult> {
  if (!navigator.onLine) {
    const remaining = await countOutboxOperations();
    return {
      synced: 0,
      failed: 0,
      discarded: 0,
      remaining,
      message: 'Sin conexión. Conéctate a internet e intenta de nuevo.',
    };
  }

  if (syncInProgress) {
    const remaining = await countOutboxOperations();
    return {
      synced: 0,
      failed: 0,
      discarded: 0,
      remaining,
      message: 'Ya hay una sincronización en curso.',
    };
  }

  syncInProgress = true;
  try {
    await purgeNonSyncableOperations();
    const result = await flushOutbox();
    await flushPhotoQueue();
    try {
      await pullServerUpdates();
    } catch {
      // Pull es complementario; no bloquea la cola de escrituras.
    }
    const remaining = await countOutboxOperations();

    let message: string | undefined;
    if (result.discarded > 0 && remaining === 0) {
      message = 'Se limpió una operación inválida (login u otro). Cola vacía.';
    } else if (result.synced > 0 && remaining === 0) {
      message = `Listo: ${result.synced} cambio(s) enviado(s) al servidor.`;
    } else if (result.failed > 0) {
      message = result.lastError || 'No se pudo sincronizar. Revisa tu sesión o el dato guardado.';
    } else if (remaining === 0) {
      message = 'Todo sincronizado.';
    } else if (result.discarded > 0) {
      message = result.lastError || 'Se descartaron operaciones que ya no aplican.';
    }

    return {
      synced: result.synced,
      failed: result.failed,
      discarded: result.discarded,
      remaining,
      message,
    };
  } finally {
    syncInProgress = false;
  }
}

export function setupOfflineSyncListeners(): () => void {
  const handleOnline = () => {
    void syncOfflineOperations();
  };

  void purgeNonSyncableOperations().then(() => syncOfflineOperations());

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
