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

// API endpoints
const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
  JOBS: '/api/jobs',
  JOB_BY_ID: (id: string) => `/api/jobs/${id}`
};

interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'job' | 'material';
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
    console.log('[SyncService] Initializing sync service...');
    
    // Load queue from localStorage on startup
    this.loadQueue();
    
    // Start sync when online
    window.addEventListener('online', () => {
      console.log('[SyncService] Device is online, starting sync...');
      this.syncAll();
    });
    
    window.addEventListener('offline', () => {
      console.log('[SyncService] Device went offline');
    });
    
    // Auto-sync every 30 seconds if online
    setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        console.log('[SyncService] Auto-sync timer triggered');
        this.syncAll();
      }
    }, 30000);
    
    // Initial sync on startup if online
    if (navigator.onLine) {
      console.log('[SyncService] Online at startup, syncing in 2 seconds...');
      setTimeout(() => this.syncAll(), 2000);
    }
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem('khs_sync_queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
        console.log('[SyncService] Loaded sync queue', this.syncQueue);
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
    console.log('[SyncService] Queued operation', op);
    
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

    console.log('[SyncService] Starting sync, queue size:', this.syncQueue.length);

    // Process queue in order
    const queue = [...this.syncQueue];
    for (const op of queue) {
      try {
        await this.syncOperation(op);
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(q => q.id !== op.id);
        synced++;
        console.log('[SyncService] Synced operation', op);
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

    // Fetch latest data from server after sync
    if (synced > 0) {
      await this.refreshDataFromServer();
    }

    console.log(`[SyncService] Sync complete. Synced: ${synced}, Failed: ${failed}`);
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
          const updated = await apiClient.put<Customer>(
            API_ENDPOINTS.CUSTOMER_BY_ID(op.entityId),
            op.payload
          );
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

  private async refreshDataFromServer() {
    try {
      console.log('[SyncService] Refreshing data from server...');
      
      // Fetch all customers
      console.log('[SyncService] Fetching customers from:', API_ENDPOINTS.CUSTOMERS);
      const customers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);
      console.log('[SyncService] Fetched customers:', customers);
      
      if (Array.isArray(customers)) {
        for (const customer of customers) {
          await offlineDb.saveCustomer(customer);
        }
      } else {
        console.warn('[SyncService] Customers response is not an array:', customers);
      }
      
      // Fetch all jobs
      console.log('[SyncService] Fetching jobs from:', API_ENDPOINTS.JOBS);
      const jobs = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS);
      console.log('[SyncService] Fetched jobs:', jobs);
      
      if (Array.isArray(jobs)) {
        for (const job of jobs) {
          await offlineDb.saveJob(job);
        }
      } else {
        console.warn('[SyncService] Jobs response is not an array:', jobs);
      }
      
      console.log('[SyncService] Data refresh complete');
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
      lastSyncTime: new Date() // TODO: Track this properly
    };
  }

  clearQueue() {
    this.syncQueue = [];
    this.saveQueue();
    console.log('[SyncService] Queue cleared');
  }
}

export const simpleSyncService = new SimpleSyncService();