import { Usuario } from '../types';

const API_BASE_URL = '/api';

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: Usuario & {
    rolNombre?: string;
    telefonoEnmascarado?: string | null;
    documentoEnmascarado?: string | null;
    tipoDocumento?: string;
    numeroDocumento?: string | null;
    requiereCambioPassword?: boolean;
    sucursalId?: number | null;
    sucursalNombre?: string | null;
  };
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem('mg_auth_token');
  },

  setToken(token: string): void {
    localStorage.setItem('mg_auth_token', token);
  },

  removeToken(): void {
    localStorage.removeItem('mg_auth_token');
  },

  getStoredUser(): Usuario | null {
    const userJson = localStorage.getItem('mg_current_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  setStoredUser(user: Usuario): void {
    localStorage.setItem('mg_current_user', JSON.stringify(user));
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        this.setToken(data.token);
        this.setStoredUser(data.user);
      }

      return data;
    } catch (error: any) {
      console.error('Error en authService.login:', error);
      return {
        success: false,
        message: 'No se pudo conectar con el servidor backend (MySQL/Express). Verifique su conexión.',
      };
    }
  },

  async getProfile(): Promise<LoginResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: 'No hay token disponible.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success && data.user) {
        this.setStoredUser(data.user);
      } else if (response.status === 401 || response.status === 403) {
        this.removeToken();
        localStorage.removeItem('mg_current_user');
      }

      return data;
    } catch (error: any) {
      console.error('Error en authService.getProfile:', error);
      return {
        success: false,
        message: 'Error verificando la sesión activa.',
      };
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn('Error enviando logout al servidor:', err);
      }
    }
    this.removeToken();
    localStorage.removeItem('mg_current_user');
  },

  async changePassword(passwordActual: string, nuevaPassword: string): Promise<{ success: boolean; message: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: 'No autenticado.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/cambiar-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ passwordActual, nuevaPassword }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error en changePassword:', error);
      return { success: false, message: 'Error de conexión al cambiar contraseña.' };
    }
  },

  async solicitarRecuperacion(identificador: string): Promise<{ success: boolean; message: string; emailEnmascarado?: string; simulated?: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/recuperar-password/solicitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identificador }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error en solicitarRecuperacion:', error);
      return { success: false, message: 'Error conectando con el servidor para solicitar código.' };
    }
  },

  async verificarCodigo(identificador: string, codigo: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/recuperar-password/verificar-codigo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identificador, codigo }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error en verificarCodigo:', error);
      return { success: false, message: 'Error conectando con el servidor para verificar código.' };
    }
  },

  async restablecerPassword(identificador: string, codigo: string, nuevaPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/recuperar-password/restablecer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identificador, codigo, nuevaPassword }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error en restablecerPassword:', error);
      return { success: false, message: 'Error conectando con el servidor para restablecer contraseña.' };
    }
  },
};

