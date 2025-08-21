import axios from 'axios';

// Inline type definition
export interface Worker {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  email: string;
  specialty: string;
  status: 'Available' | 'On Job' | 'Off Duty';
  currentJob?: string | null;
  color: string;
  notes?: string;
  timesheet?: {
    [key: string]: {
      startTime: string;
      endTime: string;
      lunchMinutes: number;
      job: string;
      workType: string;
      totalHours: number;
    }
  };
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

export const workersApi = {
  // Get all workers
  async getAll(): Promise<Worker[]> {
    try {
      const response = await api.get('/workers');
      return response.data;
    } catch (error) {
      // Fallback to localStorage if API fails
      const localWorkers = localStorage.getItem('khs-crm-workers');
      if (localWorkers) {
        return JSON.parse(localWorkers);
      }
      throw error;
    }
  },

  // Get single worker
  async getById(id: string): Promise<Worker> {
    const response = await api.get(`/workers/${id}`);
    return response.data;
  },

  // Create worker
  async create(worker: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Worker> {
    try {
      const response = await api.post('/workers', worker);
      
      // Also update localStorage for offline access
      const localWorkers = localStorage.getItem('khs-crm-workers');
      const workers = localWorkers ? JSON.parse(localWorkers) : [];
      workers.push(response.data);
      localStorage.setItem('khs-crm-workers', JSON.stringify(workers));
      
      return response.data;
    } catch (error) {
      // If offline, save to localStorage with temp ID
      if (!navigator.onLine) {
        const tempWorker = {
          ...worker,
          id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const localWorkers = localStorage.getItem('khs-crm-workers');
        const workers = localWorkers ? JSON.parse(localWorkers) : [];
        workers.push(tempWorker);
        localStorage.setItem('khs-crm-workers', JSON.stringify(workers));
        
        // Queue for sync
        const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
        const queue = JSON.parse(syncQueue);
        queue.push({
          type: 'worker',
          action: 'create',
          data: tempWorker,
          timestamp: Date.now(),
        });
        localStorage.setItem('khs-crm-sync-queue', JSON.stringify(queue));
        
        return tempWorker as Worker;
      }
      throw error;
    }
  },

  // Update worker
  async update(id: string, worker: Partial<Worker>): Promise<Worker> {
    // Always work with localStorage for workers since there's no backend
    const localWorkers = localStorage.getItem('khs-crm-workers');
    if (localWorkers) {
      const workers = JSON.parse(localWorkers);
      const index = workers.findIndex((w: Worker) => w.id === id);
      if (index !== -1) {
        // Apply the update (merge is already handled by worker.service.ts)
        workers[index] = { 
          ...workers[index], 
          ...worker, 
          updatedAt: new Date().toISOString() 
        };
        localStorage.setItem('khs-crm-workers', JSON.stringify(workers));
        
        // Return the updated worker
        return workers[index];
      }
    }
    
    throw new Error('Worker not found');
  },

  // Delete worker
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/workers/${id}`);
      
      // Also remove from localStorage
      const localWorkers = localStorage.getItem('khs-crm-workers');
      if (localWorkers) {
        const workers = JSON.parse(localWorkers);
        const filtered = workers.filter((w: Worker) => w.id !== id);
        localStorage.setItem('khs-crm-workers', JSON.stringify(filtered));
      }
    } catch (error) {
      // If offline, remove from localStorage
      if (!navigator.onLine) {
        const localWorkers = localStorage.getItem('khs-crm-workers');
        if (localWorkers) {
          const workers = JSON.parse(localWorkers);
          const filtered = workers.filter((w: Worker) => w.id !== id);
          localStorage.setItem('khs-crm-workers', JSON.stringify(filtered));
          
          // Queue for sync
          const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
          const queue = JSON.parse(syncQueue);
          queue.push({
            type: 'worker',
            action: 'delete',
            id,
            timestamp: Date.now(),
          });
          localStorage.setItem('khs-crm-sync-queue', JSON.stringify(queue));
        }
      } else {
        throw error;
      }
    }
  },

  // Sync local changes with server
  async sync(): Promise<void> {
    const syncQueue = localStorage.getItem('khs-crm-sync-queue');
    if (!syncQueue) return;

    const queue = JSON.parse(syncQueue);
    const workerChanges = queue.filter((item: any) => item.type === 'worker');
    
    if (workerChanges.length === 0) return;

    // Process each change
    for (const change of workerChanges) {
      try {
        if (change.action === 'create') {
          const response = await api.post('/workers', change.data);
          // Update local storage with real ID
          const localWorkers = localStorage.getItem('khs-crm-workers');
          if (localWorkers) {
            const workers = JSON.parse(localWorkers);
            const index = workers.findIndex((w: Worker) => w.id === change.data.id);
            if (index !== -1) {
              workers[index] = response.data;
              localStorage.setItem('khs-crm-workers', JSON.stringify(workers));
            }
          }
        } else if (change.action === 'update') {
          await api.put(`/workers/${change.id}`, change.data);
        } else if (change.action === 'delete') {
          await api.delete(`/workers/${change.id}`);
        }
      } catch (error) {
        // Keep in queue for retry
        continue;
      }
    }
    
    // Clear processed items from sync queue
    const remainingQueue = queue.filter((item: any) => item.type !== 'worker');
    localStorage.setItem('khs-crm-sync-queue', JSON.stringify(remainingQueue));
  },

  // Force refresh from server
  async refresh(): Promise<Worker[]> {
    const response = await api.get('/workers');
    const workers = response.data;
    
    // Update localStorage with fresh data
    localStorage.setItem('khs-crm-workers', JSON.stringify(workers));
    
    return workers;
  }
};