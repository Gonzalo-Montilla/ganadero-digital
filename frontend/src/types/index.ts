export interface User {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
  finca_id: number;
  activo: boolean;
}

export interface LoginCredentials {
  username: string; // email
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface OfflineQueuedResponse {
  queued: true;
  offline: true;
}

export function isOfflineQueued(value: unknown): value is OfflineQueuedResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'queued' in value &&
    (value as OfflineQueuedResponse).queued === true
  );
}
