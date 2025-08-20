import axios from 'axios';
// Inline type definitions
interface Job {
  id: string;
  customerId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  photos?: any[];
  plans?: any[];
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
      // Server responded with error
      errorMessage = error.response.data?.error || error.response.data?.message || `HTTP error! status: ${error.response.status}`;
    } else if (error.request) {
      // No response received
      errorMessage = 'No response from server';
    } else {
      // Request setup error
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export const jobsApi = {
  // Get all jobs
  async getAll(filters?: { status?: string; customerId?: string; priority?: string }): Promise<Job[]> {
    try {
      const response = await api.get('/jobs', { params: filters });
      return response.data;
    } catch (error) {
      // Fallback to localStorage if API fails
      const localJobs = localStorage.getItem('khs-crm-jobs');
      if (localJobs) {
        let jobs = JSON.parse(localJobs);
        
        // Apply filters if any
        if (filters) {
          if (filters.status) {
            jobs = jobs.filter((j: Job) => j.status === filters.status);
          }
          if (filters.customerId) {
            jobs = jobs.filter((j: Job) => j.customerId === filters.customerId);
          }
          if (filters.priority) {
            jobs = jobs.filter((j: Job) => j.priority === filters.priority);
          }
        }
        
        return jobs;
      }
      throw error;
    }
  },

  // Get single job
  async getById(id: string): Promise<Job> {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  // Create job
  async create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    try {
      const response = await api.post('/jobs', job);
      return response.data;
    } catch (error) {
      // If offline, save to localStorage with temp ID
      if (!navigator.onLine) {
        const tempJob = {
          ...job,
          id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const localJobs = localStorage.getItem('khs-crm-jobs');
        const jobs = localJobs ? JSON.parse(localJobs) : [];
        jobs.push(tempJob);
        localStorage.setItem('khs-crm-jobs', JSON.stringify(jobs));
        
        // Queue for sync
        const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
        const queue = JSON.parse(syncQueue);
        queue.push({
          type: 'job',
          action: 'create',
          data: tempJob,
          timestamp: Date.now(),
        });
        localStorage.setItem('khs-crm-sync-queue', JSON.stringify(queue));
        
        return tempJob as Job;
      }
      throw error;
    }
  },

  // Update job
  async update(id: string, job: Partial<Job>): Promise<Job> {
    try {
      const response = await api.put(`/jobs/${id}`, job);
      return response.data;
    } catch (error) {
      // If offline, update in localStorage
      if (!navigator.onLine) {
        const localJobs = localStorage.getItem('khs-crm-jobs');
        if (localJobs) {
          const jobs = JSON.parse(localJobs);
          const index = jobs.findIndex((j: Job) => j.id === id);
          if (index !== -1) {
            jobs[index] = { ...jobs[index], ...job, updatedAt: new Date().toISOString() };
            localStorage.setItem('khs-crm-jobs', JSON.stringify(jobs));
            
            // Queue for sync
            const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
            const queue = JSON.parse(syncQueue);
            queue.push({
              type: 'job',
              action: 'update',
              id,
              data: job,
              timestamp: Date.now(),
            });
            localStorage.setItem('khs-crm-sync-queue', JSON.stringify(queue));
            
            return jobs[index];
          }
        }
      }
      throw error;
    }
  },

  // Delete job
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/jobs/${id}`);
    } catch (error) {
      // If offline, remove from localStorage
      if (!navigator.onLine) {
        const localJobs = localStorage.getItem('khs-crm-jobs');
        if (localJobs) {
          const jobs = JSON.parse(localJobs);
          const filtered = jobs.filter((j: Job) => j.id !== id);
          localStorage.setItem('khs-crm-jobs', JSON.stringify(filtered));
          
          // Queue for sync
          const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
          const queue = JSON.parse(syncQueue);
          queue.push({
            type: 'job',
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

  // Get jobs for a customer
  async getByCustomerId(customerId: string): Promise<Job[]> {
    return this.getAll({ customerId });
  },

  // Sync local changes with server
  async sync(): Promise<void> {
    const syncQueue = localStorage.getItem('khs-crm-sync-queue');
    if (!syncQueue) return;

    const queue = JSON.parse(syncQueue);
    const jobChanges = queue.filter((item: any) => item.type === 'job');
    
    if (jobChanges.length === 0) return;

    try {
      const localJobs = localStorage.getItem('khs-crm-jobs');
      const jobs = localJobs ? JSON.parse(localJobs) : [];
      
      const response = await api.post('/jobs/sync', { jobs });
      
      // Update local storage with server IDs
      const results = response.data.results;
      for (const result of results) {
        if (result.status === 'created' && result.data) {
          // Replace temp ID with real ID
          const tempId = result.id;
          const realId = result.data.id;
          
          const jobIndex = jobs.findIndex((j: Job) => j.id === tempId);
          if (jobIndex !== -1) {
            jobs[jobIndex] = result.data;
          }
        }
      }
      
      localStorage.setItem('khs-crm-jobs', JSON.stringify(jobs));
      
      // Clear processed items from sync queue
      const remainingQueue = queue.filter((item: any) => item.type !== 'job');
      localStorage.setItem('khs-crm-sync-queue', JSON.stringify(remainingQueue));
    } catch (error) {
      throw error;
    }
  },
};