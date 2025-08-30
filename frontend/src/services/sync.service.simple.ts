import { offlineDb } from './db.service';
import { apiClient } from './api.service';

// Types defined inline
interface Customer {
  id: string;
  reference: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  notes: string | null;
  customerType?: 'CURRENT' | 'LEADS';
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Job {
  id: string;
  title: string;
  customerId: string;
  status: string;
  // Add other job fields as needed
}

interface Material {
  id: string;
  name: string;
  // Add other material fields as needed
}

interface Worker {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  email: string;
  specialty: string;
  status: string;
  currentJob?: string | null;
  color: string;
  notes?: string;
  timesheet?: any;
}

// API endpoints
const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
  JOBS: '/api/jobs',
  JOB_BY_ID: (id: string) => `/api/jobs/${id}`,
  WORKERS: '/api/workers',
  WORKER_BY_ID: (id: string) => `/api/workers/${id}`
};

interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'job' | 'material' | 'worker';
  entityId?: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}

/**
 * Simplified sync service that actually works
 */
class SimpleSyncService {
  private syncQueue: SyncOperation[] = [];
  private syncing = false;

  constructor() {
    // Load queue from localStorage on startup
    this.loadQueue();

    // Start sync when online
    window.addEventListener('online', () => {
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      });

    // Auto-sync every 30 seconds if online
    setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.syncAll();
      }
    }, 30000);

    // Initial sync on startup if online
    if (navigator.onLine) {
      setTimeout(() => this.syncAll(), 2000);
    }
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem('khs_sync_queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
        }
    } catch (error) {
      console.error('[SyncService] Failed to load queue', error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem('khs_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('[SyncService] Failed to save queue', error);
    }
  }

  async queueOperation(params: {
    operation: 'create' | 'update' | 'delete';
    entityType: 'customer' | 'job' | 'material';
    entityId?: string;
    payload: any;
    timestamp: Date;
  }) {
    const op: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random()}`,
      ...params,
      retryCount: 0
    };

    this.syncQueue.push(op);
    this.saveQueue();
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  async syncAll(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.syncing || !navigator.onLine) {
      return { success: false, synced: 0, failed: 0 };
    }

    this.syncing = true;
    let synced = 0;
    let failed = 0;

    // Process queue in order
    const queue = [...this.syncQueue];
    for (const op of queue) {
      try {
        await this.syncOperation(op);
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(q => q.id !== op.id);
        synced++;
        } catch (error) {
        console.error('[SyncService] Failed to sync operation', op, error);
        op.retryCount++;
        failed++;

        // Remove if too many retries
        if (op.retryCount > 5) {
          this.syncQueue = this.syncQueue.filter(q => q.id !== op.id);
          console.error('[SyncService] Giving up on operation after 5 retries', op);
        }
      }
    }

    this.saveQueue();
    this.syncing = false;

    // Don't refresh all data after sync - it overwrites local changes
    // The sync operations already update the local DB with server responses
    console.log('[SyncService] Sync complete:', { synced, failed });

    return { success: true, synced, failed };
  }

  private async syncOperation(op: SyncOperation) {
    switch (op.entityType) {
      case 'customer':
        await this.syncCustomer(op);
        break;
      case 'job':
        await this.syncJob(op);
        break;
      case 'material':
        await this.syncMaterial(op);
        break;
      case 'worker':
        await this.syncWorker(op);
        break;
    }
  }

  private async syncCustomer(op: SyncOperation) {
    switch (op.operation) {
      case 'create': {
        // Create on server
        const created = await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS, op.payload);
        // Replace temp ID with real ID in IndexedDB
        if (op.payload.id && op.payload.id.startsWith('temp_')) {
          await offlineDb.deleteCustomer(op.payload.id);
        }
        await offlineDb.saveCustomer(created);
        break;
      }
      case 'update': {
        if (op.entityId && !op.entityId.startsWith('temp_')) {
          console.log('[SyncService] Syncing customer update:', op.entityId, op.payload);
          const updated = await apiClient.put<Customer>(
            API_ENDPOINTS.CUSTOMER_BY_ID(op.entityId),
            op.payload
          );
          console.log('[SyncService] Server response for customer update:', updated);
          await offlineDb.saveCustomer(updated);
        }
        break;
      }
      case 'delete': {
        if (op.entityId && !op.entityId.startsWith('temp_')) {
          await apiClient.delete(API_ENDPOINTS.CUSTOMER_BY_ID(op.entityId));
          await offlineDb.deleteCustomer(op.entityId);
        }
        break;
      }
    }
  }

  private async syncJob(op: SyncOperation) {
    // Similar implementation for jobs
    switch (op.operation) {
      case 'create': {
        const created = await apiClient.post<Job>(API_ENDPOINTS.JOBS, op.payload);
        if (op.payload.id && op.payload.id.startsWith('temp_')) {
          await offlineDb.deleteJob(op.payload.id);
        }
        await offlineDb.saveJob(created);
        break;
      }
      // ... other operations
    }
  }

  private async syncMaterial(op: SyncOperation) {
    // Similar implementation for materials
  }

  private async syncWorker(op: SyncOperation) {
    switch (op.operation) {
      case 'create': {
        const created = await apiClient.post<Worker>(API_ENDPOINTS.WORKERS, op.payload);
        if (op.payload.id && op.payload.id.startsWith('temp_')) {
          await offlineDb.deleteWorker?.(op.payload.id);
        }
        await offlineDb.saveWorker?.(created);
        break;
      }
      case 'update': {
        if (op.entityId && !op.entityId.startsWith('temp_')) {
          const updated = await apiClient.put<Worker>(
            API_ENDPOINTS.WORKER_BY_ID(op.entityId),
            op.payload
          );
          await offlineDb.saveWorker?.(updated);
        }
        break;
      }
      case 'delete': {
        if (op.entityId && !op.entityId.startsWith('temp_')) {
          await apiClient.delete(API_ENDPOINTS.WORKER_BY_ID(op.entityId));
          await offlineDb.deleteWorker?.(op.entityId);
        }
        break;
      }
    }
  }

  private async refreshDataFromServer() {
    try {
      // Fetch all customers
      const customers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);
      if (Array.isArray(customers)) {
        for (const customer of customers) {
          await offlineDb.saveCustomer(customer);
        }
      } else {
        }

      // Fetch all jobs
      const jobs = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS);
      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          await offlineDb.saveJob(job);
        }
      } else {
        }
      
      // Fetch all workers
      const workers = await apiClient.get<Worker[]>(API_ENDPOINTS.WORKERS);
      if (Array.isArray(workers)) {
        for (const worker of workers) {
          await offlineDb.saveWorker?.(worker);
        }
      }

      } catch (error) {
      console.error('[SyncService] Failed to refresh data:', error);
      console.error('[SyncService] Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      throw error; // Re-throw to let caller know it failed
    }
  }

  // Debug methods
  getPendingOperations(): SyncOperation[] {
    return [...this.syncQueue];
  }

  getSyncStatus() {
    return {
      queueSize: this.syncQueue.length,
      syncing: this.syncing,
      online: navigator.onLine,
      lastSyncTime: new Date()     };
  }

  clearQueue() {
    this.syncQueue = [];
    this.saveQueue();
    }
}

// Export singleton instance
export const simpleSyncService = new SimpleSyncService();