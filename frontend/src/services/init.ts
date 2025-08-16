// Initialize services that need to run on app startup
import { simpleSyncService } from './sync.service.simple';

// This ensures the sync service is instantiated and starts its timers
console.log('[ServiceInit] Initializing services...');

// Export the instance to ensure it's created
export const syncServiceInstance = simpleSyncService;

// Log sync status on startup
setTimeout(() => {
  const status = simpleSyncService.getSyncStatus();
  console.log('[ServiceInit] Initial sync status:', status);
}, 1000);