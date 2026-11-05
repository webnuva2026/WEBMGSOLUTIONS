const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface VentaItemPayload {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  series?: string[];
}

export interface CreateVentaPayload {
  clienteId: number;
  tipoComprobanteId: number; // 1: BOLETA, 2: FACTURA, 3: NOTA_VENTA
  metodoPagoId: number;      // 1: EFECTIVO, 2: YAPE, 3: PLIN, 4: TARJETA, 5: TRANSFERENCIA
  sucursalId?: number;
  items: VentaItemPayload[];
  observaciones?: string;
}

export interface VentaResponse {
  success: boolean;
  message?: string;
  ventaId?: number;
  codigoComprobante?: string;
  venta?: {
    id: number;
    codigoComprobante: string;
    total: number;
    subtotal?: number;
    igv?: number;
    fechaVenta: string;
    tipoComprobante?: string;
    tipoComprobanteNombre?: string;
    cliente?: {
      id: number;
      nombre: string;
      documento: string;
      telefono?: string;
      direccion?: string;
      email?: string;
    };
    metodoPago?: string;
    estado?: string;
    sucursal?: string;
    vendedor?: string;
    observaciones?: string;
    items?: Array<{
      id: number;
      productoId: number;
      codigo: string;
      nombre: string;
      marca?: string;
      modelo?: string;
      cantidad: number;
      precioUnitario: number;
      descuento: number;
      subtotal: number;
      series: Array<{
        numeroSerie: string;
        mesesGarantia: number;
        estadoGarantia: string;
      }>;
    }>;
  };
  ventas?: Array<any>;
  total?: number;
}

export const saleService = {
  async getVentas(params?: { search?: string; page?: number; limit?: number }): Promise<VentaResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const res = await fetch(`${API_BASE_URL}/ventas?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al obtener ventas:', error);
      return { success: false, message: 'Error de conexión al obtener ventas.' };
    }
  },

  async getVentaById(id: number): Promise<VentaResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/ventas/${id}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error: any) {
      console.error(`Error al obtener venta #${id}:`, error);
      return { success: false, message: 'Error de conexión al consultar detalle de venta.' };
    }
  },

  async createVenta(payload: CreateVentaPayload): Promise<VentaResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/ventas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al registrar venta:', error);
      return { success: false, message: 'Error de conexión al procesar la venta en el servidor.' };
    }
  },

  async enviarComprobanteEmail(
    ventaId: number,
    toEmail: string,
    saleData?: any
  ): Promise<{ success: boolean; message: string; simulated?: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/ventas/${ventaId}/enviar-email`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toEmail, saleData }),
      });
      return await res.json();
    } catch (error: any) {
      console.error('Error al solicitar envío de comprobante por correo:', error);
      return { success: false, message: 'No se pudo conectar con el servidor de correo.' };
    }
  },
};

