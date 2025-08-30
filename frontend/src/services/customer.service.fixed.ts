import { offlineDb } from './db.service';
import { apiClient } from './api.service';
import { simpleSyncService } from './sync.service.simple';

// Types defined inline
interface Customer {
  id: string;
  reference: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  notes: string | null;
  customerType?: 'ACTIVE' | 'LEADS';
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy: string;
  jobs?: any[];
}

interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address: string;
  notes?: string;
  customerType?: 'ACTIVE' | 'LEADS';
}

interface UpdateCustomerRequest {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string;
  notes?: string | null;
  customerType?: 'ACTIVE' | 'LEADS';
}

interface CustomerFilters {
  search?: string;
  isArchived?: boolean;
}

// API endpoints
const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`
};

/**
 * Fixed customer service with proper sync
 */
class CustomerServiceFixed {
  /**
   * Get all customers - always try API first if online
   */
  async getCustomers(customerType?: 'ACTIVE' | 'LEADS' | null, filters?: CustomerFilters): Promise<Customer[]> {
    // If online, fetch from API first
    if (navigator.onLine) {
      try {
        const params = customerType ? `?type=${customerType}` : '';
        const customers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS + params);

        // Save to IndexedDB for offline access
        for (const customer of customers) {
          await offlineDb.saveCustomer(customer);
        }

        return customers;
      } catch (error) {
        console.error('[CustomerService] API fetch failed, falling back to local', error);
      }
    }

    // Offline or API failed - use local data
    const allCustomers = await offlineDb.getCustomers(filters);
    
    // Filter by customer type if specified
    if (customerType) {
      return allCustomers.filter(c => c.customerType === customerType);
    }
    
    return allCustomers;
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer | null> {
    // Try local first for speed
    const local = await offlineDb.getCustomer(id);

    // If online, also fetch from API to ensure freshness
    if (navigator.onLine && !id.startsWith('temp_')) {
      try {
        const customer = await apiClient.get<Customer>(API_ENDPOINTS.CUSTOMER_BY_ID(id));
        await offlineDb.saveCustomer(customer);
        return customer;
      } catch (error) {
        console.error('[CustomerService] API fetch failed for customer', id, error);
      }
    }

    return local;
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    // If online, create directly on server to get real ID
    if (navigator.onLine) {
      try {
        const serverCustomer = await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS, {
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address,
          notes: data.notes || null,
          customerType: data.customerType || 'ACTIVE'
        });

        // Save to local DB for offline access
        await offlineDb.saveCustomer(serverCustomer);

        return serverCustomer;
      } catch (error) {
        console.error('[CustomerService] Failed to create customer on server:', error);
        // Fall through to offline creation
      }
    }

    // Only use temp ID if offline or server creation failed
    const tempId = `temp_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    // Create customer object
    const customer: Customer = {
      id: tempId,
      reference: `TEMP-${Date.now()}`,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address,
      notes: data.notes || null,
      customerType: data.customerType || 'ACTIVE',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'current-user',
      modifiedBy: 'current-user'
    };

    // Save locally
    await offlineDb.saveCustomer(customer);

    // Queue for sync
    await simpleSyncService.queueOperation({
      operation: 'create',
      entityType: 'customer',
      payload: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes
      },
      timestamp: now
    });

    return customer;
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const existing = await offlineDb.getCustomer(id);
    if (!existing) {
      throw new Error('Customer not found');
    }

    // Update customer
    const updated: Customer = {
      ...existing,
      ...data,
      updatedAt: new Date(),
      modifiedBy: 'current-user'     };

    // Save locally
    await offlineDb.saveCustomer(updated);
    // Queue for sync if not a temp ID
    if (!id.startsWith('temp_')) {
      await simpleSyncService.queueOperation({
        operation: 'update',
        entityType: 'customer',
        entityId: id,
        payload: data,
        timestamp: new Date()
      });

      // Try immediate sync if online
      if (navigator.onLine) {
        simpleSyncService.syncAll();
      }
    }

    return updated;
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    // Delete locally
    await offlineDb.deleteCustomer(id);
    // Queue for sync if not a temp ID
    if (!id.startsWith('temp_')) {
      await simpleSyncService.queueOperation({
        operation: 'delete',
        entityType: 'customer',
        entityId: id,
        payload: {},
        timestamp: new Date()
      });

      // Try immediate sync if online
      if (navigator.onLine) {
        simpleSyncService.syncAll();
      }
    }
  }

  /**
   * Force refresh from server
   */
  async refreshFromServer(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot refresh - device is offline');
    }

    try {
      const customers = await apiClient.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);

      // Clear local data
      const localCustomers = await offlineDb.getCustomers();
      for (const customer of localCustomers) {
        if (!customer.id.startsWith('temp_')) {
          await offlineDb.deleteCustomer(customer.id);
        }
      }

      // Save fresh data
      for (const customer of customers) {
        await offlineDb.saveCustomer(customer);
      }

      } catch (error) {
      console.error('[CustomerService] Failed to refresh from server', error);
      throw error;
    }
  }
}

export const customerServiceFixed = new CustomerServiceFixed();