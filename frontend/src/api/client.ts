import axios from 'axios';
import { enqueueOperation } from '../offline/outbox';
import { cacheGetResponse, cacheReadResponse } from '../offline/cache';
import { getApiUrl } from '../config/apiUrl';

const API_URL = getApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y caché offline en lecturas
apiClient.interceptors.response.use(
  async (response) => {
    const method = String(response.config?.method || '').toLowerCase();
    if (method === 'get') {
      const url = String(response.config.url || '');
      await cacheGetResponse(url, response.config.params, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró (401) y no hemos reintentado ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, cerrar sesión
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Offline-first: guardar escrituras cuando no hay conectividad.
    const method = String(originalRequest?.method || '').toLowerCase();
    const isWrite = method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
    const isReplay = Boolean(originalRequest?.headers?.['x-offline-replay']);
    const networkIssue = !error.response;
    const requestUrl = String(originalRequest?.url || '');
    const isAuthOrMedia = requestUrl.includes('/auth/') || requestUrl.includes('/imagenes/');
    if (isWrite && !isReplay && networkIssue && !isAuthOrMedia) {
      await enqueueOperation(method as 'post' | 'put' | 'patch' | 'delete', originalRequest.url, originalRequest.data);
      return Promise.resolve({
        data: { queued: true, offline: true },
        status: 202,
        statusText: 'Accepted (queued offline)',
        headers: {},
        config: originalRequest,
      });
    }

    if (method === 'get' && networkIssue) {
      const cached = await cacheReadResponse(requestUrl, originalRequest?.params);
      if (cached != null) {
        return Promise.resolve({
          data: cached,
          status: 200,
          statusText: 'OK (offline cache)',
          headers: { 'x-offline-cache': '1' },
          config: originalRequest,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
