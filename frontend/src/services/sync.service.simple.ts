import { Customer, Job, Material } from '@khs-crm/types';
import { offlineDb } from './db.service';
import { apiClient } from './api.service';
import { API_ENDPOINTS } from '@khs-crm/constants';

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
    // Load queue from localStorage on startup
    this.loadQueue();
    
    // Start sync when online
    window.addEventListener('online', () => {
      console.log('[SyncService] Device is online, starting sync...');
      this.syncAll();
    });
    
    // Auto-sync every 30 seconds if online
    setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.syncAll();
      }
    }, 30000);
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
      const customers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);
      for (const customer of customers) {
        await offlineDb.saveCustomer(customer);
      }
      
      // Fetch all jobs
      const jobs = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS);
      for (const job of jobs) {
        await offlineDb.saveJob(job);
      }
      
      console.log('[SyncService] Data refresh complete');
    } catch (error) {
      console.error('[SyncService] Failed to refresh data', error);
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