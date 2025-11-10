import apiClient from './client';
import type { 
  ControlReproductivo, 
  ControlReproductivoCreate, 
  ControlReproductivoUpdate,
  ControlReproductivoListResponse 
} from '../types/reproductivo';

export const reproductivosService = {
  // Listar controles reproductivos con filtros
  getControlesReproductivos: async (params?: {
    animal_id?: number;
    tipo_evento?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    diagnostico?: string;
    skip?: number;
    limit?: number;
  }): Promise<ControlReproductivoListResponse> => {
    const response = await apiClient.get<ControlReproductivoListResponse>('/control-reproductivo/', { params });
    return response.data;
  },

  // Obtener un control reproductivo por ID
  getControlReproductivo: async (id: number): Promise<ControlReproductivo> => {
    const response = await apiClient.get<ControlReproductivo>(`/control-reproductivo/${id}`);
    return response.data;
  },

  // Crear control reproductivo
  createControlReproductivo: async (data: ControlReproductivoCreate): Promise<ControlReproductivo> => {
    const response = await apiClient.post<ControlReproductivo>('/control-reproductivo/', data);
    return response.data;
  },

  // Actualizar control reproductivo
  updateControlReproductivo: async (id: number, data: ControlReproductivoUpdate): Promise<ControlReproductivo> => {
    const response = await apiClient.put<ControlReproductivo>(`/control-reproductivo/${id}`, data);
    return response.data;
  },

  // Eliminar control reproductivo
  deleteControlReproductivo: async (id: number): Promise<void> => {
    await apiClient.delete(`/control-reproductivo/${id}`);
  },

  // Obtener controles reproductivos por animal
  getControlesByAnimal: async (animalId: number): Promise<ControlReproductivo[]> => {
    const response = await apiClient.get<ControlReproductivoListResponse>('/control-reproductivo/', {
      params: { animal_id: animalId, limit: 100 }
    });
    return response.data.items;
  },
};
