import { Compra, Proveedor } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const purchaseService = {
  // ─── PROVEEDORES ───
  async getProveedores(): Promise<{ success: boolean; proveedores?: Proveedor[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/proveedores`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al obtener proveedores:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async createProveedor(data: {
    ruc: string;
    razonSocial: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
  }): Promise<{ success: boolean; proveedor?: Proveedor; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/proveedores`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al registrar proveedor:', error);
      return { success: false, message: 'Error al guardar proveedor.' };
    }
  },

  async updateProveedor(
    id: number,
    data: {
      ruc: string;
      razonSocial: string;
      contacto?: string;
      telefono?: string;
      email?: string;
      direccion?: string;
    }
  ): Promise<{ success: boolean; proveedor?: Proveedor; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al actualizar proveedor:', error);
      return { success: false, message: 'Error al actualizar proveedor.' };
    }
  },

  async toggleProveedorEstado(id: number): Promise<{ success: boolean; nuevoEstado?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/proveedores/${id}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al cambiar estado del proveedor:', error);
      return { success: false, message: 'Error al cambiar estado del proveedor.' };
    }
  },

  // ─── COMPRAS & REABASTECIMIENTO ───
  async getCompras(): Promise<{ success: boolean; compras?: Compra[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/compras`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al obtener compras:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async createCompra(payload: {
    codigoComprobante?: string;
    proveedorId: number;
    sucursalDestino: string | number;
    compradorId?: number;
    modoIngreso?: 'SOLICITADO' | 'RECEPCION_DIRECTA';
    items: Array<{
      productoId: number;
      cantidad: number;
      precioCostoUnitario: number;
      series?: string[];
    }>;
    total?: number;
    observaciones?: string;
  }): Promise<{
    success: boolean;
    compraId?: number;
    codigoComprobante?: string;
    estado?: 'SOLICITADO' | 'REGISTRADA';
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/compras`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al registrar compra:', error);
      return { success: false, message: 'Error al procesar la compra.' };
    }
  },

  async recepcionarCompra(
    id: number,
    payload: {
      codigoComprobante: string;
      observacionesRecepcion?: string;
      seriesPorProducto?: Record<number, string[]>;
    }
  ): Promise<{ success: boolean; codigoComprobante?: string; estado?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/compras/${id}/recepcionar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al recepcionar pedido en almacén:', error);
      return { success: false, message: 'Error al recepcionar el pedido en almacén.' };
    }
  },

  async enviarOrdenCompraEmail(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/compras/${id}/enviar-email`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al enviar orden de compra por correo:', error);
      return { success: false, message: 'Error al enviar correo al proveedor.' };
    }
  },

  async anularCompra(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/compras/${id}/anular`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al anular compra:', error);
      return { success: false, message: 'Error al anular la compra.' };
    }
  },
};
