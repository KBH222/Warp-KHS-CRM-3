import { apiClient } from './api.service';
import { offlineDb } from './db.service';

interface SyncResult {
  success: boolean;
  timestamp: string;
  pulled?: {
    customers: number;
    jobs: number;
    workers: number;
  };
  pushed?: {
    customers: number;
    jobs: number;
    workers: number;
  };
  errors?: string[];
}

class EnhancedSyncService {
  private lastSyncTime: string | null = null;
  private syncing = false;

  constructor() {
    // Load last sync time from localStorage
    this.lastSyncTime = localStorage.getItem('khs-crm-last-sync-time');
    
    // Set up auto-sync
    this.setupAutoSync();
  }

  private setupAutoSync() {
    // Sync when coming online
    window.addEventListener('online', () => {
      console.log('[EnhancedSync] Network online, triggering sync');
      this.performFullSync();
    });

    // Auto-sync every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.performFullSync();
      }
    }, 30000);

    // Initial sync if online
    if (navigator.onLine) {
      setTimeout(() => this.performFullSync(), 2000);
    }
  }

  async performFullSync(): Promise<SyncResult> {
    if (this.syncing) {
      console.log('[EnhancedSync] Sync already in progress');
      return { success: false, timestamp: new Date().toISOString() };
    }

    this.syncing = true;
    const result: SyncResult = {
      success: false,
      timestamp: new Date().toISOString(),
      errors: []
    };

    try {
      console.log('[EnhancedSync] Starting full sync...');

      // First pull changes from server
      const pullResult = await this.pullFromServer();
      if (pullResult.success) {
        result.pulled = pullResult.pulled;
      } else {
        result.errors?.push('Pull failed: ' + pullResult.error);
      }

      // Then push local changes to server
      const pushResult = await this.pushToServer();
      if (pushResult.success) {
        result.pushed = pushResult.pushed;
      } else {
        result.errors?.push('Push failed: ' + pushResult.error);
      }

      // Update last sync time
      this.lastSyncTime = result.timestamp;
      localStorage.setItem('khs-crm-last-sync-time', this.lastSyncTime);

      result.success = true;
      console.log('[EnhancedSync] Sync completed successfully', result);

    } catch (error) {
      console.error('[EnhancedSync] Sync failed', error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.syncing = false;
    }

    return result;
  }

  private async pullFromServer(): Promise<any> {
    try {
      console.log('[EnhancedSync] Pulling from server, last sync:', this.lastSyncTime);

      const response = await apiClient.post('/api/sync/pull', {
        lastSyncTime: this.lastSyncTime
      });

      const { customers, jobs, workers, timestamp } = response;

      // Save to IndexedDB
      let customerCount = 0;
      let jobCount = 0;
      let workerCount = 0;

      // Process customers
      if (customers && Array.isArray(customers)) {
        for (const customer of customers) {
          await offlineDb.saveCustomer(customer);
          customerCount++;
        }
      }

      // Process jobs
      if (jobs && Array.isArray(jobs)) {
        for (const job of jobs) {
          await offlineDb.saveJob(job);
          jobCount++;
        }
      }

      // Process workers (save to localStorage since workers don't use IndexedDB)
      if (workers && Array.isArray(workers)) {
        const existingWorkers = JSON.parse(localStorage.getItem('khs-crm-workers') || '[]');
        const workerMap = new Map(existingWorkers.map((w: any) => [w.id, w]));
        
        for (const worker of workers) {
          workerMap.set(worker.id, worker);
          workerCount++;
        }
        
        localStorage.setItem('khs-crm-workers', JSON.stringify(Array.from(workerMap.values())));
      }

      console.log(`[EnhancedSync] Pulled: ${customerCount} customers, ${jobCount} jobs, ${workerCount} workers`);

      return {
        success: true,
        pulled: {
          customers: customerCount,
          jobs: jobCount,
          workers: workerCount
        }
      };
    } catch (error) {
      console.error('[EnhancedSync] Pull failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pull failed'
      };
    }
  }

  private async pushToServer(): Promise<any> {
    try {
      console.log('[EnhancedSync] Pushing to server...');

      // Get all local data that needs syncing
      const customers = await offlineDb.getUnsyncedCustomers();
      const jobs = await offlineDb.getUnsyncedJobs();
      const workers = JSON.parse(localStorage.getItem('khs-crm-workers') || '[]');

      // Filter out any temporary/local-only data
      const customersToSync = customers.filter((c: any) => c.id && !c.id.startsWith('local_'));
      const jobsToSync = jobs.filter((j: any) => j.id && !j.id.startsWith('local_'));
      const workersToSync = workers.filter((w: any) => w.id && !w.id.startsWith('local_'));

      console.log(`[EnhancedSync] Pushing: ${customersToSync.length} customers, ${jobsToSync.length} jobs, ${workersToSync.length} workers`);

      const response = await apiClient.post('/api/sync/push', {
        customers: customersToSync,
        jobs: jobsToSync,
        workers: workersToSync,
        timestamp: new Date().toISOString()
      });

      if (response.success) {
        // Mark all synced items as synced in IndexedDB
        for (const customer of customersToSync) {
          await offlineDb.markAsSynced('customer', customer.id);
        }
        for (const job of jobsToSync) {
          await offlineDb.markAsSynced('job', job.id);
        }
      }

      return {
        success: true,
        pushed: {
          customers: customersToSync.length,
          jobs: jobsToSync.length,
          workers: workersToSync.length
        }
      };
    } catch (error) {
      console.error('[EnhancedSync] Push failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Push failed'
      };
    }
  }

  async forceSyncNow(): Promise<SyncResult> {
    console.log('[EnhancedSync] Force sync requested');
    return this.performFullSync();
  }

  getSyncStatus(): { lastSync: string | null; syncing: boolean } {
    return {
      lastSync: this.lastSyncTime,
      syncing: this.syncing
    };
  }
}

// Export singleton instance
export const enhancedSyncService = new EnhancedSyncService();