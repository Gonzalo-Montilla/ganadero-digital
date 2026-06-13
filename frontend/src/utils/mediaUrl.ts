import { getApiUrl } from '../config/apiUrl';

const API_URL = getApiUrl();

function toAuthenticatedMediaPath(path: string): string {
  if (path.startsWith('/api/v1/media/')) {
    return path;
  }
  if (path.startsWith('/media/')) {
    return `/api/v1/media/${path.slice('/media/'.length)}`;
  }
  return path;
}

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:') || path.startsWith('blob:')) return path;

  const normalized = toAuthenticatedMediaPath(path.startsWith('/') ? path : `/${path}`);
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${normalized}`;
}
