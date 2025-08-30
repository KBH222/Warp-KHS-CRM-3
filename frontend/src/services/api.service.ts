import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@stores/auth.store';

// Constants defined inline
// Use relative path for Vercel deployment (same domain)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const STORAGE_KEYS = {
  AUTH_TOKEN: 'khs-crm-token',
  REFRESH_TOKEN: 'khs-crm-refresh-token'
};
const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Types defined inline
interface ApiError {
  code: string;
  message: string;
  details?: any;
}
interface AuthTokens {
  token: string;
  refreshToken: string;
}

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    console.log('[ApiClient] Initializing with base URL:', API_BASE_URL);
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log('[ApiClient] Request:', config.method?.toUpperCase(), config.url);
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('[ApiClient] Request error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('[ApiClient] Response:', response.status, response.config.url);
        console.log('[ApiClient] Response data:', response.data);
        return response.data;
      },
      async (error: AxiosError<{ error: ApiError }>) => {
        console.error('[ApiClient] Response error:', error.response?.status, error.config?.url, error.message);
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Transform error to consistent format
        if (error.response?.data?.error) {
          return Promise.reject(error.response.data.error);
        }

        // Network error or timeout
        if (!error.response) {
          return Promise.reject({
            code: ERROR_CODES.NETWORK_ERROR,
            message: 'Network error. Please check your connection.',
          });
        }

        // Generic error
        return Promise.reject({
          code: ERROR_CODES.INTERNAL_ERROR,
          message: error.message || 'An unexpected error occurred',
        });
      },
    );
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = new Promise((resolve, reject) => {
      (async () => {
        try {
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post<AuthTokens>(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken },
          );

          const { token, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          
          resolve(token);
        } catch (error) {
          reject(error);
        } finally {
          this.refreshPromise = null;
        }
      })();
    });

    return this.refreshPromise;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T, T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<T, T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<T, T>(url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch<T, T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T, T>(url, config);
  }
}

export const apiClient = new ApiClient();