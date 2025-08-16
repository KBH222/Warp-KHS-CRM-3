// Inline type definitions
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address: string;
}

interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  isArchived?: boolean;
}

interface CustomerFilters {
  search?: string;
  isArchived?: boolean;
}
import { optimisticUpdatesService } from './optimistic-updates.service';
import { offlineDataService } from './offline-data.service';

/**
 * Enhanced customer service with optimistic updates and offline capabilities
 */
class CustomerService {
  /**
   * Get all customers with optional filters
   */
  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    return offlineDataService.getCustomers(filters);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer | null> {
    return offlineDataService.getCustomer(id);
  }

  /**
   * Create a new customer with optimistic updates
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const customer = await optimisticUpdatesService.createCustomer(data);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('customer');
    
    return customer;
  }

  /**
   * Update an existing customer with optimistic updates
   */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const customer = await optimisticUpdatesService.updateCustomer(id, data);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('customer', id);
    
    return customer;
  }

  /**
   * Delete a customer with optimistic updates
   */
  async deleteCustomer(id: string): Promise<void> {
    await optimisticUpdatesService.deleteCustomer(id);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('customer', id);
  }

  /**
   * Get customer with their jobs
   */
  async getCustomerWithJobs(id: string): Promise<(Customer & { jobs: any[] }) | null> {
    const customer = await this.getCustomer(id);
    if (!customer) return null;

    const jobs = await offlineDataService.getJobs({ customerId: id });
    
    return {
      ...customer,
      jobs: jobs || [],
    };
  }

  /**
   * Search customers by query
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    return this.getCustomers({ search: query });
  }

  /**
   * Get archived customers
   */
  async getArchivedCustomers(): Promise<Customer[]> {
    return this.getCustomers({ isArchived: true });
  }

  /**
   * Archive/unarchive a customer
   */
  async toggleCustomerArchive(id: string): Promise<Customer> {
    const customer = await this.getCustomer(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.updateCustomer(id, {
      isArchived: !customer.isArchived,
    });
  }

  /**
   * Validate customer data
   */
  validateCustomerData(data: Partial<CreateCustomerRequest>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.address || data.address.trim().length === 0) {
      errors.push('Address is required');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Invalid phone format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Helper method to validate email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper method to validate phone number
   */
  private isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone; // Return original if can't format
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    archived: number;
    recentlyAdded: number;
  }> {
    const [allCustomers, recentData] = await Promise.all([
      this.getCustomers(),
      offlineDataService.getRecentlyModified(24), // Last 24 hours
    ]);

    const active = allCustomers.filter(c => !c.isArchived);
    const archived = allCustomers.filter(c => c.isArchived);

    return {
      total: allCustomers.length,
      active: active.length,
      archived: archived.length,
      recentlyAdded: recentData.customers.length,
    };
  }
}

export const customerService = new CustomerService();