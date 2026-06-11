import api from './config';
import type { Usuario, UsuarioCreate, UsuarioListResponse, UsuarioUpdate } from '../types/usuario';

export const usuariosService = {
  async getUsuarios(): Promise<UsuarioListResponse> {
    const response = await api.get('/usuarios');
    return response.data;
  },

  async createUsuario(data: UsuarioCreate): Promise<Usuario> {
    const response = await api.post('/usuarios', data);
    return response.data;
  },

  async updateUsuario(id: number, data: UsuarioUpdate): Promise<Usuario> {
    const response = await api.patch(`/usuarios/${id}`, data);
    return response.data;
  },
};
