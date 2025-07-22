// src/services/authService.ts

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password1: string;
  password2: string;
  nombre_fiscal: string;
  nif: string;
  direccion: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  tipo_irpf_default?: number;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  email: string;
  perfil?: {
    nombre_fiscal: string;
    nif: string;
    ciudad: string;
  };
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Cargar tokens del localStorage al iniciar
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    
    // Configurar axios con el token si existe
    if (this.accessToken) {
      this.setAuthHeader(this.accessToken);
    }
  }

  private saveTokens(tokens: AuthTokens) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    this.setAuthHeader(tokens.access);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async login(data: LoginData): Promise<User> {
    try {
      // Login y obtener tokens
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, data);
      
      // Nuestra vista personalizada devuelve los tokens directamente
      if (response.data.access && response.data.refresh) {
        this.saveTokens({
          access: response.data.access,
          refresh: response.data.refresh
        });
      }

      // Si la respuesta incluye el usuario, lo devolvemos
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }

      // Si no, obtener datos del usuario
      const user = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      // Registrar usuario
      const response = await axios.post(`${API_BASE_URL}/auth/registration/`, data);
      
      // Nuestra vista personalizada devuelve los tokens directamente
      if (response.data.access && response.data.refresh) {
        this.saveTokens({
          access: response.data.access,
          refresh: response.data.refresh
        });
      }

      // Si la respuesta incluye el usuario, lo devolvemos
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      
      // Si no, obtenemos los datos del usuario
      const user = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Logout en el servidor (opcional)
      await axios.post(`${API_BASE_URL}/auth/logout/`);
    } catch (error) {
      // Ignorar errores de logout
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/user/me/`);
    return response.data;
  }

  async checkNIF(nif: string): Promise<boolean> {
    const response = await axios.post(`${API_BASE_URL}/check-nif/`, { nif });
    return response.data.exists;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: this.refreshToken
      });
      
      const newAccessToken = response.data.access;
      this.accessToken = newAccessToken;
      localStorage.setItem('access_token', newAccessToken);
      this.setAuthHeader(newAccessToken);
      
      return newAccessToken;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Crear instancia única del servicio
export const authService = new AuthService();

// Interceptor para manejar tokens expirados
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await authService.refreshAccessToken();
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);