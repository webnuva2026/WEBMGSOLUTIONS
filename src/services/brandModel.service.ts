import { Marca, Modelo, CaracteristicaModelo } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CreateMarcaData {
  nombre: string;
  descripcion?: string;
  categoriaId?: number | null;
}

export interface CreateModeloData {
  marcaId: number;
  nombre: string;
  descripcion?: string;
  caracteristicas?: { atributo: string; valor: string }[];
}

export const brandModelService = {
  // ─── MARCAS (NIVEL 1) ───
  async getMarcas(): Promise<{ success: boolean; marcas?: Marca[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/marcas`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener marcas:', error);
      return { success: false, message: 'Error de conexión al obtener marcas.' };
    }
  },

  async createMarca(data: CreateMarcaData): Promise<{ success: boolean; marca?: Marca; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/marcas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al crear marca:', error);
      return { success: false, message: 'Error de conexión al crear marca.' };
    }
  },

  async updateMarca(id: number, data: CreateMarcaData): Promise<{ success: boolean; marca?: Marca; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/marcas/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al actualizar marca:', error);
      return { success: false, message: 'Error de conexión al actualizar marca.' };
    }
  },

  async toggleMarcaEstado(id: number): Promise<{ success: boolean; nuevoEstado?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/marcas/${id}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al cambiar estado de marca:', error);
      return { success: false, message: 'Error de conexión al cambiar estado de la marca.' };
    }
  },

  // ─── MODELOS Y CARACTERÍSTICAS (NIVELES 2 Y 3) ───
  async getModelos(marcaId?: number, search?: string): Promise<{ success: boolean; modelos?: Modelo[]; message?: string }> {
    try {
      const params = new URLSearchParams();
      if (marcaId) params.append('marca_id', String(marcaId));
      if (search) params.append('search', search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${API_BASE_URL}/modelos${qs}`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener modelos:', error);
      return { success: false, message: 'Error de conexión al obtener modelos.' };
    }
  },

  async createModelo(data: CreateModeloData): Promise<{ success: boolean; modelo?: Modelo; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/modelos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al crear modelo:', error);
      return { success: false, message: 'Error de conexión al crear modelo.' };
    }
  },

  async updateModelo(id: number, data: CreateModeloData): Promise<{ success: boolean; modelo?: Modelo; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/modelos/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al actualizar modelo:', error);
      return { success: false, message: 'Error de conexión al actualizar modelo.' };
    }
  },

  async toggleModeloEstado(id: number): Promise<{ success: boolean; nuevoEstado?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/modelos/${id}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al alternar estado de modelo:', error);
      return { success: false, message: 'Error de conexión al cambiar estado del modelo.' };
    }
  },
};
