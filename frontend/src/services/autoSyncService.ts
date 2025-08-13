// Auto-sync service for KHS CRM
// Connects to your InMotion Hosting sync server

const SYNC_SERVER_URL = 'https://kenhawk.biz/crm-sync/';
const AUTH_TOKEN = 'khs-sync-2024-secure-token'; // TODO: Change this to match your server token!

export interface SyncData {
  customers: any[];
  jobs: any[];
  workers: any[];
  materials: any[];
  timestamp: string;
  deviceId: string;
}

class AutoSyncService {
  private isOnline = navigator.onLine;

  constructor() {
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.checkForUpdates();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Upload sync data to server
  async uploadSync(data: SyncData): Promise<boolean> {
    if (!this.isOnline) {
      console.log('Offline - sync postponed');
      return false;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}?action=upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': AUTH_TOKEN
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Sync uploaded:', result);
      
      // Update last sync time
      localStorage.setItem('khs-crm-last-sync', new Date().toISOString());
      
      return true;
    } catch (error) {
      console.error('Sync upload failed:', error);
      return false;
    }
  }

  // Download latest sync from server
  async downloadLatestSync(): Promise<SyncData | null> {
    if (!this.isOnline) {
      console.log('Offline - cannot check for updates');
      return null;
    }

    try {
      const response = await fetch(`${SYNC_SERVER_URL}?action=latest`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': AUTH_TOKEN
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        console.log('No sync data available yet');
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Sync download failed:', error);
      return null;
    }
  }

  // Check if we need to sync
  async checkForUpdates(): Promise<boolean> {
    const lastSync = localStorage.getItem('khs-crm-last-sync');
    const serverData = await this.downloadLatestSync();
    
    if (!serverData) {
      return false;
    }

    // Compare timestamps
    const serverTime = new Date(serverData.timestamp).getTime();
    const localTime = lastSync ? new Date(lastSync).getTime() : 0;
    
    return serverTime > localTime;
  }

  // Prepare local data for sync
  prepareLocalData(): SyncData {
    const deviceId = localStorage.getItem('khs-device-id') || this.generateDeviceId();
    
    return {
      customers: JSON.parse(localStorage.getItem('khs-crm-customers') || '[]'),
      jobs: JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]'),
      workers: JSON.parse(localStorage.getItem('khs-crm-workers') || '[]'),
      materials: JSON.parse(localStorage.getItem('khs-crm-materials') || '[]'),
      timestamp: new Date().toISOString(),
      deviceId: deviceId
    };
  }

  // Apply sync data to local storage
  applySyncData(data: SyncData): void {
    localStorage.setItem('khs-crm-customers', JSON.stringify(data.customers));
    localStorage.setItem('khs-crm-jobs', JSON.stringify(data.jobs));
    localStorage.setItem('khs-crm-workers', JSON.stringify(data.workers));
    localStorage.setItem('khs-crm-materials', JSON.stringify(data.materials));
    localStorage.setItem('khs-crm-last-sync', data.timestamp);
  }

  // Generate unique device ID
  private generateDeviceId(): string {
    const id = 'device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('khs-device-id', id);
    return id;
  }

  // Auto-sync on startup
  async autoSyncOnStartup(): Promise<boolean> {
    const autoSyncEnabled = localStorage.getItem('khs-crm-auto-sync') === 'true';
    
    if (!autoSyncEnabled || !this.isOnline) {
      return false;
    }

    const hasUpdates = await this.checkForUpdates();
    if (hasUpdates) {
      const serverData = await this.downloadLatestSync();
      if (serverData) {
        this.applySyncData(serverData);
        return true;
      }
    }
    
    return false;
  }
}

export const autoSyncService = new AutoSyncService();