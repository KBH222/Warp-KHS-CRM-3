import { create } from 'zustand';
import { User, Role, LoginRequest } from '@khs-crm/types';
import { offlineAuthService } from '../services/offline-auth.service';
import { offlineDataService } from '../services/offline-data.service';

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
  isBiometricEnabled: boolean;
  
  // Actions
  login: (credentials: LoginRequest, enableBiometric?: boolean) => Promise<void>;
  biometricLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  checkBiometricStatus: () => void;
}

// Enhanced store with offline capabilities
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isBiometricEnabled: false,

  login: async (credentials: LoginRequest, enableBiometric = false) => {
    set({ isLoading: true });
    
    try {
      // Try offline-first authentication
      let user: User;
      
      try {
        // Use offline auth service for login
        user = await offlineAuthService.login(credentials, enableBiometric);
        console.log('[AUTH] Offline login successful:', user.email);
      } catch (error) {
        console.warn('[AUTH] Offline login failed, trying mock fallback:', error);
        
        // Fallback to mock users for development
        const mockUser = MOCK_USERS[credentials.email];
        
        if (!mockUser || mockUser.password !== credentials.password) {
          throw new Error('Invalid credentials');
        }
        
        const { password, ...userWithoutPassword } = mockUser;
        user = userWithoutPassword;
        
        // Store in offline auth for future use
        try {
          await offlineAuthService.login(credentials, enableBiometric);
        } catch (offlineError) {
          console.warn('[AUTH] Failed to store credentials offline:', offlineError);
        }
      }
      
      set({ 
        user, 
        isAuthenticated: true, 
        isBiometricEnabled: offlineAuthService.isBiometricEnabled() 
      });
      
      // Preload critical data after successful login
      offlineDataService.preloadCriticalData().catch(error => {
        console.warn('[AUTH] Failed to preload critical data:', error);
      });
      
    } finally {
      set({ isLoading: false });
    }
  },

  biometricLogin: async () => {
    set({ isLoading: true });
    
    try {
      const user = await offlineAuthService.biometricLogin();
      set({ 
        user, 
        isAuthenticated: true, 
        isBiometricEnabled: true 
      });
      
      // Preload critical data
      offlineDataService.preloadCriticalData().catch(error => {
        console.warn('[AUTH] Failed to preload critical data:', error);
      });
      
      console.log('[AUTH] Biometric login successful:', user.email);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    console.log('[AUTH] Logging out');
    
    try {
      await offlineAuthService.logout();
    } catch (error) {
      console.error('[AUTH] Offline logout failed:', error);
    }
    
    // Clear caches
    try {
      await offlineDataService.clearAllCaches();
    } catch (error) {
      console.warn('[AUTH] Failed to clear caches:', error);
    }
    
    set({ 
      user: null, 
      isAuthenticated: false, 
      isBiometricEnabled: false 
    });
  },

  refreshUser: async () => {
    console.log('[AUTH] Refreshing user data');
    
    try {
      const user = await offlineAuthService.refreshUser();
      if (user) {
        set({ user });
      }
    } catch (error) {
      console.error('[AUTH] Failed to refresh user:', error);
    }
  },

  setUser: (user: User | null) => {
    console.log('[AUTH] setUser called with:', user ? user.email : 'null');
    set({ user, isAuthenticated: !!user });
  },

  enableBiometric: async (): Promise<boolean> => {
    try {
      const enabled = await offlineAuthService.enableBiometric();
      if (enabled) {
        set({ isBiometricEnabled: true });
      }
      return enabled;
    } catch (error) {
      console.error('[AUTH] Failed to enable biometric:', error);
      return false;
    }
  },

  disableBiometric: async () => {
    try {
      await offlineAuthService.disableBiometric();
      set({ isBiometricEnabled: false });
    } catch (error) {
      console.error('[AUTH] Failed to disable biometric:', error);
    }
  },

  checkBiometricStatus: () => {
    const enabled = offlineAuthService.isBiometricEnabled();
    set({ isBiometricEnabled: enabled });
  },
}));

// Initialize offline auth on store creation
(async () => {
  try {
    await offlineAuthService.initialize();
    const currentUser = offlineAuthService.getCurrentUser();
    if (currentUser) {
      useAuthStore.setState({ 
        user: currentUser, 
        isAuthenticated: true,
        isBiometricEnabled: offlineAuthService.isBiometricEnabled()
      });
    }
  } catch (error) {
    console.error('[AUTH] Failed to initialize offline auth:', error);
  }
})();

// Helper hooks
export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    biometricLogin, 
    enableBiometric, 
    disableBiometric, 
    isBiometricEnabled 
  } = useAuthStore();
  return { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    biometricLogin, 
    enableBiometric, 
    disableBiometric, 
    isBiometricEnabled 
  };
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

export const useBiometric = () => {
  const { isBiometricEnabled, enableBiometric, disableBiometric, biometricLogin } = useAuthStore();
  return { isBiometricEnabled, enableBiometric, disableBiometric, biometricLogin };
};