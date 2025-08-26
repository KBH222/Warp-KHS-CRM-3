import axios from 'axios';

// Use explicit production URL as fallback for mobile
const API_URL = import.meta.env.VITE_API_URL || 
                (window.location.hostname.includes('railway.app') 
                  ? 'https://khs-crm-2-production.up.railway.app' 
                  : '');

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
  timeout: 10000, // 10 second timeout for mobile
  withCredentials: false // Explicitly set for CORS
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('khs-crm-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response error interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Extract meaningful error message
    let errorMessage = 'Operation failed';
    if (error.response) {
      errorMessage = error.response.data?.error || error.response.data?.message || `HTTP error! status: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response from server';
    } else {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
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