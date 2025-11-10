import apiClient from './client';
import type { 
  ControlSanitario, 
  ControlSanitarioCreate, 
  ControlSanitarioUpdate,
  ControlSanitarioListResponse 
} from '../types/sanitario';

export const sanitariosService = {
  // Listar controles sanitarios con filtros
  getControlesSanitarios: async (params?: {
    animal_id?: number;
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    skip?: number;
    limit?: number;
  }): Promise<ControlSanitarioListResponse> => {
    const response = await apiClient.get<ControlSanitarioListResponse>('/control-sanitario/', { params });
    return response.data;
  },

  // Obtener un control sanitario por ID
  getControlSanitario: async (id: number): Promise<ControlSanitario> => {
    const response = await apiClient.get<ControlSanitario>(`/control-sanitario/${id}`);
    return response.data;
  },

  // Crear control sanitario
  createControlSanitario: async (data: ControlSanitarioCreate): Promise<ControlSanitario> => {
    const response = await apiClient.post<ControlSanitario>('/control-sanitario/', data);
    return response.data;
  },

  // Actualizar control sanitario
  updateControlSanitario: async (id: number, data: ControlSanitarioUpdate): Promise<ControlSanitario> => {
    const response = await apiClient.put<ControlSanitario>(`/control-sanitario/${id}`, data);
    return response.data;
  },

  // Eliminar control sanitario
  deleteControlSanitario: async (id: number): Promise<void> => {
    await apiClient.delete(`/control-sanitario/${id}`);
  },

  // Obtener controles sanitarios por animal
  getControlesByAnimal: async (animalId: number): Promise<ControlSanitario[]> => {
    const response = await apiClient.get<ControlSanitarioListResponse>('/control-sanitario/', {
      params: { animal_id: animalId, limit: 100 }
    });
    return response.data.items;
  },
};
