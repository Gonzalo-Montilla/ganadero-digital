import apiClient from './client';

import type { OfflineQueuedResponse } from '../types';
import type { Animal, AnimalCreate, AnimalUpdate, AnimalesListResponse } from '../types/animal';
import { enqueuePhoto } from '../offline/photoQueue';



export type AnimalesQueryParams = {

  page?: number;

  page_size?: number;

  sexo?: string;

  raza?: string;

  categoria?: string;

  estado?: string;

  search?: string;

  lote_actual?: string;

  potrero_actual?: string;

};



export const animalesService = {

  getAnimales: async (params?: AnimalesQueryParams): Promise<AnimalesListResponse> => {

    const response = await apiClient.get('/animales', { params });

    return response.data;

  },



  /** Obtiene todas las páginas cuando se necesita la lista completa (selectores, etc.). */

  getAnimalesAll: async (params?: Omit<AnimalesQueryParams, 'page' | 'page_size'>): Promise<AnimalesListResponse> => {

    const page_size = 100;

    let page = 1;

    let items: Animal[] = [];

    let total = 0;



    while (true) {

      const res = await animalesService.getAnimales({ ...params, page, page_size });

      items = items.concat(res.items);

      total = res.total;

      if (items.length >= total || res.items.length === 0) {

        break;

      }

      page += 1;

    }



    return { total, page: 1, page_size: total, items };

  },



  getAnimal: async (id: number): Promise<Animal> => {

    const response = await apiClient.get(`/animales/${id}`);

    return response.data;

  },



  createAnimal: async (data: AnimalCreate): Promise<Animal | OfflineQueuedResponse> => {

    const response = await apiClient.post('/animales', data);

    return response.data;

  },



  updateAnimal: async (id: number, data: AnimalUpdate): Promise<Animal> => {

    const response = await apiClient.put(`/animales/${id}`, data);

    return response.data;

  },



  deleteAnimal: async (id: number): Promise<void> => {

    await apiClient.delete(`/animales/${id}`);

  },



  uploadFoto: async (animalId: number, file: File): Promise<any> => {

    const formData = new FormData();

    formData.append('file', file);

    try {

      const response = await apiClient.post(`/imagenes/animales/${animalId}/foto`, formData, {

        headers: {

          'Content-Type': 'multipart/form-data',

        },

      });

      return response.data;

    } catch (error) {

      if (!navigator.onLine) {
        await enqueuePhoto(animalId, file);
        return { queued: true, offline: true };
      }

      throw error;

    }

  },



  deleteFoto: async (animalId: number): Promise<void> => {

    await apiClient.delete(`/imagenes/animales/${animalId}/foto`);

  },



  moverLote: async (animalIds: number[], loteDestino?: string, potreroDestino?: string): Promise<{ movidos: number; no_encontrados: number[] }> => {

    const response = await apiClient.post('/animales/movimientos/lote', {

      animal_ids: animalIds,

      lote_destino: loteDestino || null,

      potrero_destino: potreroDestino || null,

    });

    return response.data;

  },

};



export default animalesService;

