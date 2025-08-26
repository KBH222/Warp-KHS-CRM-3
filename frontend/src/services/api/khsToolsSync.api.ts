import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface KHSToolsSyncData {
  id: string;
  tools: any; // JSON object containing all tools data
  selectedDemoCategories: string[];
  selectedInstallCategories: string[];
  lockedCategories: string[];
  showDemo: boolean;
  showInstall: boolean;
  lastUpdatedBy?: string;
  lastUpdated: string;
  version: number;
}

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('khs-crm-token') || 
                localStorage.getItem('auth-token') ||
                localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[KHSToolsSync] Auth token added to request');
  } else {
    console.warn('[KHSToolsSync] No auth token found');
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('[KHSToolsSync] Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('[KHSToolsSync] Request error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Provide better error messages
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      error.message = 'Network error - check internet connection';
    } else if (error.response?.status === 401) {
      error.message = 'Authentication failed - please log in again';
    }
    
    return Promise.reject(error);
  }
);

const STORAGE_KEY = 'khs-tools-sync-cache';

export const khsToolsSyncApi = {
  // Get the current tools sync data from the database
  async get(): Promise<KHSToolsSyncData> {
    try {
      console.log('[KHSToolsSync] Fetching from server...');
      const response = await api.get('/khs-tools-sync');
      
      // Cache the successful response
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
      console.log('[KHSToolsSync] Data fetched and cached, version:', response.data.version);
      
      return response.data;
    } catch (error: any) {
      console.error('[KHSToolsSync] Server fetch failed:', error.message);
      
      // Fallback to cached data
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        console.log('[KHSToolsSync] Using cached data');
        return JSON.parse(cached);
      }
      
      // Return default data if no cache
      console.log('[KHSToolsSync] No cached data, returning defaults');
      return {
        id: 'main',
        tools: {},
        selectedDemoCategories: [],
        selectedInstallCategories: [],
        lockedCategories: [],
        showDemo: false,
        showInstall: false,
        lastUpdated: new Date().toISOString(),
        version: 1
      };
    }
  },

  // Update the tools sync data in the database
  async update(data: Partial<KHSToolsSyncData>): Promise<KHSToolsSyncData> {
    try {
      console.log('[KHSToolsSync] Updating on server, version:', data.version);
      const response = await api.put('/khs-tools-sync', data);
      
      // Cache the successful response
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
      console.log('[KHSToolsSync] Update successful, new version:', response.data.version);
      
      return response.data;
    } catch (error: any) {
      console.error('[KHSToolsSync] Update failed:', error.message);
      
      // For version conflicts, still throw to trigger sync
      if (error.response?.status === 409) {
        throw error;
      }
      
      // For network errors, update cache and queue for later sync
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network')) {
        console.log('[KHSToolsSync] Network error, updating cache only');
        
        // Update local cache
        const updatedData = {
          ...data,
          id: 'main',
          lastUpdated: new Date().toISOString(),
          version: (data.version || 1) + 1
        } as KHSToolsSyncData;
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        
        // Queue for later sync
        const syncQueue = JSON.parse(localStorage.getItem('khs-sync-queue') || '[]');
        syncQueue.push({
          type: 'khs-tools',
          data: updatedData,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('khs-sync-queue', JSON.stringify(syncQueue));
        
        return updatedData;
      }
      
      throw error;
    }
  },
  
  // Force refresh from server
  async refresh(): Promise<KHSToolsSyncData> {
    console.log('[KHSToolsSync] Force refresh from server');
    // Don't use cache for refresh
    const response = await api.get('/khs-tools-sync');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
    return response.data;
  }
};