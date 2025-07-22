// src/services/api.ts

import axios from 'axios';
import { Ingreso, Gasto, ResumenTrimestral } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          // Actualizar el header para la petición original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si el refresh falla, redirigir al login
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Servicios para Ingresos
export const ingresosService = {
  // Obtener todos los ingresos
  getAll: async (trimestre?: number, año?: number) => {
    const params = new URLSearchParams();
    if (trimestre) params.append('trimestre', trimestre.toString());
    if (año) params.append('año', año.toString());
    
    const response = await api.get<any>(`/ingresos/?${params}`);
    // Si la respuesta tiene results (paginada), devolver results, sino devolver data directamente
    return response.data.results || response.data;
  },

  // Obtener un ingreso por ID
  getById: async (id: number) => {
    const response = await api.get<Ingreso>(`/ingresos/${id}/`);
    return response.data;
  },

  // Crear un nuevo ingreso
  create: async (ingreso: Omit<Ingreso, 'id'>) => {
    const response = await api.post<Ingreso>('/ingresos/', ingreso);
    return response.data;
  },

  // Actualizar un ingreso
  update: async (id: number, ingreso: Partial<Ingreso>) => {
    const response = await api.patch<Ingreso>(`/ingresos/${id}/`, ingreso);
    return response.data;
  },

  // Eliminar un ingreso
  delete: async (id: number) => {
    await api.delete(`/ingresos/${id}/`);
  },
};

// Servicios para Gastos
export const gastosService = {
  // Obtener todos los gastos
  getAll: async (trimestre?: number, año?: number) => {
    const params = new URLSearchParams();
    if (trimestre) params.append('trimestre', trimestre.toString());
    if (año) params.append('año', año.toString());
    
    const response = await api.get<any>(`/gastos/?${params}`);
    // Si la respuesta tiene results (paginada), devolver results, sino devolver data directamente
    return response.data.results || response.data;
  },

  // Obtener un gasto por ID
  getById: async (id: number) => {
    const response = await api.get<Gasto>(`/gastos/${id}/`);
    return response.data;
  },

  // Crear un nuevo gasto
  create: async (gasto: FormData | Omit<Gasto, 'id'>) => {
    const isFormData = gasto instanceof FormData;
    const response = await api.post<Gasto>('/gastos/', gasto, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Actualizar un gasto
  update: async (id: number, gasto: FormData | Partial<Gasto>) => {
    const isFormData = gasto instanceof FormData;
    const response = await api.patch<Gasto>(`/gastos/${id}/`, gasto, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Eliminar un gasto
  delete: async (id: number) => {
    await api.delete(`/gastos/${id}/`);
  },
};

// Servicios para Resumen Trimestral
export const resumenService = {
  // Calcular resumen de un trimestre
  calcular: async (trimestre: number, año: number) => {
    const response = await api.get<ResumenTrimestral>(
      `/resumen/calcular/?trimestre=${trimestre}&año=${año}`
    );
    return response.data;
  },

  // Obtener todos los resúmenes guardados
  getAll: async (año?: number) => {
    const params = año ? `?año=${año}` : '';
    const response = await api.get<ResumenTrimestral[]>(`/resumen/${params}`);
    return response.data;
  },
};