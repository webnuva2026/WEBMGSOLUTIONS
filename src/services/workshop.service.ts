import { OrdenServicio, EstadoOrdenServicio } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CreateOrdenPayload {
  clienteId: number;
  sucursalId?: number;
  tipoEquipo?: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  accesorios?: string | string[];
  fallaReportada: string;
  prioridad?: 'NORMAL' | 'ALTA' | 'URGENTE';
  tecnicoId?: number;
  esGarantia?: boolean;
  costoServicio?: number;
  observaciones?: string;
}

export interface WorkshopResponse {
  success: boolean;
  message?: string;
  ordenId?: number;
  codigo?: string;
  ordenes?: OrdenServicio[];
}

export const workshopService = {
  async getOrdenes(params?: { estado?: string; search?: string; sucursal_id?: number | null }): Promise<WorkshopResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.estado) query.append('estado', params.estado);
      if (params?.search) query.append('search', params.search);
      if (params?.sucursal_id) query.append('sucursal_id', String(params.sucursal_id));

      const res = await fetch(`${API_BASE_URL}/taller/ordenes?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al obtener órdenes de taller:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async createOrden(payload: CreateOrdenPayload): Promise<WorkshopResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/taller/ordenes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al registrar orden en taller:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async updateEstado(
    ordenId: number,
    payload: {
      nuevoEstado: EstadoOrdenServicio;
      diagnostico?: string;
      solucion?: string;
      costoServicio?: number;
      observaciones?: string;
    }
  ): Promise<WorkshopResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/taller/ordenes/${ordenId}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al actualizar estado de orden:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async savePresupuesto(
    ordenId: number,
    payload: {
      repuestos: any[];
      serviciosManoObra: any[];
      costoTotal?: number;
    }
  ): Promise<WorkshopResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/taller/ordenes/${ordenId}/presupuesto`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al guardar presupuesto en base de datos:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async sendTicketEmail(payload: {
    toEmail: string;
    clienteNombre: string;
    clienteDocumento?: string;
    clienteTelefono?: string;
    codigoOrden: string;
    fechaIngreso?: string;
    tipoEquipo?: string;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    accesorios?: string | string[];
    fallaReportada?: string;
    presupuestoTotal?: number;
    adelantoPagado?: number;
    saldoPendiente?: number;
    garantiaDias?: number;
    tecnicoNombre?: string;
  }): Promise<WorkshopResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/taller/ordenes/enviar-ticket-email`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al enviar ticket por correo:', error);
      return { success: false, message: 'Error de conexión al enviar el ticket por correo.' };
    }
  },

  async getTrackingByCodigo(codigo: string): Promise<{ success: boolean; message?: string; orden?: OrdenServicio }> {
    try {
      const res = await fetch(`${API_BASE_URL}/taller/tracking/${encodeURIComponent(codigo.trim())}`);
      return await res.json();
    } catch (error: any) {
      console.error('Error al consultar tracking público:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async responderPresupuesto(payload: {
    codigo: string;
    accion: 'APROBAR' | 'RECHAZAR';
    observacion?: string;
  }): Promise<WorkshopResponse & { nuevoEstado?: EstadoOrdenServicio }> {
    try {
      const res = await fetch(`${API_BASE_URL}/taller/ordenes/responder-presupuesto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al responder presupuesto:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },
};


