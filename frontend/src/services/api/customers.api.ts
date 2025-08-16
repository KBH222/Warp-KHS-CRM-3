import { Customer } from '@khs-crm/types';
import { customerServiceFixed } from '../customer.service.fixed';
import { simpleSyncService } from '../sync.service.simple';

// Re-export the fixed customer service methods under the old API interface
export const customersApi = {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    console.log('[CustomersAPI] Getting all customers');
    return customerServiceFixed.getCustomers();
  },

  // Get single customer
  async getById(id: string): Promise<Customer> {
    console.log('[CustomersAPI] Getting customer by ID:', id);
    const customer = await customerServiceFixed.getCustomer(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  },

  // Create customer
  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'modifiedBy' | 'isArchived' | 'reference'>): Promise<Customer> {
    console.log('[CustomersAPI] Creating customer:', customer);
    return customerServiceFixed.createCustomer({
      name: customer.name,
      phone: customer.phone || undefined,
      email: customer.email || undefined,
      address: customer.address,
      notes: customer.notes || undefined
    });
  },

  // Update customer
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    console.log('[CustomersAPI] Updating customer:', id, customer);
    return customerServiceFixed.updateCustomer(id, {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes
    });
  },

  // Delete (archive) customer
  async delete(id: string): Promise<void> {
    console.log('[CustomersAPI] Deleting customer:', id);
    await customerServiceFixed.deleteCustomer(id);
  },

  // Sync local changes with server
  async sync(): Promise<void> {
    console.log('[CustomersAPI] Syncing...');
    const result = await simpleSyncService.syncAll();
    console.log('[CustomersAPI] Sync result:', result);
  },

  // Additional method for force refresh
  async refresh(): Promise<void> {
    console.log('[CustomersAPI] Refreshing from server...');
    await customerServiceFixed.refreshFromServer();
  }
};