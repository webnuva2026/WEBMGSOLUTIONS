import { Categoria } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CreateCategoriaData {
  nombre: string;
  descripcion?: string;
  esEquipoTaller?: boolean;
  esVenta?: boolean;
  esRepuestoTaller?: boolean;
}

export const categoryService = {
  async getCategorias(ambito?: 'taller' | 'venta' | 'repuesto'): Promise<{ success: boolean; categorias?: Categoria[]; message?: string }> {
    try {
      const url = ambito ? `${API_BASE_URL}/categorias?ambito=${ambito}` : `${API_BASE_URL}/categorias`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener categorías:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async createCategoria(data: CreateCategoriaData): Promise<{ success: boolean; categoria?: Categoria; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      return { success: false, message: 'Error de conexión al crear categoría.' };
    }
  },

  async updateCategoria(id: number, data: CreateCategoriaData): Promise<{ success: boolean; categoria?: Categoria; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al actualizar categoría:', error);
      return { success: false, message: 'Error de conexión al actualizar categoría.' };
    }
  },

  async toggleCategoriaEstado(id: number): Promise<{ success: boolean; nuevoEstado?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/${id}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al alternar estado de categoría:', error);
      return { success: false, message: 'Error de conexión al cambiar estado de categoría.' };
    }
  },
};
