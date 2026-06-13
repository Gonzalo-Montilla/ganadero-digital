const STORAGE_PREFIX = 'gd-alertas-leidas';

function storageKey(userId: number): string {
  return `${STORAGE_PREFIX}-${userId}`;
}

export function getAlertasLeidas(userId: number): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isAlertaLeida(userId: number, alertaId: string): boolean {
  return getAlertasLeidas(userId).includes(alertaId);
}

export function marcarAlertaLeida(userId: number, alertaId: string): void {
  const actuales = getAlertasLeidas(userId);
  if (actuales.includes(alertaId)) return;
  localStorage.setItem(storageKey(userId), JSON.stringify([...actuales, alertaId]));
}

export function filtrarAlertasNoLeidas<T extends { id: string }>(userId: number, alertas: T[]): T[] {
  const leidas = new Set(getAlertasLeidas(userId));
  return alertas.filter((alerta) => !leidas.has(alerta.id));
}
