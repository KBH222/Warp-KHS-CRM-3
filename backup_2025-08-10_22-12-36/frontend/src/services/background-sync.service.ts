import { offlineCacheService } from './offline-cache.service';
import { syncService } from './sync.service';
import { syncStore } from '@stores/sync.store';

interface SyncConfig {
  backgroundSync: boolean;
  syncInterval: number;
  retryInterval: number;
  maxRetries: number;
  prioritizedSync: boolean;
}

interface SyncStrategy {
  name: string;
  condition: () => boolean;
  priority: 'critical' | 'important' | 'normal';
  execute: () => Promise<void>;
}

class BackgroundSyncService {
  private syncWorker: Worker | null = null;
  private periodicSyncRegistration: any = null;
  private config: SyncConfig = {
    backgroundSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    retryInterval: 30 * 1000, // 30 seconds
    maxRetries: 3,
    prioritizedSync: true
  };
  private isInitialized = false;
  private syncStrategies: SyncStrategy[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.setupBackgroundSync();
      await this.setupPeriodicSync();
      this.setupSyncStrategies();
      this.setupNetworkListeners();
      
      this.isInitialized = true;
      console.log('Background sync service initialized');
    } catch (error) {
      console.error('Failed to initialize background sync:', error);
    }
  }

  private async setupBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Register background sync for critical construction data
        await registration.sync.register('construction-data-sync');
        
        console.log('Background sync registered for construction data');
      } catch (error) {
        console.warn('Background sync not supported or failed:', error);
      }
    }
  }

  private async setupPeriodicSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Register periodic sync for field data refresh (if supported)
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' as any });
        
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register('construction-data-refresh', {
            minInterval: this.config.syncInterval
          });
          
          console.log('Periodic sync registered for construction data');
        }
      } catch (error) {
        console.warn('Periodic sync not supported:', error);
      }
    }
  }

  private setupSyncStrategies(): void {
    this.syncStrategies = [
      {
        name: 'Critical Field Data Sync',
        condition: () => navigator.onLine && this.hasCriticalPendingData(),
        priority: 'critical',
        execute: async () => {
          await this.syncCriticalFieldData();
        }
      },
      {
        name: 'Active Jobs Sync',
        condition: () => navigator.onLine && this.hasActiveJobsData(),
        priority: 'important',
        execute: async () => {
          await this.syncActiveJobs();
        }
      },
      {
        name: 'Materials Updates',
        condition: () => navigator.onLine && this.hasMaterialUpdates(),
        priority: 'important',
        execute: async () => {
          await this.syncMaterialUpdates();
        }
      },
      {
        name: 'Photo Uploads',
        condition: () => navigator.onLine && this.hasPendingPhotos(),
        priority: 'normal',
        execute: async () => {
          await this.syncJobPhotos();
        }
      },
      {
        name: 'General Data Sync',
        condition: () => navigator.onLine,
        priority: 'normal',
        execute: async () => {
          await syncService.sync();
        }
      }
    ];
  }

  private setupNetworkListeners(): void {
    // Enhanced network monitoring for field conditions
    window.addEventListener('online', async () => {
      console.log('Network connection restored');
      syncStore.getState().setOnline(true);
      
      // Immediate sync of critical data when coming online
      await this.executeImmediateSync();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      syncStore.getState().setOnline(false);
    });

    // Monitor connection quality changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        const { effectiveType, downlink, rtt } = connection;
        console.log(`Connection changed: ${effectiveType}, downlink: ${downlink}, rtt: ${rtt}`);
        
        // Adjust sync strategy based on connection quality
        this.adjustSyncStrategy(effectiveType, downlink, rtt);
      };
      
      connection.addEventListener('change', handleConnectionChange);
    }
  }

  private async executeImmediateSync(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      syncStore.getState().setSyncing(true);
      
      // Execute sync strategies in priority order
      const prioritizedStrategies = this.syncStrategies
        .filter(strategy => strategy.condition())
        .sort((a, b) => {
          const priorityOrder = { critical: 3, important: 2, normal: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

      for (const strategy of prioritizedStrategies) {
        try {
          console.log(`Executing sync strategy: ${strategy.name}`);
          await strategy.execute();
        } catch (error) {
          console.error(`Sync strategy ${strategy.name} failed:`, error);
        }
      }
    } catch (error) {
      console.error('Immediate sync failed:', error);
      syncStore.getState().addError({
        operationId: `immediate_sync_${Date.now()}`,
        error: error instanceof Error ? error.message : 'Immediate sync failed',
        timestamp: new Date()
      });
    } finally {
      syncStore.getState().setSyncing(false);
    }
  }

  private adjustSyncStrategy(effectiveType: string, downlink: number, rtt: number): void {
    // Adjust sync behavior based on connection quality
    let newInterval = this.config.syncInterval;
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        newInterval = 15 * 60 * 1000; // 15 minutes for slow connections
        break;
      case '3g':
        newInterval = 10 * 60 * 1000; // 10 minutes for 3G
        break;
      case '4g':
      default:
        newInterval = 5 * 60 * 1000; // 5 minutes for good connections
        break;
    }
    
    if (newInterval !== this.config.syncInterval) {
      this.config.syncInterval = newInterval;
      console.log(`Adjusted sync interval to ${newInterval / 60000} minutes based on connection: ${effectiveType}`);
    }
  }

  // Check for different types of pending data
  private async hasCriticalPendingData(): Promise<boolean> {
    try {
      const criticalOps = await offlineCacheService.getSyncQueue('critical');
      return criticalOps.length > 0;
    } catch {
      return false;
    }
  }

  private async hasActiveJobsData(): Promise<boolean> {
    try {
      const activeJobs = await offlineCacheService.getCachedJobs({
        status: ['active', 'in-progress'],
        priority: 'critical'
      });
      return activeJobs.length > 0;
    } catch {
      return false;
    }
  }

  private async hasMaterialUpdates(): Promise<boolean> {
    try {
      const pendingMaterials = await offlineCacheService.getSyncQueue('important');
      return pendingMaterials.some(op => op.entityType === 'material');
    } catch {
      return false;
    }
  }

  private async hasPendingPhotos(): Promise<boolean> {
    try {
      // Check for cached photos that haven't been uploaded
      const metadata = await offlineCacheService.getCacheMetadata('pendingPhotoUploads');
      return metadata && metadata.length > 0;
    } catch {
      return false;
    }
  }

  // Specialized sync methods for construction data
  private async syncCriticalFieldData(): Promise<void> {
    console.log('Syncing critical field data...');
    
    try {
      // Sync in order of priority for field workers
      await Promise.allSettled([
        this.syncJobStatusUpdates(),
        this.syncMaterialPurchases(),
        this.syncCustomerContacts(),
        this.syncJobAssignments()
      ]);
    } catch (error) {
      console.error('Critical field data sync failed:', error);
      throw error;
    }
  }

  private async syncActiveJobs(): Promise<void> {
    console.log('Syncing active jobs...');
    
    try {
      const activeJobOps = await offlineCacheService.getSyncQueue();
      const jobOps = activeJobOps.filter(op => 
        op.entityType === 'job' && 
        ['active', 'in-progress'].includes(op.payload?.status)
      );

      for (const op of jobOps) {
        await this.processSyncOperation(op);
      }
    } catch (error) {
      console.error('Active jobs sync failed:', error);
      throw error;
    }
  }

  private async syncMaterialUpdates(): Promise<void> {
    console.log('Syncing material updates...');
    
    try {
      const materialOps = await offlineCacheService.getSyncQueue();
      const filteredOps = materialOps.filter(op => op.entityType === 'material');

      // Prioritize needed materials and purchase updates
      const prioritized = filteredOps.sort((a, b) => {
        const aNeeded = a.payload?.needed ? 1 : 0;
        const bNeeded = b.payload?.needed ? 1 : 0;
        return bNeeded - aNeeded;
      });

      for (const op of prioritized) {
        await this.processSyncOperation(op);
      }
    } catch (error) {
      console.error('Material updates sync failed:', error);
      throw error;
    }
  }

  private async syncJobPhotos(): Promise<void> {
    console.log('Syncing job photos...');
    
    try {
      // This would integrate with your photo upload API
      const pendingPhotos = await offlineCacheService.getCacheMetadata('pendingPhotoUploads') || [];
      
      for (const photoId of pendingPhotos) {
        try {
          // Upload photo logic would go here
          await this.uploadJobPhoto(photoId);
          
          // Remove from pending list
          const remaining = pendingPhotos.filter(id => id !== photoId);
          await offlineCacheService.getCacheMetadata('pendingPhotoUploads', remaining);
        } catch (error) {
          console.error(`Failed to upload photo ${photoId}:`, error);
        }
      }
    } catch (error) {
      console.error('Job photos sync failed:', error);
    }
  }

  // Individual sync operations
  private async syncJobStatusUpdates(): Promise<void> {
    const statusOps = await offlineCacheService.getSyncQueue();
    const jobStatusOps = statusOps.filter(op => 
      op.entityType === 'job' && 
      op.operation === 'update' &&
      op.payload?.status
    );

    for (const op of jobStatusOps) {
      await this.processSyncOperation(op);
    }
  }

  private async syncMaterialPurchases(): Promise<void> {
    const materialOps = await offlineCacheService.getSyncQueue();
    const purchaseOps = materialOps.filter(op => 
      op.entityType === 'material' && 
      op.payload?.purchased !== undefined
    );

    for (const op of purchaseOps) {
      await this.processSyncOperation(op);
    }
  }

  private async syncCustomerContacts(): Promise<void> {
    const customerOps = await offlineCacheService.getSyncQueue();
    const contactOps = customerOps.filter(op => op.entityType === 'customer');

    for (const op of contactOps) {
      await this.processSyncOperation(op);
    }
  }

  private async syncJobAssignments(): Promise<void> {
    const jobOps = await offlineCacheService.getSyncQueue();
    const assignmentOps = jobOps.filter(op => 
      op.entityType === 'job' && 
      op.payload?.assignments
    );

    for (const op of assignmentOps) {
      await this.processSyncOperation(op);
    }
  }

  private async processSyncOperation(operation: any): Promise<void> {
    try {
      // Use existing sync service to process the operation
      await syncService.forceSync();
      console.log(`Processed sync operation: ${operation.id}`);
    } catch (error) {
      console.error(`Failed to process sync operation ${operation.id}:`, error);
      throw error;
    }
  }

  private async uploadJobPhoto(photoId: string): Promise<void> {
    // This would implement the actual photo upload logic
    // For now, just simulate success
    console.log(`Uploading photo: ${photoId}`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Photo uploaded successfully: ${photoId}`);
  }

  // Public methods
  async triggerSync(priority?: 'critical' | 'important' | 'normal'): Promise<void> {
    if (!navigator.onLine) {
      console.log('Cannot sync while offline');
      return;
    }

    const strategies = priority 
      ? this.syncStrategies.filter(s => s.priority === priority)
      : this.syncStrategies;

    for (const strategy of strategies) {
      if (strategy.condition()) {
        try {
          await strategy.execute();
        } catch (error) {
          console.error(`Sync strategy ${strategy.name} failed:`, error);
        }
      }
    }
  }

  async scheduleBackgroundSync(tag: string, options?: any): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`Background sync scheduled: ${tag}`);
      } catch (error) {
        console.error(`Failed to schedule background sync: ${tag}`, error);
      }
    }
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Background sync config updated:', this.config);
  }
}

export const backgroundSyncService = new BackgroundSyncService();