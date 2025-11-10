import api from './config';
import type {
  RegistroProduccion,
  RegistroProduccionCreate,
  RegistroProduccionUpdate,
  RegistroProduccionListResponse,
} from '../types/produccion';

export const produccionService = {
  async getRegistros(params?: {
    animal_id?: number;
    tipo_produccion?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    skip?: number;
    limit?: number;
  }): Promise<RegistroProduccionListResponse> {
    const response = await api.get('/produccion/', { params });
    return response.data;
  },

  async getRegistro(id: number): Promise<RegistroProduccion> {
    const response = await api.get(`/produccion/${id}`);
    return response.data;
  },

  async createRegistro(data: RegistroProduccionCreate): Promise<RegistroProduccion> {
    const response = await api.post('/produccion/', data);
    return response.data;
  },

  async updateRegistro(id: number, data: RegistroProduccionUpdate): Promise<RegistroProduccion> {
    const response = await api.put(`/produccion/${id}`, data);
    return response.data;
  },

  async deleteRegistro(id: number): Promise<void> {
    await api.delete(`/produccion/${id}`);
  },
};
