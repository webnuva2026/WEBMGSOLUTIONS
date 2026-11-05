const API_BASE_URL = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('mg_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface ResultadoGarantia {
  success: boolean;
  encontrado: boolean;
  serie: string;
  estado?: 'VIGENTE' | 'VENCIDA' | 'ANULADA_DANO_FISICO' | 'NO_REGISTRADO';
  diasRestantes?: number;
  diasVencida?: number;
  fechaVenta?: string;
  fechaExpiracion?: string;
  mesesGarantia?: number;
  producto?: {
    id: number;
    nombre: string;
    codigo: string;
    marca: string;
    modelo?: string | null;
    caracteristicas?: { atributo: string; valor: string }[];
  };
  comprobante?: string;
  cliente?: {
    id: number;
    nombre: string;
    documento: string;
    telefono?: string;
  };
  observaciones?: string;
  message?: string;
}

export interface IngresoGarantiaData {
  numeroSerie: string;
  clienteNombre: string;
  clienteTelefono?: string;
  clienteDocumento?: string;
  marca: string;
  modelo: string;
  fallaReclamada: string;
  observacionesEsteticas?: string;
  checklistFisico: {
    pantallaRota: boolean;
    liquidos: boolean;
    golpes: boolean;
    sellosViolados: boolean;
  };
  usuarioRecibeId?: number;
}

export const warrantyService = {
  async verificarGarantia(serie: string): Promise<ResultadoGarantia> {
    try {
      const response = await fetch(`${API_BASE_URL}/garantias/verificar?serie=${encodeURIComponent(serie)}`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al verificar garantía:', error);
      return {
        success: false,
        encontrado: false,
        serie,
        estado: 'NO_REGISTRADO',
        message: 'Error de conexión con el servidor al verificar garantía.',
      };
    }
  },

  async registrarIngreso(data: IngresoGarantiaData): Promise<{ success: boolean; message: string; orden?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/garantias/ingreso`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error al registrar ingreso de garantía:', error);
      return { success: false, message: 'Error de conexión al registrar ingreso de garantía.' };
    }
  },
};
