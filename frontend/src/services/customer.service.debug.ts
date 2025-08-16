import { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerFilters } from '@khs-crm/types';
import { optimisticUpdatesService } from './optimistic-updates.service';
import { offlineDataService } from './offline-data.service';
import { apiClient } from './api.service';
import { API_ENDPOINTS } from '@khs-crm/constants';
import { offlineDb } from './db.service';
import { syncService } from './sync.service';

/**
 * Debug version of customer service with extensive logging
 */
class CustomerServiceDebug {
  private log(action: string, data?: any) {
    console.log(`[CustomerService] ${action}`, data || '');
  }

  /**
   * Get all customers with optional filters
   */
  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    this.log('getCustomers called', { filters, online: navigator.onLine });
    
    // Check what's in IndexedDB
    const dbCustomers = await offlineDb.getCustomers(filters);
    this.log('IndexedDB customers', { count: dbCustomers.length, customers: dbCustomers });
    
    // Try to fetch from API if online
    if (navigator.onLine) {
      try {
        this.log('Fetching from API...');
        const apiResponse = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);
        this.log('API response', { count: apiResponse.length, customers: apiResponse });
        
        // Save to IndexedDB
        for (const customer of apiResponse) {
          await offlineDb.saveCustomer(customer);
        }
        this.log('Saved API data to IndexedDB');
        
        return apiResponse;
      } catch (error) {
        this.log('API fetch failed', error);
      }
    }
    
    // Fall back to offline data service
    const customers = await offlineDataService.getCustomers(filters);
    this.log('Returning customers', { count: customers.length, source: 'offlineDataService' });
    return customers;
  }

  /**
   * Create a new customer with optimistic updates
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    this.log('createCustomer called', { data, online: navigator.onLine });
    
    // Check sync queue before creating
    const pendingOps = await syncService.getPendingOperations();
    this.log('Pending sync operations', pendingOps);
    
    // Create with optimistic updates
    const customer = await optimisticUpdatesService.createCustomer(data);
    this.log('Customer created optimistically', customer);
    
    // Check if it was queued for sync
    const newPendingOps = await syncService.getPendingOperations();
    this.log('Pending operations after create', newPendingOps);
    
    // Try immediate sync if online
    if (navigator.onLine) {
      this.log('Attempting immediate sync...');
      try {
        const syncResult = await syncService.sync();
        this.log('Sync result', syncResult);
      } catch (error) {
        this.log('Sync failed', error);
      }
    }
    
    // Invalidate related caches
    offlineDataService.invalidateCache('customer');
    
    return customer;
  }

  /**
   * Update an existing customer with optimistic updates
   */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    this.log('updateCustomer called', { id, data, online: navigator.onLine });
    
    const customer = await optimisticUpdatesService.updateCustomer(id, data);
    this.log('Customer updated optimistically', customer);
    
    // Try immediate sync if online
    if (navigator.onLine) {
      this.log('Attempting immediate sync...');
      try {
        const syncResult = await syncService.sync();
        this.log('Sync result', syncResult);
      } catch (error) {
        this.log('Sync failed', error);
      }
    }
    
    // Invalidate related caches
    offlineDataService.invalidateCache('customer', id);
    
    return customer;
  }

  /**
   * Delete a customer with optimistic updates
   */
  async deleteCustomer(id: string): Promise<void> {
    this.log('deleteCustomer called', { id, online: navigator.onLine });
    
    await optimisticUpdatesService.deleteCustomer(id);
    this.log('Customer deleted optimistically');
    
    // Try immediate sync if online
    if (navigator.onLine) {
      this.log('Attempting immediate sync...');
      try {
        const syncResult = await syncService.sync();
        this.log('Sync result', syncResult);
      } catch (error) {
        this.log('Sync failed', error);
      }
    }
    
    // Invalidate related caches
    offlineDataService.invalidateCache('customer', id);
  }

  /**
   * Force sync all data
   */
  async forceSync(): Promise<void> {
    this.log('Force sync initiated');
    
    // Get all local customers
    const localCustomers = await offlineDb.getCustomers();
    this.log('Local customers', { count: localCustomers.length });
    
    // Get all pending operations
    const pendingOps = await syncService.getPendingOperations();
    this.log('Pending operations', pendingOps);
    
    // Force sync
    if (navigator.onLine) {
      try {
        const syncResult = await syncService.sync();
        this.log('Force sync completed', syncResult);
        
        // Fetch fresh data from API
        const apiCustomers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);
        this.log('Fresh API data', { count: apiCustomers.length });
        
        // Clear and repopulate IndexedDB
        for (const customer of apiCustomers) {
          await offlineDb.saveCustomer(customer);
        }
        this.log('IndexedDB refreshed with API data');
      } catch (error) {
        this.log('Force sync failed', error);
      }
    } else {
      this.log('Cannot sync - device is offline');
    }
  }

  /**
   * Debug method to check data consistency
   */
  async checkDataConsistency(): Promise<{
    localCount: number;
    pendingOperations: number;
    isOnline: boolean;
    lastSyncTime?: Date;
  }> {
    const localCustomers = await offlineDb.getCustomers();
    const pendingOps = await syncService.getPendingOperations();
    const syncStatus = syncService.getSyncStatus();
    
    const result = {
      localCount: localCustomers.length,
      pendingOperations: pendingOps.length,
      isOnline: navigator.onLine,
      lastSyncTime: syncStatus.lastSyncTime
    };
    
    this.log('Data consistency check', result);
    return result;
  }
}

export const customerServiceDebug = new CustomerServiceDebug();