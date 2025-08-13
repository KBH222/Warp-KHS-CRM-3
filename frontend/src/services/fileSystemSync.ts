// File System Sync Service - Works with OneDrive, Dropbox, or any synced folder
import { toast } from 'react-toastify';

interface SyncConfig {
  syncFolderPath?: string;
  autoSync: boolean;
  syncInterval: number; // minutes
}

class FileSystemSyncService {
  private config: SyncConfig;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      autoSync: true,
      syncInterval: 5 // 5 minutes
    };
  }

  // Save data to a JSON file that OneDrive/Dropbox will automatically sync
  async saveToSyncFolder(data: any, filename: string): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const jsonData = JSON.stringify(data, null, 2);
      
      // Create a blob and download it to user's Downloads folder
      // User can then move it to their OneDrive folder
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `khs-crm-${filename}-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Data exported to ${a.download}`);
      toast.info('Move this file to your OneDrive/Dropbox folder to sync');
      
      return true;
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
      return false;
    }
  }

  // Import data from a file
  async importFromFile(file: File): Promise<any> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      toast.success('Data imported successfully');
      return data;
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
      return null;
    }
  }

  // Export all CRM data
  async exportAllData(): Promise<void> {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      customers: JSON.parse(localStorage.getItem('khs-crm-customers') || '[]'),
      jobs: JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]'),
      workers: JSON.parse(localStorage.getItem('khs-crm-workers') || '[]'),
      materials: JSON.parse(localStorage.getItem('khs-crm-materials') || '[]'),
      invoices: JSON.parse(localStorage.getItem('khs-crm-invoices') || '[]')
    };

    await this.saveToSyncFolder(exportData, 'full-backup');
  }

  // Export specific data type
  async exportData(dataType: string): Promise<void> {
    const data = JSON.parse(localStorage.getItem(`khs-crm-${dataType}`) || '[]');
    await this.saveToSyncFolder({ [dataType]: data }, dataType);
  }

  // Create automated backup
  startAutoBackup(): void {
    if (this.config.autoSync && !this.syncTimer) {
      // Initial backup
      this.exportAllData();
      
      // Set up recurring backup
      this.syncTimer = setInterval(() => {
        this.exportAllData();
      }, this.config.syncInterval * 60 * 1000);
      
      toast.info(`Auto-backup started (every ${this.config.syncInterval} minutes)`);
    }
  }

  stopAutoBackup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      toast.info('Auto-backup stopped');
    }
  }
}

export const fileSystemSync = new FileSystemSyncService();