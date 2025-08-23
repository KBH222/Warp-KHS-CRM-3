// Initialize services that need to run on app startup
// TEMPORARILY DISABLED TO FIX 2-SECOND REFRESH ISSUE
// import { simpleSyncService } from './sync.service.simple';
// import { enhancedSyncService } from './sync.service.enhanced';

// This ensures the sync service is instantiated and starts its timers
console.log('[ServiceInit] Services initialization DISABLED to fix refresh issue');

// Export the instance to ensure it's created
// export const syncServiceInstance = simpleSyncService;
// export const enhancedSyncInstance = enhancedSyncService;

// Log sync status on startup
// setTimeout(() => {
//   const status = enhancedSyncService.getSyncStatus();
//   console.log('[ServiceInit] Enhanced sync status:', status);
// }, 1000);