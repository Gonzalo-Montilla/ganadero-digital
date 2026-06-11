import apiClient from './client';
import { getDeviceId, getLastSyncAt, setLastSyncAt } from '../offline/cache';

export interface SyncPullResponse {
  success: boolean;
  synced_at: string;
  updates_from_server: Array<{
    entity_type: string;
    entity_id: number;
    operation: string;
    data: Record<string, unknown>;
  }>;
  conflicts: unknown[];
  errors: string[];
  message: string;
}

export async function pullServerUpdates(): Promise<SyncPullResponse | null> {
  if (!navigator.onLine) return null;

  const lastSync = await getLastSyncAt();
  const response = await apiClient.post<SyncPullResponse>('/sync/sync', {
    device_id: getDeviceId(),
    last_sync: lastSync,
    operations: [],
  });

  if (response.data.synced_at) {
    await setLastSyncAt(response.data.synced_at);
  }

  return response.data;
}
