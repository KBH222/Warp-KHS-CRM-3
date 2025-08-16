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

// Mock users for development
const MOCK_USERS: Record<string, User & { password: string }> = {
  'owner@khs.com': {
    id: '1',
    email: 'owner@khs.com',
    password: 'password123',
    name: 'John Owner',
    role: Role.OWNER,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  'worker@khs.com': {
    id: '2',
    email: 'worker@khs.com',
    password: 'password123',
    name: 'Jane Worker',
    role: Role.WORKER,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

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
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const mockUser = MOCK_USERS[credentials.email];
          
          if (!mockUser || mockUser.password !== credentials.password) {
            throw new Error('Invalid credentials');
          }
          
          // Remove password from user object
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password, ...user } = mockUser;
          
          // Store mock tokens
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'mock-access-token');
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'mock-refresh-token');
          
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
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

        // If we have a token, check if we have user data
        const savedState = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (savedState) {
          try {
            const { state } = JSON.parse(savedState);
            if (state.user) {
              set({ user: state.user, isAuthenticated: true });
            }
          } catch (error) {
            console.error('Failed to parse saved user data');
          }
        }
      },

      setUser: (user: User | null) => {
        console.log('[AUTH] setUser called with:', user ? user.email : 'null');
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        console.log('[AUTH] Rehydrated state:', state);
      },
    },
  ),
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