const API_BASE_URL = '/api';

export interface Cliente {
  id: number;
  idPersona: number;
  tipoDocumento: 'RUC' | 'DNI' | 'CE';
  numeroDocumento: string;
  razonSocial: string;
  nombreEmpresa: string | null;
  direccionFiscal: string;
  email: string | null;
  telefono: string | null;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  fechaRegistro: string;
  totalEquipos: number;
  totalServicios: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats?: { total: number; activos: number; inactivos: number };
}

export interface ClienteFormData {
  tipoDocumento: 'RUC' | 'DNI' | 'CE';
  numeroDocumento: string;
  razonSocial: string;
  nombreEmpresa?: string;
  direccionFiscal: string;
  email?: string;
  telefono?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const buildQueryString = (params?: { search?: string; estado?: string; page?: number; limit?: number }): string => {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.estado) query.set('estado', params.estado);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const str = query.toString();
  return str ? `?${str}` : '';
};

export const clientService = {
  async getClients(params?: { search?: string; estado?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Cliente>> {
    const response = await fetch(`${API_BASE_URL}/clientes${buildQueryString(params)}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getClientById(id: number): Promise<{ success: boolean; data: Cliente }> {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async createClient(cliente: ClienteFormData): Promise<{ success: boolean; message: string; data: Cliente }> {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cliente),
    });
    return response.json();
  },

  async updateClient(id: number, cliente: Partial<ClienteFormData>): Promise<{ success: boolean; message: string; data: Cliente }> {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cliente),
    });
    return response.json();
  },

  async toggleStatus(id: number): Promise<{ success: boolean; message: string; data: { id: number; estado: string } }> {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async searchByDocument(documento: string): Promise<{ success: boolean; data: Cliente }> {
    const response = await fetch(`${API_BASE_URL}/clientes/buscar/${encodeURIComponent(documento)}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
