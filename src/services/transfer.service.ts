import { MovimientoInventario, EstadoMovimientoInventario } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CreateMovimientoPayload {
  tipo: 'TRASLADO' | 'PRESTAMO';
  productoId: number;
  sedeOrigenId: number;
  sedeDestinoId: number;
  cantidad: number;
  series?: string[];
  solicitadoPor: string;
  motivo?: string;
  observaciones?: string;
}

export interface SerieDisponible {
  id: number;
  numeroSerie: string;
  condicion: string;
  observaciones?: string;
}

export interface TransferResponse {
  success: boolean;
  message?: string;
  movimientoId?: number;
  codigo?: string;
  movimientos?: MovimientoInventario[];
  series?: SerieDisponible[];
}

export const transferService = {
  async getMovimientos(params?: { tipo?: string; estado?: string; sedeId?: number }): Promise<TransferResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.tipo) query.append('tipo', params.tipo);
      if (params?.estado) query.append('estado', params.estado);
      if (params?.sedeId) query.append('sedeId', String(params.sedeId));

      const res = await fetch(`${API_BASE_URL}/almacen/movimientos?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al obtener movimientos de inventario:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async getSeriesDisponibles(productoId: number, sucursalId: number): Promise<TransferResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/almacen/series-disponibles?productoId=${productoId}&sucursalId=${sucursalId}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al obtener series disponibles en sede:', error);
      return { success: false, message: 'Error al consultar series disponibles.' };
    }
  },

  async createMovimiento(payload: CreateMovimientoPayload): Promise<TransferResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/almacen/movimientos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al registrar movimiento entre sedes:', error);
      return { success: false, message: 'Error al enviar la solicitud.' };
    }
  },

  async updateEstado(movimientoId: number, estadoCodigo: EstadoMovimientoInventario, usuarioNombre: string): Promise<TransferResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/almacen/movimientos/${movimientoId}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estadoCodigo, usuarioNombre }),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al actualizar estado del movimiento:', error);
      return { success: false, message: 'Error al actualizar el estado.' };
    }
  },
};
