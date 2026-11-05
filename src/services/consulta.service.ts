const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface RucData {
  ruc: string;
  razonSocial: string;
  estado: string;
  condicion: string;
  direccion: string;
  direccionFiscal?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  ubigeo?: string;
}

export interface DniData {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  direccion?: string;
}

export interface ConsultaResponse<T> {
  success: boolean;
  message?: string;
  source?: 'SUNAT_LIVE' | 'RENIEC_LIVE' | 'CACHE_DEMO';
  data?: T;
}

export const consultaService = {
  async consultarRuc(ruc: string): Promise<ConsultaResponse<RucData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/consultas/ruc/${encodeURIComponent(ruc.trim())}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error al consultar RUC:', err);
      return { success: false, message: 'No se pudo conectar con el servidor para la consulta de RUC.' };
    }
  },

  async consultarDni(dni: string): Promise<ConsultaResponse<DniData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/consultas/dni/${encodeURIComponent(dni.trim())}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error al consultar DNI:', err);
      return { success: false, message: 'No se pudo conectar con el servidor para la consulta de DNI.' };
    }
  },
};
