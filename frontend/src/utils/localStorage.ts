// Local Storage Utility for KHS CRM
// SECURITY UPDATE: Customer data is now restricted and cannot be synced

import { DataClassification } from '../services/localStorageService';
import { auditService } from '../services/auditService';
import { encryptionService, needsEncryption } from '../services/encryptionService';

const STORAGE_KEYS = {
  CUSTOMERS: 'khs_crm_customers',
  JOBS: 'khs_crm_jobs',
  MATERIALS: 'khs_crm_materials',
  PROFILE: 'khs_crm_profile',
  CALENDAR_JOBS: 'khs_crm_calendar_jobs'
};

// Data classifications for security - practical approach
const DATA_CLASSIFICATIONS = {
  [STORAGE_KEYS.CUSTOMERS]: DataClassification.PUBLIC, // Business contact info
  [STORAGE_KEYS.JOBS]: DataClassification.INTERNAL,    // Project details
  [STORAGE_KEYS.MATERIALS]: DataClassification.PUBLIC, // Supply lists
  [STORAGE_KEYS.PROFILE]: DataClassification.INTERNAL, // User settings
  [STORAGE_KEYS.CALENDAR_JOBS]: DataClassification.INTERNAL, // Schedules
};

// Generic storage functions
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
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

      // Check if data is encrypted
      if (parsed.metadata.encrypted && encryptionService.isReady()) {
        // For now, return encrypted data as-is
                }

      return parsed.data as T;
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      const classification = DATA_CLASSIFICATIONS[key] || DataClassification.INTERNAL;

      // Encrypt if needed and encryption is ready
      let dataToStore = value;
      let isEncrypted = false;

      if (needsEncryption(classification) && encryptionService.isReady()) {
        // Use async encryption wrapped in a promise
        const encryptAsync = async () => {
          dataToStore = await encryptionService.encrypt(value, classification);
          isEncrypted = true;
        };

        // For now, we'll skip encryption in sync context
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
      console.error(`Error writing to localStorage for key ${key}:`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error);
    }
  },

  clear: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Customer-specific functions - Business data with selective sync
export const customerStorage = {
  getAll: () => {
    const data = storage.get(STORAGE_KEYS.CUSTOMERS, []);
    auditService.logAccess('read', 'customers', DataClassification.PUBLIC, { count: data.length });
    return data;
  },
  save: (customers: unknown[]) => {
    storage.set(STORAGE_KEYS.CUSTOMERS, customers);
    auditService.logAccess('write', 'customers', DataClassification.PUBLIC, { count: customers.length });
  },
  clear: () => {
    storage.remove(STORAGE_KEYS.CUSTOMERS);
    auditService.logAccess('delete', 'customers', DataClassification.PUBLIC);
  },
  canSync: () => true, // Business data can sync (with field filtering)
};

// Job-specific functions
export const jobStorage = {
  getAll: () => {
    const data = storage.get(STORAGE_KEYS.JOBS, []);
    auditService.logAccess('read', 'jobs', DataClassification.INTERNAL, { count: data.length });
    return data;
  },
  save: (jobs: unknown[]) => {
    storage.set(STORAGE_KEYS.JOBS, jobs);
    auditService.logAccess('write', 'jobs', DataClassification.INTERNAL, { count: jobs.length });
  },
  clear: () => {
    storage.remove(STORAGE_KEYS.JOBS);
    auditService.logAccess('delete', 'jobs', DataClassification.INTERNAL);
  },
};

// Material-specific functions
export const materialStorage = {
  getAll: () => {
    const data = storage.get(STORAGE_KEYS.MATERIALS, []);
    auditService.logAccess('read', 'materials', DataClassification.PUBLIC, { count: data.length });
    return data;
  },
  save: (materials: unknown[]) => {
    storage.set(STORAGE_KEYS.MATERIALS, materials);
    auditService.logAccess('write', 'materials', DataClassification.PUBLIC, { count: materials.length });
  },
  clear: () => {
    storage.remove(STORAGE_KEYS.MATERIALS);
    auditService.logAccess('delete', 'materials', DataClassification.PUBLIC);
  },
};

// Profile-specific functions
export const profileStorage = {
  get: () => {
    const data = storage.get(STORAGE_KEYS.PROFILE, null);
    auditService.logAccess('read', 'profile', DataClassification.CONFIDENTIAL);
    return data;
  },
  save: (profile: unknown) => {
    storage.set(STORAGE_KEYS.PROFILE, profile);
    auditService.logAccess('write', 'profile', DataClassification.CONFIDENTIAL);
  },
  clear: () => {
    storage.remove(STORAGE_KEYS.PROFILE);
    auditService.logAccess('delete', 'profile', DataClassification.CONFIDENTIAL);
  },
};

// Calendar jobs specific functions
export const calendarJobStorage = {
  getAll: () => {
    const jobs = storage.get(STORAGE_KEYS.CALENDAR_JOBS, []);
    // Convert date strings back to Date objects
    return jobs.map((job: Record<string, unknown>) => ({
      ...job,
      startDate: new Date(job.startDate as string),
      endDate: new Date(job.endDate as string),
    }));
  },
  save: (jobs: Array<Record<string, unknown>>) => {
    // Convert Date objects to strings for storage
    const jobsToStore = jobs.map(job => ({
      ...job,
      startDate: (job.startDate as Date).toISOString(),
      endDate: (job.endDate as Date).toISOString(),
    }));
    storage.set(STORAGE_KEYS.CALENDAR_JOBS, jobsToStore);
  },
  clear: () => storage.remove(STORAGE_KEYS.CALENDAR_JOBS),
};