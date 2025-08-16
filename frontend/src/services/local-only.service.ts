/**
 * Local-only service that provides fallback functionality when API calls fail
 * This allows the app to work completely offline using only IndexedDB/localStorage
 */

import { offlineDb } from './db.service';

// Types defined inline
interface Customer {
  id: string;
  reference?: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  title: string;
  description?: string;
  status: string;
  customerId: string;
  priority: string;
  totalCost: number;
  depositPaid: number;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class LocalOnlyService {
  private isLocalMode = false;

  constructor() {
    // Check if local mode was previously enabled
    if (localStorage.getItem('khs-crm-local-mode') === 'true') {
      this.isLocalMode = true;
      console.log('[LocalOnlyService] Local mode was previously enabled, keeping it enabled');
    }
    
    // Auto-enable local mode if we detect CORS issues
    if (import.meta.env.VITE_API_URL?.includes('render.com') && window.location.hostname.includes('vercel')) {
      console.log('[LocalOnlyService] Detected Vercel frontend with Render backend - enabling local mode to bypass CORS');
      this.enableLocalMode();
    }
  }

  /**
   * Enable local-only mode (disables API calls)
   */
  enableLocalMode() {
    console.log('[LocalOnlyService] Enabling local-only mode - all operations will use local storage');
    this.isLocalMode = true;
    
    // Store in localStorage so it persists
    localStorage.setItem('khs-crm-local-mode', 'true');
  }

  /**
   * Disable local-only mode (re-enables API calls)
   */
  disableLocalMode() {
    console.log('[LocalOnlyService] Disabling local-only mode - API calls will be attempted');
    this.isLocalMode = false;
    localStorage.removeItem('khs-crm-local-mode');
  }

  /**
   * Check if we're in local-only mode
   */
  isLocalModeEnabled(): boolean {
    // Check both the flag and localStorage
    return this.isLocalMode || localStorage.getItem('khs-crm-local-mode') === 'true';
  }

  /**
   * Generate a unique ID for local entities
   */
  private generateLocalId(prefix: string): string {
    return `${prefix}_local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate customer reference
   */
  private async generateCustomerReference(): Promise<string> {
    const customers = await offlineDb.getCustomers();
    const count = customers.length;
    const letter = String.fromCharCode(65 + Math.floor(count / 100));
    const number = (count % 100) + 1;
    return `${letter}${number}`;
  }

  /**
   * Get all customers (local only)
   */
  async getCustomers(filters?: { search?: string; isArchived?: boolean }): Promise<Customer[]> {
    console.log('[LocalOnlyService] Getting customers from local storage');
    
    let customers = await offlineDb.getCustomers(filters);
    
    // Apply search filter if provided
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.address?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return customers;
  }

  /**
   * Get single customer (local only)
   */
  async getCustomer(id: string): Promise<Customer | null> {
    console.log('[LocalOnlyService] Getting customer from local storage:', id);
    return await offlineDb.getCustomer(id);
  }

  /**
   * Create customer (local only)
   */
  async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    address: string;
    notes?: string;
  }): Promise<Customer> {
    console.log('[LocalOnlyService] Creating customer in local storage:', data);
    
    const now = new Date().toISOString();
    const reference = await this.generateCustomerReference();
    
    const customer: Customer = {
      id: this.generateLocalId('customer'),
      reference,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await offlineDb.saveCustomer(customer);
    return customer;
  }

  /**
   * Update customer (local only)
   */
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    console.log('[LocalOnlyService] Updating customer in local storage:', id, data);
    
    const existing = await this.getCustomer(id);
    if (!existing) {
      throw new Error('Customer not found');
    }
    
    const updated: Customer = {
      ...existing,
      ...data,
      id: existing.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };
    
    await offlineDb.saveCustomer(updated);
    return updated;
  }

  /**
   * Delete customer (local only)
   */
  async deleteCustomer(id: string): Promise<void> {
    console.log('[LocalOnlyService] Deleting customer from local storage:', id);
    await offlineDb.deleteCustomer(id);
  }

  /**
   * Get all jobs (local only)
   */
  async getJobs(filters?: any): Promise<Job[]> {
    console.log('[LocalOnlyService] Getting jobs from local storage');
    
    let jobs = await offlineDb.getJobs();
    
    // Apply filters
    if (filters?.customerId) {
      jobs = jobs.filter(j => j.customerId === filters.customerId);
    }
    
    if (filters?.status) {
      jobs = jobs.filter(j => j.status === filters.status);
    }
    
    return jobs;
  }

  /**
   * Create job (local only)
   */
  async createJob(data: {
    title: string;
    description?: string;
    customerId: string;
    status?: string;
    priority?: string;
    totalCost?: number;
    depositPaid?: number;
    startDate?: string | null;
    endDate?: string | null;
    notes?: string;
  }): Promise<Job> {
    console.log('[LocalOnlyService] Creating job in local storage:', data);
    
    const now = new Date().toISOString();
    
    const job: Job = {
      id: this.generateLocalId('job'),
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      status: data.status || 'QUOTED',
      priority: data.priority || 'medium',
      totalCost: data.totalCost || 0,
      depositPaid: data.depositPaid || 0,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    
    await offlineDb.saveJob(job);
    return job;
  }

  /**
   * Update job (local only)
   */
  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    console.log('[LocalOnlyService] Updating job in local storage:', id, data);
    
    const existing = await offlineDb.getJob(id);
    if (!existing) {
      throw new Error('Job not found');
    }
    
    const updated: Job = {
      ...existing,
      ...data,
      id: existing.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };
    
    await offlineDb.saveJob(updated);
    return updated;
  }

  /**
   * Delete job (local only)
   */
  async deleteJob(id: string): Promise<void> {
    console.log('[LocalOnlyService] Deleting job from local storage:', id);
    await offlineDb.deleteJob(id);
  }

  /**
   * Clear all local data (use with caution!)
   */
  async clearAllData(): Promise<void> {
    console.warn('[LocalOnlyService] Clearing all local data!');
    await offlineDb.clearAll();
  }

  /**
   * Get statistics about local data
   */
  async getLocalStats(): Promise<{
    customers: number;
    jobs: number;
    localMode: boolean;
  }> {
    const [customers, jobs] = await Promise.all([
      offlineDb.getCustomers(),
      offlineDb.getJobs(),
    ]);
    
    return {
      customers: customers.length,
      jobs: jobs.length,
      localMode: this.isLocalModeEnabled(),
    };
  }
}

export const localOnlyService = new LocalOnlyService();