import axios from 'axios';

// Use explicit production URL as fallback for mobile
const API_URL = import.meta.env.VITE_API_URL || 
                (window.location.hostname.includes('railway.app') 
                  ? 'https://khs-crm-3-production.up.railway.app' 
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
      console.log('[KHSToolsSync] Update payload size:', JSON.stringify(data).length);
      
      // Add timestamp for debugging
      const startTime = Date.now();
      
      const response = await api.put('/khs-tools-sync', data);
      
      const duration = Date.now() - startTime;
      console.log(`[KHSToolsSync] Update successful in ${duration}ms, new version:`, response.data.version);
      
      // Cache the successful response
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      console.error('[KHSToolsSync] Update failed:', error);
      console.error('[KHSToolsSync] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          baseURL: error.config?.baseURL
        }
      });
      
      // For version conflicts, still throw to trigger sync
      if (error.response?.status === 409) {
        throw error;
      }
      
      // For network errors or no response, update cache and queue for later sync
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network') || error.message === 'No response from server') {
        console.log('[KHSToolsSync] Network/timeout error, updating cache only');
        
        // Update local cache
        const updatedData = {
          ...data,
          id: 'main',
          lastUpdated: new Date().toISOString(),
          version: (data.version || 1) + 1
        } as KHSToolsSyncData;
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        
        // Queue for later sync with size limit
        try {
          let syncQueue = JSON.parse(localStorage.getItem('khs-sync-queue') || '[]');
          
          // Limit queue size to prevent localStorage overflow
          const MAX_QUEUE_SIZE = 10;
          if (syncQueue.length >= MAX_QUEUE_SIZE) {
            // Remove oldest items
            syncQueue = syncQueue.slice(-5); // Keep only last 5 items
          }
          
          syncQueue.push({
            type: 'khs-tools',
            data: updatedData,
            timestamp: new Date().toISOString()
          });
          
          localStorage.setItem('khs-sync-queue', JSON.stringify(syncQueue));
        } catch (storageError) {
          console.error('[KHSToolsSync] Failed to update sync queue:', storageError);
          // Clear the queue if storage is full
          localStorage.removeItem('khs-sync-queue');
        }
        
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
  },
  
  // Clear sync queue
  clearSyncQueue(): void {
    console.log('[KHSToolsSync] Clearing sync queue');
    localStorage.removeItem('khs-sync-queue');
  },
  
  // Get sync queue size
  getSyncQueueSize(): number {
    try {
      const queue = JSON.parse(localStorage.getItem('khs-sync-queue') || '[]');
      return queue.length;
    } catch {
      return 0;
    }
  },
  
  // Clear all sync-related localStorage
  clearAllSyncData(): void {
    console.log('[KHSToolsSync] Clearing all sync data');
    localStorage.removeItem('khs-sync-queue');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('khs-tools-sync-data-v4');
    localStorage.removeItem('khs-tools-db-version');
  }
};