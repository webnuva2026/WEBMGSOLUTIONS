import { Usuario, Rol } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CreateUserData {
  username: string;
  password?: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  rolId?: number;
  rol?: string;
  sucursalId?: number | null;
}

export interface CreateRoleData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  modulosPredeterminados: string[];
}

export const userService = {
  // ─── PRESENCIA / DISPONIBILIDAD ───
  async getPresencia(): Promise<{ success: boolean; presencia: Record<number, string> }> {
    const res = await fetch(`${API_BASE_URL}/presencia`, { headers: getAuthHeaders() });
    return res.json();
  },

  async setPresencia(estado: string): Promise<{ success: boolean; estado?: string }> {
    const res = await fetch(`${API_BASE_URL}/presencia`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado }),
    });
    return res.json();
  },

  // ─── USUARIOS ───
  async getUsers(): Promise<{ success: boolean; usuarios: Usuario[]; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getUserById(id: number): Promise<{ success: boolean; usuario: Usuario; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createUser(data: CreateUserData): Promise<{ success: boolean; message: string; usuario?: Usuario }> {
    const res = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateUser(id: number, data: Partial<CreateUserData>): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async toggleStatus(id: number): Promise<{ success: boolean; message: string; estado?: string }> {
    const res = await fetch(`${API_BASE_URL}/usuarios/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async resetPassword(
    id: number,
    nuevaPassword?: string
  ): Promise<{ success: boolean; message: string; passwordTemporal?: string; emailEnviado?: boolean }> {
    const res = await fetch(`${API_BASE_URL}/usuarios/${id}/reset-password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nuevaPassword }),
    });
    return res.json();
  },

  async unlockUser(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/usuarios/${id}/desbloquear`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ─── ROLES ───
  async getRoles(): Promise<{ success: boolean; roles: Rol[]; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/roles`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createRole(data: CreateRoleData): Promise<{ success: boolean; message: string; role?: Rol }> {
    const res = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateRole(id: number, data: Partial<CreateRoleData>): Promise<{ success: boolean; message: string; role?: Rol }> {
    const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteRole(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ─── SUCURSALES ───
  async getBranches(): Promise<{ success: boolean; sucursales: any[]; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/sucursales`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};
