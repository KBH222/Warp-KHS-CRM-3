// Team Sync Service - Simple file-based sync for small teams
import { toast } from 'react-toastify';

interface TeamSyncConfig {
  teamName: string;
  syncMethod: 'manual' | 'auto';
  conflictResolution: 'newest' | 'merge' | 'ask';
}

export class TeamSyncService {
  private config: TeamSyncConfig = {
    teamName: 'KHS Team',
    syncMethod: 'manual',
    conflictResolution: 'newest'
  };

  // Create a shareable sync package
  async createSyncPackage(): Promise<Blob> {
    const syncData = {
      version: '2.0',
      team: this.config.teamName,
      timestamp: new Date().toISOString(),
      deviceId: this.getDeviceId(),
      data: {
        customers: JSON.parse(localStorage.getItem('khs-crm-customers') || '[]'),
        jobs: JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]'),
        workers: JSON.parse(localStorage.getItem('khs-crm-workers') || '[]'),
        materials: JSON.parse(localStorage.getItem('khs-crm-materials') || '[]'),
        invoices: JSON.parse(localStorage.getItem('khs-crm-invoices') || '[]'),
      },
      metadata: {
        customerCount: JSON.parse(localStorage.getItem('khs-crm-customers') || '[]').length,
        jobCount: JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]').length,
        lastModified: new Date().toISOString()
      }
    };

    const jsonData = JSON.stringify(syncData, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  // Merge incoming data with local data
  async mergeData(incomingData: any): Promise<void> {
    try {
      // Simple merge strategy - combine arrays and remove duplicates by ID
      const mergeArrays = (local: any[], incoming: any[], idField = 'id') => {
        const combined = [...local, ...incoming];
        const unique = new Map();
        
        combined.forEach(item => {
          const existing = unique.get(item[idField]);
          if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
            unique.set(item[idField], item);
          }
        });
        
        return Array.from(unique.values());
      };

      // Merge each data type
      const localCustomers = JSON.parse(localStorage.getItem('khs-crm-customers') || '[]');
      const mergedCustomers = mergeArrays(localCustomers, incomingData.data.customers || []);
      localStorage.setItem('khs-crm-customers', JSON.stringify(mergedCustomers));

      const localJobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
      const mergedJobs = mergeArrays(localJobs, incomingData.data.jobs || []);
      localStorage.setItem('khs-crm-jobs', JSON.stringify(mergedJobs));

      const localWorkers = JSON.parse(localStorage.getItem('khs-crm-workers') || '[]');
      const mergedWorkers = mergeArrays(localWorkers, incomingData.data.workers || []);
      localStorage.setItem('khs-crm-workers', JSON.stringify(mergedWorkers));

      const localMaterials = JSON.parse(localStorage.getItem('khs-crm-materials') || '[]');
      const mergedMaterials = mergeArrays(localMaterials, incomingData.data.materials || []);
      localStorage.setItem('khs-crm-materials', JSON.stringify(mergedMaterials));

      const localInvoices = JSON.parse(localStorage.getItem('khs-crm-invoices') || '[]');
      const mergedInvoices = mergeArrays(localInvoices, incomingData.data.invoices || []);
      localStorage.setItem('khs-crm-invoices', JSON.stringify(mergedInvoices));

      // Update sync timestamp
      localStorage.setItem('khs-crm-last-sync', new Date().toISOString());
      
      toast.success(`Data merged successfully from ${incomingData.deviceId || 'another device'}`);
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge data');
    }
  }

  // Get unique device identifier
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('khs-crm-device-id');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('khs-crm-device-id', deviceId);
    }
    return deviceId;
  }

  // Export for OneDrive/Dropbox
  async exportForCloudSync(): Promise<void> {
    const blob = await this.createSyncPackage();
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `KHS-CRM-Sync-${date}-${time}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(a.href);
  }

  // Import from file
  async importFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate sync file
      if (!data.version || !data.data) {
        toast.error('Invalid sync file format');
        return false;
      }

      // Show sync info
      toast.info(`Syncing data from ${data.deviceId || 'unknown device'} (${new Date(data.timestamp).toLocaleString()})`);
      
      // Merge the data
      await this.mergeData(data);
      
      return true;
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import sync file');
      return false;
    }
  }
}

export const teamSync = new TeamSyncService();