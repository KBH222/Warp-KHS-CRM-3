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
  // Get all workers - directly from localStorage since no backend
  async getAll(): Promise<Worker[]> {
    const localWorkers = localStorage.getItem('khs-crm-workers');
    if (localWorkers) {
      const workers = JSON.parse(localWorkers);
      console.log('WorkersAPI.getAll - found workers:', workers.length);
      return workers;
    }
    console.log('WorkersAPI.getAll - no workers in localStorage');
    return []; // Return empty array if no workers
  },

  // Get single worker
  async getById(id: string): Promise<Worker> {
    const localWorkers = localStorage.getItem('khs-crm-workers');
    if (localWorkers) {
      const workers = JSON.parse(localWorkers);
      const worker = workers.find((w: Worker) => w.id === id);
      if (worker) {
        return worker;
      }
    }
    throw new Error('Worker not found');
  },

  // Create worker - directly in localStorage
  async create(worker: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Worker> {
    const newWorker: Worker = {
      ...worker,
      id: worker.name, // Use name as ID for simplicity
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Ensure timesheet exists
    if (!newWorker.timesheet) {
      newWorker.timesheet = {};
    }
    
    const localWorkers = localStorage.getItem('khs-crm-workers');
    const workers = localWorkers ? JSON.parse(localWorkers) : [];
    workers.push(newWorker);
    localStorage.setItem('khs-crm-workers', JSON.stringify(workers));
    
    console.log('WorkersAPI.create - created worker:', newWorker);
    return newWorker;
  },

  // Update worker
  async update(id: string, worker: Partial<Worker>): Promise<Worker> {
    console.log('=== WorkersAPI.update ===');
    console.log('ID:', id);
    console.log('Updates:', worker);
    console.log('Timesheet in update:', worker.timesheet);
    
    // Get current data from localStorage
    const localWorkers = localStorage.getItem('khs-crm-workers');
    if (!localWorkers) {
      throw new Error('No workers in localStorage');
    }
    
    const workers = JSON.parse(localWorkers);
    const index = workers.findIndex((w: Worker) => w.id === id);
    
    if (index === -1) {
      throw new Error('Worker not found');
    }
    
    console.log('Current worker before update:', JSON.parse(JSON.stringify(workers[index])));
    
    // Simple update - just merge the objects
    workers[index] = { 
      ...workers[index], 
      ...worker, 
      updatedAt: new Date().toISOString() 
    };
    
    console.log('Worker after update:', JSON.parse(JSON.stringify(workers[index])));
    console.log('Timesheet after update:', workers[index].timesheet);
    
    // Save back to localStorage
    localStorage.setItem('khs-crm-workers', JSON.stringify(workers));
    
    // Verify it saved
    const verification = localStorage.getItem('khs-crm-workers');
    const verifyWorkers = JSON.parse(verification!);
    const verifyWorker = verifyWorkers.find((w: Worker) => w.id === id);
    console.log('Verification - saved worker:', verifyWorker);
    console.log('Verification - saved timesheet:', verifyWorker?.timesheet);
    
    return workers[index];
  },

  // Delete worker - directly from localStorage
  async delete(id: string): Promise<void> {
    const localWorkers = localStorage.getItem('khs-crm-workers');
    if (localWorkers) {
      const workers = JSON.parse(localWorkers);
      const filtered = workers.filter((w: Worker) => w.id !== id);
      localStorage.setItem('khs-crm-workers', JSON.stringify(filtered));
      console.log('WorkersAPI.delete - deleted worker:', id);
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