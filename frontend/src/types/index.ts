export interface User {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
  finca_id: number;
  activo: boolean;
}

export interface LoginCredentials {
  username: string; // email
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
