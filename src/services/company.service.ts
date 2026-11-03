import { EmpresaConfig, Sucursal, EstadoRegistro } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const companyService = {
  /**
   * Obtiene los datos de la empresa desde el backend
   */
  async getEmpresa(): Promise<{ success: boolean; empresa?: EmpresaConfig; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/empresa`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener datos de empresa:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  /**
   * Actualiza los datos de la empresa
   */
  async updateEmpresa(empresa: EmpresaConfig): Promise<{ success: boolean; empresa?: EmpresaConfig; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/empresa`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(empresa),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al actualizar datos de empresa:', error);
      return { success: false, message: 'Error de conexión al guardar cambios de la empresa.' };
    }
  },

  /**
   * Obtiene todas las sucursales
   */
  async getSucursales(): Promise<{ success: boolean; sucursales?: Sucursal[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/sucursales`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener sucursales:', error);
      return { success: false, message: 'Error de conexión al obtener sucursales.' };
    }
  },

  /**
   * Registra una nueva sucursal
   */
  async createSucursal(sucursal: {
    codigo?: string;
    nombre: string;
    direccion: string;
    telefono?: string;
    esPrincipal?: boolean;
  }): Promise<{ success: boolean; sucursal?: Sucursal; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/sucursales`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sucursal),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al crear sucursal:', error);
      return { success: false, message: 'Error de conexión al crear sucursal.' };
    }
  },

  /**
   * Actualiza una sucursal existente
   */
  async updateSucursal(
    id: number,
    sucursal: {
      codigo?: string;
      nombre: string;
      direccion: string;
      telefono?: string;
      esPrincipal?: boolean;
    }
  ): Promise<{ success: boolean; sucursal?: Sucursal; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/sucursales/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(sucursal),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al actualizar sucursal:', error);
      return { success: false, message: 'Error de conexión al actualizar sucursal.' };
    }
  },

  /**
   * Alterna el estado ACTIVO / INACTIVO de una sucursal
   */
  async toggleSucursalEstado(id: number): Promise<{ success: boolean; message: string; nuevoEstado?: EstadoRegistro }> {
    try {
      const response = await fetch(`${API_BASE_URL}/sucursales/${id}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al alternar estado de sucursal:', error);
      return { success: false, message: 'Error de conexión al alternar estado de la sucursal.' };
    }
  },
};
