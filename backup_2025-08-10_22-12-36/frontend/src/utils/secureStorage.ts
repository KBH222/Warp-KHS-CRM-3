// Secure Storage Utility with Async Encryption Support
// This replaces sync localStorage for sensitive data

import { DataClassification } from '../services/localStorageService';
import { auditService } from '../services/auditService';
import { encryptionService, needsEncryption } from '../services/encryptionService';

const STORAGE_KEYS = {
  CUSTOMERS: 'khs_crm_customers',
  JOBS: 'khs_crm_jobs',
  MATERIALS: 'khs_crm_materials',
  PROFILE: 'khs_crm_profile',
  CALENDAR_JOBS: 'khs_crm_calendar_jobs',
  WORKERS: 'khs_crm_workers',
};

// Data classifications for security
const DATA_CLASSIFICATIONS: Record<string, DataClassification> = {
  [STORAGE_KEYS.CUSTOMERS]: DataClassification.RESTRICTED,
  [STORAGE_KEYS.JOBS]: DataClassification.INTERNAL,
  [STORAGE_KEYS.MATERIALS]: DataClassification.PUBLIC,
  [STORAGE_KEYS.PROFILE]: DataClassification.CONFIDENTIAL,
  [STORAGE_KEYS.CALENDAR_JOBS]: DataClassification.INTERNAL,
  [STORAGE_KEYS.WORKERS]: DataClassification.CONFIDENTIAL,
};

// Async storage functions with encryption support
export const secureStorage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return defaultValue;
      }
      
      const parsed = JSON.parse(item);
      
      // Handle legacy data without metadata
      if (!parsed.metadata) {
        return parsed as T;
      }
      
      // Decrypt if needed
      if (parsed.metadata.encrypted && encryptionService.isReady()) {
        const classification = parsed.metadata.classification || DataClassification.INTERNAL;
        const decrypted = await encryptionService.decrypt(parsed.data, classification);
        return decrypted as T;
      }
      
      return parsed.data as T;
    } catch (error) {
      console.error(`Error reading from secure storage for key ${key}:`, error);
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const classification = DATA_CLASSIFICATIONS[key] || DataClassification.INTERNAL;
      
      // Encrypt if needed
      let dataToStore: unknown = value;
      let isEncrypted = false;
      
      if (needsEncryption(classification) && encryptionService.isReady()) {
        dataToStore = await encryptionService.encrypt(value, classification);
        isEncrypted = true;
      }
      
      const storageData = {
        data: dataToStore,
        metadata: {
          classification,
          lastModified: new Date().toISOString(),
          version: 1,
          encrypted: isEncrypted,
        },
      };
      
      localStorage.setItem(key, JSON.stringify(storageData));
      
      // Trigger storage event for cross-tab sync
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error(`Error writing to secure storage for key ${key}:`, error);
      throw error;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error(`Error removing from secure storage for key ${key}:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      for (const key of Object.values(STORAGE_KEYS)) {
        localStorage.removeItem(key);
      }
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  },
};

// Worker-specific functions with encryption
export const workerSecureStorage = {
  async getAll(): Promise<unknown[]> {
    const data = await secureStorage.get(STORAGE_KEYS.WORKERS, []);
    auditService.logAccess('read', 'workers', DataClassification.CONFIDENTIAL, { count: (data as unknown[]).length });
    return data;
  },

  async save(workers: unknown[]): Promise<void> {
    await secureStorage.set(STORAGE_KEYS.WORKERS, workers);
    auditService.logAccess('write', 'workers', DataClassification.CONFIDENTIAL, { count: workers.length });
  },

  clear(): void {
    secureStorage.remove(STORAGE_KEYS.WORKERS);
    auditService.logAccess('delete', 'workers', DataClassification.CONFIDENTIAL);
  },
};

// Profile-specific functions with encryption
export const profileSecureStorage = {
  async get(): Promise<unknown | null> {
    const data = await secureStorage.get(STORAGE_KEYS.PROFILE, null);
    auditService.logAccess('read', 'profile', DataClassification.CONFIDENTIAL);
    return data;
  },

  async save(profile: unknown): Promise<void> {
    await secureStorage.set(STORAGE_KEYS.PROFILE, profile);
    auditService.logAccess('write', 'profile', DataClassification.CONFIDENTIAL);
  },

  clear(): void {
    secureStorage.remove(STORAGE_KEYS.PROFILE);
    auditService.logAccess('delete', 'profile', DataClassification.CONFIDENTIAL);
  },
};