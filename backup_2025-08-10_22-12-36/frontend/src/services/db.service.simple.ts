/**
 * Simplified Offline Database Service
 * A minimal implementation that won't cause initialization errors
 */

class SimpleOfflineDatabase {
  private dbName = 'khs-crm-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      // Only initialize if IndexedDB is available
      if (!('indexedDB' in window)) {
        console.warn('[DB] IndexedDB not available in this browser');
        return;
      }

      // Simple initialization without complex schema
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('[DB] Failed to open database');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('[DB] Database opened successfully');
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create basic object stores
        const stores = ['customers', 'jobs', 'materials', 'users', 'syncQueue'];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      // Wait for initialization to complete
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error('Failed to open database'));
        setTimeout(resolve, 1000); // Timeout after 1 second
      });

    } catch (error) {
      console.error('[DB] Initialization error:', error);
      // Don't throw - let the app continue
    }
  }

  // Simple getter that returns empty data if DB not available
  async get(storeName: string, id: string): Promise<any> {
    if (!this.db) return undefined;
    
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[DB] Error getting ${id} from ${storeName}:`, error);
      return undefined;
    }
  }

  // Simple setter that fails silently if DB not available
  async put(storeName: string, data: any): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(data);
    } catch (error) {
      console.error(`[DB] Error putting data in ${storeName}:`, error);
    }
  }
}

export const offlineDb = new SimpleOfflineDatabase();