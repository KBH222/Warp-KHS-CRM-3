import { customerServiceFixed } from '../customer.service.fixed';
import { simpleSyncService } from '../sync.service.simple';

// Type defined inline
interface Customer {
  id: string;
  reference: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  notes: string | null;
  customerType?: 'CURRENT' | 'LEADS';
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy: string;
  jobs?: any[];
}

// Re-export the fixed customer service methods under the old API interface
export const customersApi = {
  // Get all customers
  async getAll(customerType?: 'CURRENT' | 'LEADS' | null): Promise<Customer[]> {
    return customerServiceFixed.getCustomers(customerType);
  },

  // Get single customer
  async getById(id: string): Promise<Customer> {
    const customer = await customerServiceFixed.getCustomer(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  },

  // Create customer
  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'modifiedBy' | 'isArchived' | 'reference'>): Promise<Customer> {
    return customerServiceFixed.createCustomer({
      name: customer.name,
      phone: customer.phone || undefined,
      email: customer.email || undefined,
      address: customer.address,
      notes: customer.notes || undefined,
      customerType: customer.customerType
    });
  },

  // Update customer
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    console.log('[customersApi.update] Input customer:', customer);
    console.log('[customersApi.update] customerType:', customer.customerType);
    
    const updateData = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
      customerType: customer.customerType
    };
    
    console.log('[customersApi.update] Sending to service:', updateData);
    
    const result = await customerServiceFixed.updateCustomer(id, updateData);
    
    console.log('[customersApi.update] Service returned:', result);
    console.log('[customersApi.update] Result customerType:', result.customerType);
    
    return result;
  },

  // Delete (archive) customer
  async delete(id: string): Promise<void> {
    await customerServiceFixed.deleteCustomer(id);
  },

  // Sync local changes with server
  async sync(): Promise<void> {
    const result = await simpleSyncService.syncAll();
    if (!result.success) {
      throw new Error('Sync failed');
    }
  },

  // Additional method for force refresh
  async refresh(): Promise<void> {
    await customerServiceFixed.refreshFromServer();
  }
};