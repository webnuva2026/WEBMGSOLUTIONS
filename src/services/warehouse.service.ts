const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CaracteristicaDetalle {
  atributo: string;
  valor: string;
}

export interface ItemInventarioAlmacen {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: {
    id: number;
    nombre: string;
    requiereSerie: boolean;
  };
  marca: {
    id: number;
    nombre: string;
  };
  modelo: {
    id: number;
    nombre: string;
    descripcion: string;
    caracteristicas: CaracteristicaDetalle[];
  } | null;
  precioVenta: number;
  precioCosto: number;
  stockMinimo: number;
  requiereSerie: boolean;
  disponibleVenta: boolean;
  tipoDestino: 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO';
  estado: string;
  estadoId: number;
  stockTotal: number;
  stockSede?: number;
  stockPorSede: {
    sucursalId: number;
    sucursalNombre: string;
    stock: number;
  }[];
  seriesMetricas: {
    total: number;
    disponibles: number;
    cuarentenaDanadas: number;
    taller: number;
    vendidas: number;
  };
}

export interface UnidadFisicaSerie {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  sucursalId: number;
  sucursalNombre: string;
  numeroSerie: string;
  estadoUnidadId: number;
  estadoCodigo: string;
  estadoNombre: string;
  tipoDestino: 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO';
  disponibleVenta: boolean;
  condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX' | 'DANADO_RECEPCION' | 'DEFECTUOSO';
  observaciones: string;
  costoAdquisicion: number | null;
  fechaIngreso: string;
}

export interface ResumenAlmacenData {
  totalProductos: number;
  totalUnidadesStock: number | string;
  seriesDisponiblesVenta: number;
  seriesCuarentenaDanadas: number;
  seriesUsoTaller: number;
  productosVisiblesPOS: number;
  productosOcultosPOS: number;
}

export interface RegistrarSeriesPayload {
  sucursalId: number;
  series: string[];
  tipoDestino?: 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO';
  disponibleVenta?: boolean;
  condicion?: 'NUEVO' | 'USADO' | 'OPEN_BOX' | 'DANADO_RECEPCION' | 'DEFECTUOSO';
  observaciones?: string;
  costoAdquisicion?: number | null;
}

export interface UpdateEstadoUnidadPayload {
  estadoUnidadId?: number;
  disponibleVenta?: boolean;
  condicion?: 'NUEVO' | 'USADO' | 'OPEN_BOX' | 'DANADO_RECEPCION' | 'DEFECTUOSO';
  observaciones?: string;
  tipoDestino?: 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO';
}

export interface CreateProductoPayload {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  categoriaId: number;
  marcaId: number;
  modeloId?: number | null;
  precioVenta?: number;
  precioCosto?: number;
  stockMinimo?: number;
  requiereSerie?: boolean;
  disponibleVenta?: boolean;
  tipoDestino?: 'VENTA' | 'SERVICIO_TALLER' | 'MIXTO';
  stockInicial?: number;
  sucursalId?: number;
  seriesIniciales?: string[];
}

export const warehouseService = {
  async getResumen(sucursal_id?: number | null): Promise<{ success: boolean; data?: ResumenAlmacenData; message?: string }> {
    try {
      const url = sucursal_id ? `${API_BASE_URL}/almacen/resumen?sucursal_id=${sucursal_id}` : `${API_BASE_URL}/almacen/resumen`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener resumen de almacén:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async getInventario(params?: {
    categoria_id?: number;
    marca_id?: number;
    tipo_destino?: string;
    search?: string;
    sucursal_id?: number | null;
  }): Promise<{ success: boolean; total?: number; inventario?: ItemInventarioAlmacen[]; message?: string }> {
    try {
      const query = new URLSearchParams();
      if (params?.categoria_id) query.append('categoria_id', String(params.categoria_id));
      if (params?.marca_id) query.append('marca_id', String(params.marca_id));
      if (params?.tipo_destino) query.append('tipo_destino', params.tipo_destino);
      if (params?.search) query.append('search', params.search);
      if (params?.sucursal_id) query.append('sucursal_id', String(params.sucursal_id));

      const response = await fetch(`${API_BASE_URL}/almacen/inventario?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener inventario:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async getUnidades(productoId: number, sucursal_id?: number | null): Promise<{ success: boolean; total?: number; unidades?: UnidadFisicaSerie[]; message?: string }> {
    try {
      const url = sucursal_id
        ? `${API_BASE_URL}/almacen/productos/${productoId}/unidades?sucursal_id=${sucursal_id}`
        : `${API_BASE_URL}/almacen/productos/${productoId}/unidades`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al obtener unidades:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async registrarUnidades(
    productoId: number,
    payload: RegistrarSeriesPayload
  ): Promise<{ success: boolean; message?: string; unidadesRegistradas?: number; estadoAsignado?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/almacen/productos/${productoId}/unidades`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al registrar unidades con serie:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async updateEstadoUnidad(
    unidadId: number,
    payload: UpdateEstadoUnidadPayload
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/almacen/unidades/${unidadId}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al actualizar estado de unidad:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async toggleVisibilidadVenta(
    productoId: number,
    disponibleVenta?: boolean
  ): Promise<{ success: boolean; message?: string; disponibleVenta?: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/almacen/productos/${productoId}/visibilidad-venta`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ disponibleVenta }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al alternar visibilidad de venta:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  async createProducto(payload: CreateProductoPayload): Promise<{ success: boolean; message?: string; productoId?: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/almacen/productos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al crear producto en almacén:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },
};
