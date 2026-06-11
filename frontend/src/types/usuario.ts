export interface Usuario {
  id: number;
  email: string;
  nombre_completo: string;
  telefono?: string | null;
  documento?: string | null;
  rol: string;
  activo: boolean;
  finca_id: number;
  email_verificado: boolean;
  idioma: string;
  recibir_notificaciones: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface UsuarioCreate {
  email: string;
  nombre_completo: string;
  password: string;
  telefono?: string;
  documento?: string;
  rol: string;
}

export interface UsuarioUpdate {
  nombre_completo?: string;
  telefono?: string;
  documento?: string;
  rol?: string;
  activo?: boolean;
  recibir_notificaciones?: boolean;
  password?: string;
}

export interface UsuarioListResponse {
  total: number;
  items: Usuario[];
}

export const ROL_LABELS: Record<string, string> = {
  propietario: 'Propietario',
  admin: 'Administrador',
  operario: 'Operario',
  veterinario: 'Veterinario',
};

export const ROL_OPTIONS = [
  { value: 'operario', label: 'Operario' },
  { value: 'veterinario', label: 'Veterinario' },
  { value: 'admin', label: 'Administrador' },
];
