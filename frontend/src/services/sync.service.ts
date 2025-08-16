import { offlineDb } from './db.service';
import { apiClient } from './api.service';
import { syncStore } from '@stores/sync.store';

// Types defined inline
interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'job' | 'material';
  entityId?: string;
  payload: any;
  timestamp: Date;
  attempts?: number;
  lastError?: string;
}

interface SyncStatus {
  lastSync: Date | null;
  syncInProgress: boolean;
  pendingOperations: number;
  errors: SyncError[];
}

interface Customer {
  id: string;
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
  description: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  customerId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Material {
  id: string;
  jobId: string;
  itemName: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  notes: string | null;
  addedById: string;
  purchasedById: string | null;
  purchasedBy: any | null;
  purchasedAt: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncError {
  operation: SyncOperation;
  error: string;
  timestamp: Date;
}

// Constants defined inline
const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  BATCH_SIZE: 50
};

const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
  JOBS: '/api/jobs',
  JOB_BY_ID: (id: string) => `/api/jobs/${id}`,
  JOB_MATERIALS: (jobId: string) => `/api/jobs/${jobId}/materials`,
  MATERIAL_BY_ID: (id: string) => `/api/materials/${id}`,
  MATERIALS_BULK_UPDATE: '/api/materials/bulk-update'
};

const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFLICT: 'CONFLICT',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

interface ConflictResolutionStrategy {
  name: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  resolve: (serverData: any, clientData: any) => Promise<any>;
}

interface SyncResult {
  success: boolean;
  conflicts: number;
  processed: number;
  errors: SyncError[];
}

class SyncService {
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;
  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  private conflictResolutionStrategies = new Map<string, ConflictResolutionStrategy>();
  private syncPriorities = {
    customer: 1,
    job: 2, 
    material: 3,
  };

  initialize(): void {
    // Setup conflict resolution strategies
    this.setupConflictResolutionStrategies();

    // Start auto-sync interval
    this.startAutoSync();

    // Listen for online/offline events
    this.onlineListener = () => this.handleOnline();
    this.offlineListener = () => this.handleOffline();
    
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);

    // Set initial online status
    syncStore.getState().setOnline(navigator.onLine);

    // Resume failed operations on startup
    this.resumeFailedOperations();
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
    
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
    }

    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.sync();
      }
    }, SYNC_CONFIG.AUTO_SYNC_INTERVAL);
  }

  private handleOnline(): void {
    syncStore.getState().setOnline(true);
    // Resume failed operations
    this.resumeFailedOperations();
    // Sync immediately when coming online
    this.sync();
  }

  private handleOffline(): void {
    syncStore.getState().setOnline(false);
  }

  async sync(): Promise<SyncResult> {
    if (this.syncInProgress || !navigator.onLine) {
      return { success: false, conflicts: 0, processed: 0, errors: [] };
    }

    this.syncInProgress = true;
    syncStore.getState().setSyncing(true);

    const result: SyncResult = {
      success: true,
      conflicts: 0,
      processed: 0,
      errors: [],
    };

    try {
      // Process sync queue first (push local changes)
      const pushResult = await this.processSyncQueue();
      result.processed += pushResult.processed;
      result.conflicts += pushResult.conflicts;
      result.errors.push(...pushResult.errors);

      // Then pull latest data from server
      const pullResult = await this.pullData();
      result.conflicts += pullResult.conflicts;
      result.errors.push(...pullResult.errors);

      // Update last sync time
      const now = new Date();
      await offlineDb.setLastSyncTime(now);
      syncStore.getState().setLastSyncTime(now);
      
      // Update sync store with results
      if (result.errors.length === 0) {
        syncStore.getState().clearErrors();
      } else {
        result.errors.forEach(error => syncStore.getState().addError(error));
        result.success = false;
      }
    } catch (error) {
      console.error('Sync failed:', error);
      const syncError = {
        operationId: `sync_${Date.now()}`,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date(),
      };
      result.errors.push(syncError);
      result.success = false;
      syncStore.getState().addError(syncError);
    } finally {
      this.syncInProgress = false;
      syncStore.getState().setSyncing(false);
    }

    return result;
  }

  private async processSyncQueue(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      conflicts: 0,
      processed: 0,
      errors: [],
    };

    const operations = await offlineDb.getSyncQueueByPriority();
    
    for (const operation of operations) {
      try {
        await offlineDb.updateSyncOperationStatus(operation.id, 'processing');
        
        const opResult = await this.processSyncOperation(operation);
        if (opResult.conflict) {
          result.conflicts++;
        }
        
        await offlineDb.updateSyncOperationStatus(operation.id, 'completed');
        await offlineDb.removeSyncOperation(operation.id);
        result.processed++;
        
        // Clear any existing retry timeout
        if (this.retryTimeouts.has(operation.id)) {
          clearTimeout(this.retryTimeouts.get(operation.id));
          this.retryTimeouts.delete(operation.id);
        }
      } catch (error) {
        console.error('Failed to process sync operation:', operation, error);
        
        const syncError = {
          operationId: operation.id,
          error: error instanceof Error ? error.message : 'Operation failed',
          timestamp: new Date(),
        };
        result.errors.push(syncError);
        
        await this.handleOperationFailure(operation, error as Error);
        result.success = false;
      }
    }

    return result;
  }

  private async processSyncOperation(operation: SyncOperation): Promise<{ conflict: boolean }> {
    const { entityType, entityId, operation: op, payload } = operation;
    let conflict = false;

    try {
      switch (entityType) {
        case 'customer':
          conflict = await this.syncCustomerOperation(op, entityId, payload);
          break;
        case 'job':
          conflict = await this.syncJobOperation(op, entityId, payload);
          break;
        case 'material':
          conflict = await this.syncMaterialOperation(op, entityId, payload);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          // Entity was deleted on server, remove locally
          await this.handleEntityDeleted(entityType, entityId || payload.id);
          return { conflict: false };
        } else if (error.message.includes('409') || error.message.includes('conflict')) {
          // Conflict detected, attempt resolution
          conflict = await this.handleConflict(entityType, entityId, payload);
        }
      }
      
      if (!conflict) {
        throw error; // Re-throw if not handled
      }
    }

    return { conflict };
  }

  private async syncCustomerOperation(
    operation: string,
    entityId: string | undefined,
    payload: any,
  ): Promise<boolean> {
    let hasConflict = false;

    try {
      switch (operation) {
        case 'create': {
          const created = await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS, payload);
          // Update local ID with server ID and mark as synced
          await offlineDb.deleteCustomer(payload.id);
          await offlineDb.saveCustomer(created);
          await offlineDb.markAsSynced('customer', created.id);
          break;
        }
        case 'update':
          if (entityId) {
            try {
              const updated = await apiClient.put<Customer>(
                API_ENDPOINTS.CUSTOMER_BY_ID(entityId),
                payload,
              );
              await offlineDb.saveCustomer(updated);
              await offlineDb.markAsSynced('customer', entityId);
            } catch (error) {
              if (error instanceof Error && error.message.includes('409')) {
                hasConflict = await this.handleConflict('customer', entityId, payload);
              } else {
                throw error;
              }
            }
          }
          break;
        case 'delete':
          if (entityId) {
            await apiClient.delete(API_ENDPOINTS.CUSTOMER_BY_ID(entityId));
            await offlineDb.deleteCustomer(entityId);
          }
          break;
      }
    } catch (error) {
      if (!hasConflict) {
        throw error;
      }
    }

    return hasConflict;
  }

  private async syncJobOperation(
    operation: string,
    entityId: string | undefined,
    payload: any,
  ): Promise<boolean> {
    let hasConflict = false;

    try {
      switch (operation) {
        case 'create': {
          const created = await apiClient.post<Job>(API_ENDPOINTS.JOBS, payload);
          await offlineDb.deleteJob(payload.id);
          await offlineDb.saveJob(created);
          await offlineDb.markAsSynced('job', created.id);
          break;
        }
        case 'update':
          if (entityId) {
            try {
              const updated = await apiClient.put<Job>(
                API_ENDPOINTS.JOB_BY_ID(entityId),
                payload,
              );
              await offlineDb.saveJob(updated);
              await offlineDb.markAsSynced('job', entityId);
            } catch (error) {
              if (error instanceof Error && error.message.includes('409')) {
                hasConflict = await this.handleConflict('job', entityId, payload);
              } else {
                throw error;
              }
            }
          }
          break;
        case 'delete':
          if (entityId) {
            await apiClient.delete(API_ENDPOINTS.JOB_BY_ID(entityId));
            await offlineDb.deleteJob(entityId);
          }
          break;
      }
    } catch (error) {
      if (!hasConflict) {
        throw error;
      }
    }

    return hasConflict;
  }

  private async syncMaterialOperation(
    operation: string,
    entityId: string | undefined,
    payload: any,
  ): Promise<boolean> {
    let hasConflict = false;

    try {
      switch (operation) {
        case 'create': {
          const created = await apiClient.post<Material>(
            API_ENDPOINTS.JOB_MATERIALS(payload.jobId),
            payload,
          );
          await offlineDb.saveMaterial(created);
          await offlineDb.markAsSynced('material', created.id);
          break;
        }
        case 'update':
          if (entityId) {
            try {
              const updated = await apiClient.put<Material>(
                API_ENDPOINTS.MATERIAL_BY_ID(entityId),
                payload,
              );
              await offlineDb.saveMaterial(updated);
              await offlineDb.markAsSynced('material', entityId);
            } catch (error) {
              if (error instanceof Error && error.message.includes('409')) {
                hasConflict = await this.handleConflict('material', entityId, payload);
              } else {
                throw error;
              }
            }
          }
          break;
        case 'delete':
          if (entityId) {
            await apiClient.delete(API_ENDPOINTS.MATERIAL_BY_ID(entityId));
            // Soft delete locally
            const material = await offlineDb.getMaterials(payload.jobId)
              .then(materials => materials.find(m => m.id === entityId));
            if (material) {
              await offlineDb.saveMaterial({ ...material, isDeleted: true });
            }
          }
          break;
      }
    } catch (error) {
      if (!hasConflict) {
        throw error;
      }
    }

    return hasConflict;
  }

  private async pullData(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      conflicts: 0,
      processed: 0,
      errors: [],
    };

    const lastSync = await offlineDb.getLastSyncTime();
    
    try {
      // Pull all data if first sync, otherwise pull changes since last sync
      if (!lastSync) {
        await this.pullAllData();
      } else {
        const pullResult = await this.pullChanges(lastSync);
        result.conflicts += pullResult.conflicts;
        result.errors.push(...pullResult.errors);
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        operationId: `pull_${Date.now()}`,
        error: error instanceof Error ? error.message : 'Pull failed',
        timestamp: new Date(),
      });
    }

    return result;
  }

  private async pullAllData(): Promise<void> {
    // Clear existing data first
    await offlineDb.clearAllData();

    // Pull all customers
    const customers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);
    await offlineDb.bulkSaveCustomers(customers);

    // Pull all jobs
    const jobs = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS);
    await offlineDb.bulkSaveJobs(jobs);

    // Pull materials for each job
    for (const job of jobs) {
      const materials = await apiClient.get<Material[]>(
        API_ENDPOINTS.JOB_MATERIALS(job.id),
      );
      await offlineDb.bulkSaveMaterials(materials);
    }
  }

  private async pullChanges(since: Date): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      conflicts: 0,
      processed: 0,
      errors: [],
    };

    try {
      // Pull changed data since last sync
      const params = { since: since.toISOString() };

      // Pull changed customers
      const customers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS, { params });
      for (const customer of customers) {
        const conflictResolved = await this.resolveServerConflict('customer', customer);
        if (conflictResolved) {
          result.conflicts++;
        }
        await offlineDb.saveCustomer(customer);
        await offlineDb.markAsSynced('customer', customer.id);
        result.processed++;
      }

      // Pull changed jobs
      const jobs = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS, { params });
      for (const job of jobs) {
        const conflictResolved = await this.resolveServerConflict('job', job);
        if (conflictResolved) {
          result.conflicts++;
        }
        await offlineDb.saveJob(job);
        await offlineDb.markAsSynced('job', job.id);
        result.processed++;
      }

      // Pull changed materials
      for (const job of jobs) {
        const materials = await apiClient.get<Material[]>(
          API_ENDPOINTS.JOB_MATERIALS(job.id),
          { params },
        );
        for (const material of materials) {
          const conflictResolved = await this.resolveServerConflict('material', material);
          if (conflictResolved) {
            result.conflicts++;
          }
          await offlineDb.saveMaterial(material);
          await offlineDb.markAsSynced('material', material.id);
          result.processed++;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        operationId: `pull_changes_${Date.now()}`,
        error: error instanceof Error ? error.message : 'Failed to pull changes',
        timestamp: new Date(),
      });
    }

    return result;
  }

  // New helper methods for conflict resolution and retry logic
  private setupConflictResolutionStrategies(): void {
    // Server wins strategy (default)
    this.conflictResolutionStrategies.set('server_wins', {
      name: 'server_wins',
      resolve: async (serverData, clientData) => serverData,
    });

    // Client wins strategy
    this.conflictResolutionStrategies.set('client_wins', {
      name: 'client_wins', 
      resolve: async (serverData, clientData) => clientData,
    });

    // Merge strategy (combines both with timestamps)
    this.conflictResolutionStrategies.set('merge', {
      name: 'merge',
      resolve: async (serverData, clientData) => {
        const merged = { ...serverData };
        
        // Use client data for fields that were modified more recently
        const serverModified = new Date(serverData.updatedAt || serverData.createdAt).getTime();
        const clientModified = (clientData as any)._lastModified || 0;
        
        if (clientModified > serverModified) {
          // Merge client changes while preserving server structure
          Object.keys(clientData).forEach(key => {
            if (!key.startsWith('_') && key !== 'id' && key !== 'createdAt') {
              merged[key] = clientData[key];
            }
          });
          merged.updatedAt = new Date();
        }
        
        return merged;
      },
    });
  }

  private async handleConflict(
    entityType: string,
    entityId: string | undefined,
    clientData: any
  ): Promise<boolean> {
    if (!entityId) {
      return false;
    }

    try {
      // Get current server data
      let serverData: any;
      switch (entityType) {
        case 'customer':
          serverData = await apiClient.get<Customer>(API_ENDPOINTS.CUSTOMER_BY_ID(entityId));
          break;
        case 'job':
          serverData = await apiClient.get<Job>(API_ENDPOINTS.JOB_BY_ID(entityId));
          break;
        case 'material':
          serverData = await apiClient.get<Material>(API_ENDPOINTS.MATERIAL_BY_ID(entityId));
          break;
        default:
          return false;
      }

      // Apply conflict resolution strategy
      const strategy = this.conflictResolutionStrategies.get(SYNC_CONFIG.CONFLICT_RESOLUTION) 
        || this.conflictResolutionStrategies.get('server_wins')!;
      
      const resolvedData = await strategy.resolve(serverData, clientData);
      
      // Update both local and server with resolved data
      await this.updateResolvedConflict(entityType, entityId, resolvedData);
      
      return true;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }
  }

  private async resolveServerConflict(entityType: string, serverData: any): Promise<boolean> {
    // Check if we have local changes for this entity
    let localData: any;
    
    try {
      switch (entityType) {
        case 'customer':
          localData = await offlineDb.getCustomer(serverData.id);
          break;
        case 'job':
          localData = await offlineDb.getJob(serverData.id);
          break;
        case 'material':
          localData = await offlineDb.getMaterials(serverData.jobId)
            .then(materials => materials.find(m => m.id === serverData.id));
          break;
        default:
          return false;
      }

      // No local data or already synced, no conflict
      if (!localData || (localData as any)._synced) {
        return false;
      }

      // Check if local data has been modified since last sync
      const lastSync = await offlineDb.getLastSyncTime();
      const localModified = (localData as any)._lastModified || 0;
      
      if (lastSync && localModified > lastSync.getTime()) {
        // We have a conflict, resolve it
        await this.handleConflict(entityType, serverData.id, localData);
        return true;
      }
    } catch (error) {
      console.error('Error checking for server conflicts:', error);
    }

    return false;
  }

  private async updateResolvedConflict(
    entityType: string,
    entityId: string,
    resolvedData: any
  ): Promise<void> {
    // Update server
    switch (entityType) {
      case 'customer':
        await apiClient.put(API_ENDPOINTS.CUSTOMER_BY_ID(entityId), resolvedData);
        await offlineDb.saveCustomer(resolvedData);
        await offlineDb.markAsSynced('customer', entityId);
        break;
      case 'job':
        await apiClient.put(API_ENDPOINTS.JOB_BY_ID(entityId), resolvedData);
        await offlineDb.saveJob(resolvedData);
        await offlineDb.markAsSynced('job', entityId);
        break;
      case 'material':
        await apiClient.put(API_ENDPOINTS.MATERIAL_BY_ID(entityId), resolvedData);
        await offlineDb.saveMaterial(resolvedData);
        await offlineDb.markAsSynced('material', entityId);
        break;
    }
  }

  private async handleEntityDeleted(entityType: string, entityId: string): Promise<void> {
    // Entity was deleted on server, remove from local storage
    switch (entityType) {
      case 'customer':
        await offlineDb.deleteCustomer(entityId);
        break;
      case 'job':
        await offlineDb.deleteJob(entityId);
        break;
      case 'material':
        const materials = await offlineDb.getMaterials('');
        const material = materials.find(m => m.id === entityId);
        if (material) {
          await offlineDb.saveMaterial({ ...material, isDeleted: true });
        }
        break;
    }
  }

  private async handleOperationFailure(operation: SyncOperation, error: Error): Promise<void> {
    const opWithAttempts = operation as any;
    const maxRetries = SYNC_CONFIG.MAX_RETRY_ATTEMPTS;
    
    if (opWithAttempts._attempts >= maxRetries) {
      // Max retries reached, mark as failed
      await offlineDb.updateSyncOperationStatus(operation.id, 'failed', error.message);
      return;
    }

    // Schedule retry with exponential backoff
    const retryDelay = SYNC_CONFIG.RETRY_DELAY * Math.pow(2, opWithAttempts._attempts);
    
    // Clear any existing retry timeout
    if (this.retryTimeouts.has(operation.id)) {
      clearTimeout(this.retryTimeouts.get(operation.id));
    }

    // Schedule retry
    const timeout = setTimeout(async () => {
      if (navigator.onLine) {
        try {
          await offlineDb.updateSyncOperationStatus(operation.id, 'pending');
          // The operation will be picked up in the next sync cycle
          this.sync();
        } catch (retryError) {
          console.error('Retry scheduling failed:', retryError);
        }
      }
      this.retryTimeouts.delete(operation.id);
    }, retryDelay);

    this.retryTimeouts.set(operation.id, timeout);
    await offlineDb.updateSyncOperationStatus(operation.id, 'failed', error.message);
  }

  private async resumeFailedOperations(): Promise<void> {
    const failedOps = await offlineDb.getFailedSyncOperations();
    
    for (const operation of failedOps) {
      const opWithAttempts = operation as any;
      if (opWithAttempts._attempts < SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
        // Reset to pending for retry
        await offlineDb.updateSyncOperationStatus(operation.id, 'pending');
      }
    }
  }

  // Public method to force sync
  async forceSync(): Promise<SyncResult> {
    return await this.sync();
  }

  // Add operation to sync queue with priority
  async queueOperation(
    operation: Omit<SyncOperation, 'id'>,
    priority?: number
  ): Promise<string> {
    const entityPriority = this.syncPriorities[operation.entityType as keyof typeof this.syncPriorities] || 5;
    const finalPriority = priority !== undefined ? priority : entityPriority;
    
    return await offlineDb.addToSyncQueue(operation, finalPriority);
  }

  // Clear all sync operations
  async clearSyncQueue(): Promise<void> {
    await offlineDb.clearSyncQueue();
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  // Get detailed sync statistics
  async getSyncStatistics(): Promise<{
    pendingOperations: number;
    failedOperations: number;
    inProgressOperations: number;
    lastSyncTime?: Date;
    nextRetryTime?: Date;
  }> {
    const [pendingOps, failedOps] = await Promise.all([
      offlineDb.getPendingSyncOperations(),
      offlineDb.getFailedSyncOperations(),
    ]);
    
    const allOps = await offlineDb.getSyncQueue();
    const inProgressOps = allOps.filter(op => (op as any)._status === 'processing');
    
    // Find next retry time
    let nextRetryTime: Date | undefined;
    this.retryTimeouts.forEach((timeout, operationId) => {
      // This is a simplified approach - in a real implementation you'd track retry times
      const retryTime = new Date(Date.now() + SYNC_CONFIG.RETRY_DELAY);
      if (!nextRetryTime || retryTime < nextRetryTime) {
        nextRetryTime = retryTime;
      }
    });

    return {
      pendingOperations: pendingOps.length,
      failedOperations: failedOps.length,
      inProgressOperations: inProgressOps.length,
      lastSyncTime: await offlineDb.getLastSyncTime() || undefined,
      nextRetryTime,
    };
  }

  // Get current sync status (enhanced)
  async getSyncStatus(): Promise<SyncStatus> {
    const [pendingOps, failedOps] = await Promise.all([
      offlineDb.getPendingSyncOperations(),
      offlineDb.getFailedSyncOperations(),
    ]);
    const lastSync = await offlineDb.getLastSyncTime();
    
    return {
      lastSyncAt: lastSync || undefined,
      pendingOperations: pendingOps.length,
      syncInProgress: this.syncInProgress,
      errors: [
        ...syncStore.getState().errors,
        ...failedOps.map(op => ({
          operationId: op.id,
          error: `Failed operation: ${op.operation} ${op.entityType}`,
          timestamp: new Date(op.timestamp),
        })),
      ],
    };
  }
}

export const syncService = new SyncService();