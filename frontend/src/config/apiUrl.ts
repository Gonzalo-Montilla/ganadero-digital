declare global {
  interface Window {
    __GD_CONFIG__?: { apiUrl?: string };
  }
}

export function getApiUrl(): string {
  const raw =
    window.__GD_CONFIG__?.apiUrl ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8000/api/v1';

  return raw.replace(/\/$/, '');
}
