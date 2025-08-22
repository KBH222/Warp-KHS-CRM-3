// Initialize services that need to run on app startup
import { simpleSyncService } from './sync.service.simple';
import { enhancedSyncService } from './sync.service.enhanced';

// This ensures the sync service is instantiated and starts its timers
console.log('[ServiceInit] Initializing services...');

// Export the instance to ensure it's created
export const syncServiceInstance = simpleSyncService;
export const enhancedSyncInstance = enhancedSyncService;

// Log sync status on startup
setTimeout(() => {
  const status = enhancedSyncService.getSyncStatus();
  console.log('[ServiceInit] Enhanced sync status:', status);
}, 1000);