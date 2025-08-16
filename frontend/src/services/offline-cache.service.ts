import { openDB, DBSchema, IDBPDatabase } from 'idb';
// Inline type definitions
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

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
}

interface Material {
  id: string;
  name: string;
  description?: string;
  unit: string;
  cost: number;
  supplier?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'job' | 'material' | 'user';
  entityId?: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
}

interface CacheMetadata {
  lastUpdated: string;
  priority: 'critical' | 'important' | 'normal';
  expiresAt?: string;
  version: number;
}

interface OfflineCache extends DBSchema {
  // Core construction data
  jobs: {
    key: string;
    value: Job & { _metadata: CacheMetadata };
    indexes: {
      'by-status': string;
      'by-priority': string;
      'by-assigned-user': string;
      'by-customer': string;
      'by-date': string;
    };
  };
  customers: {
    key: string;
    value: Customer & { _metadata: CacheMetadata };
    indexes: {
      'by-name': string;
      'by-active': number;
      'by-priority': string;
    };
  };
  materials: {
    key: string;
    value: Material & { _metadata: CacheMetadata };
    indexes: {
      'by-job': string;
      'by-needed': number;
      'by-priority': string;
    };
  };
  
  // Field-specific caches
  jobPhotos: {
    key: string;
    value: {
      id: string;
      jobId: string;
      photoData: ArrayBuffer;
      filename: string;
      timestamp: string;
      _metadata: CacheMetadata;
    };
    indexes: {
      'by-job': string;
      'by-timestamp': string;
    };
  };
  
  jobNotes: {
    key: string;
    value: {
      id: string;
      jobId: string;
      note: string;
      timestamp: string;
      userId: string;
      _metadata: CacheMetadata;
    };
    indexes: {
      'by-job': string;
      'by-user': string;
      'by-timestamp': string;
    };
  };
  
  // Offline operations queue
  syncQueue: {
    key: string;
    value: SyncOperation & { 
      retryCount: number;
      lastAttempt?: string;
      _metadata: CacheMetadata;
    };
    indexes: {
      'by-priority': string;
      'by-timestamp': string;
      'by-retry-count': number;
    };
  };
  
  // App metadata
  cacheMetadata: {
    key: string;
    value: any;
  };
}

class OfflineCacheService {
  private db: IDBPDatabase<OfflineCache> | null = null;
  private readonly DB_NAME = 'khs-crm-field-cache';
  private readonly DB_VERSION = 2;
  private readonly CACHE_PRIORITIES = {
    ACTIVE_JOBS: 'critical' as const,
    TODAY_JOBS: 'critical' as const,
    ASSIGNED_JOBS: 'important' as const,
    ACTIVE_CUSTOMERS: 'important' as const,
    NEEDED_MATERIALS: 'critical' as const,
    JOB_PHOTOS: 'important' as const,
    JOB_NOTES: 'important' as const,
    COMPLETED_JOBS: 'normal' as const,
    ARCHIVED_DATA: 'normal' as const
  };

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<OfflineCache>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading offline cache from version ${oldVersion} to ${newVersion}`);

        // Jobs store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('by-status', 'status');
          jobStore.createIndex('by-priority', '_metadata.priority');
          jobStore.createIndex('by-assigned-user', 'assignments.userId');
          jobStore.createIndex('by-customer', 'customerId');
          jobStore.createIndex('by-date', 'startDate');
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by-name', 'name');
          customerStore.createIndex('by-active', 'isArchived');
          customerStore.createIndex('by-priority', '_metadata.priority');
        }

        // Materials store
        if (!db.objectStoreNames.contains('materials')) {
          const materialStore = db.createObjectStore('materials', { keyPath: 'id' });
          materialStore.createIndex('by-job', 'jobId');
          materialStore.createIndex('by-needed', 'needed');
          materialStore.createIndex('by-priority', '_metadata.priority');
        }

        // Job photos store (new in v2)
        if (!db.objectStoreNames.contains('jobPhotos')) {
          const photoStore = db.createObjectStore('jobPhotos', { keyPath: 'id' });
          photoStore.createIndex('by-job', 'jobId');
          photoStore.createIndex('by-timestamp', 'timestamp');
        }

        // Job notes store (new in v2)
        if (!db.objectStoreNames.contains('jobNotes')) {
          const notesStore = db.createObjectStore('jobNotes', { keyPath: 'id' });
          notesStore.createIndex('by-job', 'jobId');
          notesStore.createIndex('by-user', 'userId');
          notesStore.createIndex('by-timestamp', 'timestamp');
        }

        // Enhanced sync queue
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-priority', '_metadata.priority');
          syncStore.createIndex('by-timestamp', 'timestamp');
          syncStore.createIndex('by-retry-count', 'retryCount');
        }

        // Cache metadata
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          db.createObjectStore('cacheMetadata', { keyPath: 'key' });
        }
      },
    });

    // Initialize critical data caching on startup
    await this.initializeCriticalCache();
  }

  private async ensureDb(): Promise<IDBPDatabase<OfflineCache>> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  private createMetadata(priority: 'critical' | 'important' | 'normal', ttl?: number): CacheMetadata {
    const now = new Date().toISOString();
    return {
      lastUpdated: now,
      priority,
      expiresAt: ttl ? new Date(Date.now() + ttl).toISOString() : undefined,
      version: 1
    };
  }

  // Initialize critical data for field workers
  private async initializeCriticalCache(): Promise<void> {
    const db = await this.ensureDb();
    
    try {
      // Mark critical data that should always be available offline
      const criticalJobStatuses = ['active', 'in-progress', 'pending'];
      const today = new Date().toISOString().split('T')[0];

      await Promise.all([
        this.setCacheMetadata('lastCriticalSync', new Date().toISOString()),
        this.setCacheMetadata('fieldWorkerPreferences', {
          preloadTodaysJobs: true,
          preloadAssignedJobs: true,
          preloadActiveMaterials: true,
          maxPhotoCache: 100, // MB
          syncInterval: 300000 // 5 minutes
        })
      ]);
    } catch (error) {
      console.error('Failed to initialize critical cache:', error);
    }
  }

  // Job operations optimized for field work
  async cacheJob(job: Job, priority?: 'critical' | 'important' | 'normal'): Promise<void> {
    const db = await this.ensureDb();
    
    // Determine priority based on job characteristics
    let jobPriority = priority || this.CACHE_PRIORITIES.COMPLETED_JOBS;
    
    const today = new Date().toISOString().split('T')[0];
    const jobDate = new Date(job.startDate || job.createdAt).toISOString().split('T')[0];
    
    if (['active', 'in-progress'].includes(job.status)) {
      jobPriority = this.CACHE_PRIORITIES.ACTIVE_JOBS;
    } else if (jobDate === today) {
      jobPriority = this.CACHE_PRIORITIES.TODAY_JOBS;
    } else if (job.assignments?.some(a => a.userId === this.getCurrentUserId())) {
      jobPriority = this.CACHE_PRIORITIES.ASSIGNED_JOBS;
    }

    const cachedJob = {
      ...job,
      _metadata: this.createMetadata(jobPriority, this.getTTL(jobPriority))
    };

    await db.put('jobs', cachedJob);
  }

  async getCachedJobs(filters?: {
    status?: string[];
    assignedTo?: string;
    priority?: 'critical' | 'important' | 'normal';
    includeExpired?: boolean;
  }): Promise<Job[]> {
    const db = await this.ensureDb();
    let jobs = await db.getAll('jobs');

    // Filter expired data unless explicitly requested
    if (!filters?.includeExpired) {
      jobs = jobs.filter(job => !this.isExpired(job._metadata));
    }

    // Apply filters
    if (filters?.status) {
      jobs = jobs.filter(job => filters.status!.includes(job.status));
    }
    
    if (filters?.assignedTo) {
      jobs = jobs.filter(job => 
        job.assignments?.some(a => a.userId === filters.assignedTo)
      );
    }
    
    if (filters?.priority) {
      jobs = jobs.filter(job => job._metadata.priority === filters.priority);
    }

    // Sort by priority and date
    return jobs
      .sort((a, b) => {
        const priorityOrder = { critical: 3, important: 2, normal: 1 };
        const aPriority = priorityOrder[a._metadata.priority];
        const bPriority = priorityOrder[b._metadata.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.startDate || b.createdAt).getTime() - 
               new Date(a.startDate || a.createdAt).getTime();
      })
      .map(({ _metadata, ...job }) => job);
  }

  // Material operations for field shopping lists
  async cacheMaterials(materials: Material[], jobId: string): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction('materials', 'readwrite');
    
    await Promise.all(
      materials.map(material => {
        const priority = material.needed ? 
          this.CACHE_PRIORITIES.NEEDED_MATERIALS : 
          this.CACHE_PRIORITIES.COMPLETED_JOBS;
          
        const cachedMaterial = {
          ...material,
          jobId,
          _metadata: this.createMetadata(priority, this.getTTL(priority))
        };
        
        return tx.store.put(cachedMaterial);
      })
    );
    
    await tx.done;
  }

  async getCachedMaterials(jobId?: string, onlyNeeded?: boolean): Promise<Material[]> {
    const db = await this.ensureDb();
    
    let materials: Array<Material & { _metadata: CacheMetadata }>;
    
    if (jobId) {
      materials = await db.getAllFromIndex('materials', 'by-job', jobId);
    } else {
      materials = await db.getAll('materials');
    }

    // Filter out expired and apply filters
    materials = materials.filter(material => !this.isExpired(material._metadata));
    
    if (onlyNeeded) {
      materials = materials.filter(material => material.needed);
    }

    return materials
      .sort((a, b) => {
        // Needed materials first, then by priority
        if (a.needed !== b.needed) {
          return a.needed ? -1 : 1;
        }
        
        const priorityOrder = { critical: 3, important: 2, normal: 1 };
        const aPriority = priorityOrder[a._metadata.priority];
        const bPriority = priorityOrder[b._metadata.priority];
        
        return bPriority - aPriority;
      })
      .map(({ _metadata, ...material }) => material);
  }

  // Photo caching for job documentation
  async cacheJobPhoto(jobId: string, photoData: ArrayBuffer, filename: string): Promise<string> {
    const db = await this.ensureDb();
    
    const photoId = `photo_${jobId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const cachedPhoto = {
      id: photoId,
      jobId,
      photoData,
      filename,
      timestamp: new Date().toISOString(),
      _metadata: this.createMetadata(this.CACHE_PRIORITIES.JOB_PHOTOS, 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await db.put('jobPhotos', cachedPhoto);
    
    // Cleanup old photos if we exceed storage limits
    await this.cleanupPhotoCache();
    
    return photoId;
  }

  async getCachedJobPhotos(jobId: string): Promise<Array<{
    id: string;
    photoData: ArrayBuffer;
    filename: string;
    timestamp: string;
  }>> {
    const db = await this.ensureDb();
    const photos = await db.getAllFromIndex('jobPhotos', 'by-job', jobId);
    
    return photos
      .filter(photo => !this.isExpired(photo._metadata))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(({ _metadata, ...photo }) => photo);
  }

  // Sync queue with priority handling
  async addToSyncQueue(operation: Omit<SyncOperation, 'id'>, priority: 'critical' | 'important' | 'normal' = 'normal'): Promise<void> {
    const db = await this.ensureDb();
    
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const syncOperation = {
      ...operation,
      id,
      retryCount: 0,
      _metadata: this.createMetadata(priority)
    };

    await db.add('syncQueue', syncOperation);
  }

  async getSyncQueue(priority?: 'critical' | 'important' | 'normal'): Promise<SyncOperation[]> {
    const db = await this.ensureDb();
    
    let operations;
    if (priority) {
      operations = await db.getAllFromIndex('syncQueue', 'by-priority', priority);
    } else {
      operations = await db.getAll('syncQueue');
    }

    return operations
      .sort((a, b) => {
        // Critical operations first, then by timestamp
        const priorityOrder = { critical: 3, important: 2, normal: 1 };
        const aPriority = priorityOrder[a._metadata.priority];
        const bPriority = priorityOrder[b._metadata.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      })
      .map(({ _metadata, retryCount, lastAttempt, ...operation }) => operation);
  }

  // Cache maintenance
  async cleanupExpiredCache(): Promise<void> {
    const db = await this.ensureDb();
    const stores = ['jobs', 'customers', 'materials', 'jobPhotos', 'jobNotes'];
    
    for (const storeName of stores) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const cursor = await store.openCursor();
      
      if (cursor) {
        do {
          const value = cursor.value as any;
          if (value._metadata && this.isExpired(value._metadata)) {
            await cursor.delete();
          }
        } while (await cursor.continue());
      }
      
      await tx.done;
    }
  }

  private async cleanupPhotoCache(): Promise<void> {
    const db = await this.ensureDb();
    
    // Check storage usage
    const usage = await this.getStorageUsage();
    const maxPhotoStorage = 100 * 1024 * 1024; // 100MB
    
    if (usage > maxPhotoStorage) {
      // Remove oldest photos first
      const photos = await db.getAllFromIndex('jobPhotos', 'by-timestamp');
      const sortedPhotos = photos.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Remove oldest 20% of photos
      const toRemove = sortedPhotos.slice(0, Math.ceil(photos.length * 0.2));
      
      for (const photo of toRemove) {
        await db.delete('jobPhotos', photo.id);
      }
    }
  }

  // Utility methods
  private isExpired(metadata: CacheMetadata): boolean {
    if (!metadata.expiresAt) return false;
    return new Date(metadata.expiresAt) < new Date();
  }

  private getTTL(priority: 'critical' | 'important' | 'normal'): number {
    switch (priority) {
      case 'critical': return 24 * 60 * 60 * 1000; // 24 hours
      case 'important': return 12 * 60 * 60 * 1000; // 12 hours
      case 'normal': return 6 * 60 * 60 * 1000; // 6 hours
    }
  }

  private getCurrentUserId(): string {
    // This would get the current user ID from your auth system
    return localStorage.getItem('currentUserId') || 'unknown';
  }

  private async getStorageUsage(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  private async setCacheMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDb();
    await db.put('cacheMetadata', { key, value });
  }

  async getCacheMetadata(key: string): Promise<any> {
    const db = await this.ensureDb();
    const result = await db.get('cacheMetadata', key);
    return result?.value;
  }
}

export const offlineCacheService = new OfflineCacheService();