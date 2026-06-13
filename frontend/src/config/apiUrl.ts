declare global {
  interface Window {
    __GD_CONFIG__?: { apiUrl?: string };
  }
}

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  return /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

export function getApiUrl(): string {
  const runtime = window.__GD_CONFIG__?.apiUrl;
  const build = import.meta.env.VITE_API_URL as string | undefined;

  let raw = runtime || build || 'http://localhost:8000/api/v1';

  // public/config.js de desarrollo (localhost) no debe usarse en Railway
  if (runtime?.includes('localhost') && !isLocalHost()) {
    raw = build || runtime;
  }

  return raw.replace(/\/$/, '');
}
