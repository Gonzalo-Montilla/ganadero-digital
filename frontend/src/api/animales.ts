import apiClient from './client';
import type { Animal, AnimalCreate, AnimalUpdate, AnimalesListResponse } from '../types/animal';

export const animalesService = {
  // Listar animales con paginación y filtros
  getAnimales: async (params?: {
    skip?: number;
    limit?: number;
    sexo?: string;
    raza?: string;
    categoria?: string;
    estado?: string;
    search?: string;
  }): Promise<AnimalesListResponse> => {
    const response = await apiClient.get('/animales', { params });
    return response.data;
  },

  // Obtener un animal por ID
  getAnimal: async (id: number): Promise<Animal> => {
    const response = await apiClient.get(`/animales/${id}`);
    return response.data;
  },

  // Crear animal
  createAnimal: async (data: AnimalCreate): Promise<Animal> => {
    const response = await apiClient.post('/animales', data);
    return response.data;
  },

  // Actualizar animal
  updateAnimal: async (id: number, data: AnimalUpdate): Promise<Animal> => {
    const response = await apiClient.put(`/animales/${id}`, data);
    return response.data;
  },

  // Eliminar animal (soft delete)
  deleteAnimal: async (id: number): Promise<void> => {
    await apiClient.delete(`/animales/${id}`);
  },

  // Subir foto
  uploadFoto: async (animalId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/imagenes/animales/${animalId}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Eliminar foto
  deleteFoto: async (animalId: number): Promise<void> => {
    await apiClient.delete(`/imagenes/animales/${animalId}/foto`);
  },
};

export default animalesService;
