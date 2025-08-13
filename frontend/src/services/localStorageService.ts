// Local Storage Service - Secure local-only data persistence
// Following BMAD security principles

interface StorageKeys {
  CUSTOMERS: 'khs-crm-customers';
  JOBS: 'khs-crm-jobs';
  WORKERS: 'khs-crm-workers';
  SETTINGS: 'khs-crm-settings';
  LAST_SYNC: 'khs-crm-last-sync';
}

export const STORAGE_KEYS: StorageKeys = {
  CUSTOMERS: 'khs-crm-customers',
  JOBS: 'khs-crm-jobs', 
  WORKERS: 'khs-crm-workers',
  SETTINGS: 'khs-crm-settings',
  LAST_SYNC: 'khs-crm-last-sync'
};

// Data classification for future security features
export enum DataClassification {
  PUBLIC = 'public',        // Can be synced freely
  INTERNAL = 'internal',    // Can be synced within organization
  CONFIDENTIAL = 'confidential', // Requires encryption for sync
  RESTRICTED = 'restricted' // Never sync, local only
}

// Security metadata for stored data
interface SecureStorageMetadata {
  classification: DataClassification;
  lastModified: string;
  version: number;
}

class LocalStorageService {
  // Save data with security metadata
  save<T>(key: string, data: T, classification: DataClassification = DataClassification.RESTRICTED): void {
    try {
      const metadata: SecureStorageMetadata = {
        classification,
        lastModified: new Date().toISOString(),
        version: 1
      };

      const storageData = {
        data,
        metadata
      };

      localStorage.setItem(key, JSON.stringify(storageData));
      
      // Trigger storage event for cross-tab sync
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error(`Failed to save data to ${key}:`, error);
      throw new Error('Failed to save data');
    }
  }

  // Load data with security checks
  load<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Handle legacy data without metadata
      if (!parsed.metadata) {
        // Migrate legacy data to new format
        this.migrateLegacyData(key, parsed);
        return parsed as T;
      }

      return parsed.data as T;
    } catch (error) {
      console.error(`Failed to load data from ${key}:`, error);
      return null;
    }
  }

  // Get metadata for stored data
  getMetadata(key: string): SecureStorageMetadata | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.metadata || null;
    } catch (error) {
      console.error(`Failed to get metadata for ${key}:`, error);
      return null;
    }
  }

  // Check if data can be synced based on classification
  canSync(key: string): boolean {
    const metadata = this.getMetadata(key);
    if (!metadata) return false;

    // For now, only allow syncing of non-customer data
    if (key === STORAGE_KEYS.CUSTOMERS) return false;
    
    return metadata.classification !== DataClassification.RESTRICTED;
  }

  // Migrate legacy data to new secure format
  private migrateLegacyData(key: string, data: any): void {
    // Determine classification based on key
    let classification = DataClassification.INTERNAL;
    if (key === STORAGE_KEYS.CUSTOMERS) {
      classification = DataClassification.RESTRICTED;
    }

    this.save(key, data, classification);
  }

  // Clear specific data
  remove(key: string): void {
    localStorage.removeItem(key);
    window.dispatchEvent(new Event('storage'));
  }

  // Clear all app data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    window.dispatchEvent(new Event('storage'));
  }

  // Get storage size info
  getStorageInfo(): { used: number; available: number } {
    let used = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        used += data.length * 2; // Approximate bytes (UTF-16)
      }
    });

    // Most browsers allow ~10MB for localStorage
    const available = 10 * 1024 * 1024;
    
    return { used, available };
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

// Helper functions for specific data types
export const customerStorage = {
  save: (customers: any[]) => {
    localStorageService.save(STORAGE_KEYS.CUSTOMERS, customers, DataClassification.RESTRICTED);
  },
  
  load: (): any[] => {
    return localStorageService.load(STORAGE_KEYS.CUSTOMERS) || [];
  },

  canSync: (): boolean => {
    return false; // Customers are always restricted
  }
};

export const jobStorage = {
  save: (jobs: any[]) => {
    localStorageService.save(STORAGE_KEYS.JOBS, jobs, DataClassification.INTERNAL);
  },
  
  load: (): any[] => {
    return localStorageService.load(STORAGE_KEYS.JOBS) || [];
  }
};

export const workerStorage = {
  save: (workers: any[]) => {
    localStorageService.save(STORAGE_KEYS.WORKERS, workers, DataClassification.CONFIDENTIAL);
  },
  
  load: (): any[] => {
    return localStorageService.load(STORAGE_KEYS.WORKERS) || [];
  }
};