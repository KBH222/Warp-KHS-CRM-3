/**
 * Service Layer Index
 * 
 * This file exports all the service modules for the KHS CRM application.
 * Services provide the business logic and data access layer for the application.
 */

// Core services
export { apiClient } from './api.service';
// Temporarily use simple version to avoid initialization errors
export { offlineDb } from './db.service.simple';
// export { offlineDb } from './db.service';
export { syncService } from './sync.service';

// Offline-first services
export { offlineAuthService } from './offline-auth.service';
export { offlineDataService } from './offline-data.service';
export { optimisticUpdatesService } from './optimistic-updates.service';

// Import for internal use
import { offlineDb } from './db.service.simple';
import { syncService } from './sync.service';
import { offlineAuthService } from './offline-auth.service';
import { offlineDataService } from './offline-data.service';

// Entity services
export { customerService } from './customer.service';
export { jobService } from './job.service';
export { materialService } from './material.service';

// Background services (if they exist)
export * from './background-sync.service';
export * from './offline-cache.service';

/**
 * Service initialization function
 * Call this once when the app starts to initialize all services
 */
export const initializeServices = async (): Promise<void> => {
  // Simplified initialization - skip complex services for now
  // [SERVICES] Using simplified initialization
  return Promise.resolve();
};

/**
 * Service cleanup function
 * Call this when the app is shutting down
 */
export const cleanupServices = (): void => {
  // [SERVICES] Cleanup skipped - using simplified services
};