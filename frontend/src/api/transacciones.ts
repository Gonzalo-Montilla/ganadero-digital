import api from './config';
import type {
  Transaccion,
  TransaccionCreate,
  TransaccionUpdate,
  TransaccionListResponse,
} from '../types/transaccion';

export const transaccionesService = {
  async getTransacciones(params?: {
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    skip?: number;
    limit?: number;
  }): Promise<TransaccionListResponse> {
    const response = await api.get('/transacciones/', { params });
    return response.data;
  },

  async getTransaccion(id: number): Promise<Transaccion> {
    const response = await api.get(`/transacciones/${id}`);
    return response.data;
  },

  async createTransaccion(data: TransaccionCreate): Promise<Transaccion> {
    const response = await api.post('/transacciones/', data);
    return response.data;
  },

  async updateTransaccion(id: number, data: TransaccionUpdate): Promise<Transaccion> {
    const response = await api.put(`/transacciones/${id}`, data);
    return response.data;
  },

  async deleteTransaccion(id: number): Promise<void> {
    await api.delete(`/transacciones/${id}`);
  },

  async comprarAnimal(data: {
    animal: {
      numero_identificacion: string;
      nombre?: string;
      sexo: string;
      raza: string;
      fecha_nacimiento?: string;
      peso_actual?: number;
      categoria?: string;
      proposito?: string;
      color?: string;
      observaciones?: string;
    };
    transaccion: {
      fecha: string;
      monto: number;
      tercero?: string;
      documento_tercero?: string;
      peso_total?: number;
      precio_por_kg?: number;
      numero_animales?: number;
      metodo_pago?: string;
      observaciones?: string;
    };
  }): Promise<any> {
    const response = await api.post('/transacciones/compra-animal', data);
    return response.data;
  },
};
