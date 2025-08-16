// Temporarily using simple auth without persistence to debug logout issue
export * from './auth.store.simple';

// Real implementation - uncomment when backend is working
/*
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Inline type definitions
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'worker';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

enum Role {
  OWNER = 'admin',
  MANAGER = 'manager',
  WORKER = 'worker'
}

// Inline constants
const STORAGE_KEYS = {
  AUTH_TOKEN: 'khs-crm-token',
  REFRESH_TOKEN: 'khs-crm-refresh-token',
  USER_DATA: 'khs-crm-user',
  OFFLINE_DATA: 'khs-crm-offline-data',
  SYNC_QUEUE: 'khs-crm-sync-queue',
  CACHE_MANIFEST: 'khs-crm-cache-manifest',
  ENCRYPTION_KEY: 'khs-crm-encryption-key',
  BIOMETRIC_ENABLED: 'khs-crm-biometric-enabled'
};

const API_ENDPOINTS = {
  CUSTOMERS: '/customers',
  JOBS: '/jobs',
  MATERIALS: '/materials',
  USERS: '/users',
  AUTH: '/auth',
  SYNC: '/sync'
};
import { apiClient } from '@services/api.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const { accessToken, refreshToken } = await apiClient.post<AuthTokens>(
            API_ENDPOINTS.LOGIN,
            credentials
          );

          // Store tokens
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

          // Get user data
          const user = await apiClient.get<User>(API_ENDPOINTS.ME);
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await apiClient.post(API_ENDPOINTS.LOGOUT);
        } catch (error) {
          // Continue with local logout even if server logout fails
          console.error('Server logout failed:', error);
        }

        // Clear local data
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        set({ user: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          const user = await apiClient.get<User>(API_ENDPOINTS.ME);
          set({ user, isAuthenticated: true });
        } catch (error) {
          // Token might be invalid
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Helper hooks
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  return { user, isAuthenticated, login, logout };
};

export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  return user;
};

export const useIsOwner = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === Role.OWNER;
};

export const useIsWorker = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === Role.WORKER;
};
*/