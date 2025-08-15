import axios from 'axios';
import { Customer } from '@khs-crm/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with auth
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('khs-crm-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const customersApi = {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    try {
      const response = await api.get('/customers');
      return response.data;
    } catch (error) {
      // Fallback to localStorage if API fails
      const localCustomers = localStorage.getItem('khs-crm-customers');
      if (localCustomers) {
        return JSON.parse(localCustomers);
      }
      throw error;
    }
  },

  // Get single customer
  async getById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create customer
  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      const response = await api.post('/customers', customer);
      return response.data;
    } catch (error) {
      // If offline, save to localStorage with temp ID
      if (!navigator.onLine) {
        const tempCustomer = {
          ...customer,
          id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const localCustomers = localStorage.getItem('khs-crm-customers');
        const customers = localCustomers ? JSON.parse(localCustomers) : [];
        customers.push(tempCustomer);
        localStorage.setItem('khs-crm-customers', JSON.stringify(customers));
        
        // Queue for sync
        const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
        const queue = JSON.parse(syncQueue);
        queue.push({
          type: 'customer',
          action: 'create',
          data: tempCustomer,
          timestamp: Date.now(),
        });
        localStorage.setItem('khs-crm-sync-queue', JSON.stringify(queue));
        
        return tempCustomer as Customer;
      }
      throw error;
    }
  },

  // Update customer
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    try {
      const response = await api.put(`/customers/${id}`, customer);
      return response.data;
    } catch (error) {
      // If offline, update in localStorage
      if (!navigator.onLine) {
        const localCustomers = localStorage.getItem('khs-crm-customers');
        if (localCustomers) {
          const customers = JSON.parse(localCustomers);
          const index = customers.findIndex((c: Customer) => c.id === id);
          if (index !== -1) {
            customers[index] = { ...customers[index], ...customer, updatedAt: new Date().toISOString() };
            localStorage.setItem('khs-crm-customers', JSON.stringify(customers));
            
            // Queue for sync
            const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
            const queue = JSON.parse(syncQueue);
            queue.push({
              type: 'customer',
              action: 'update',
              id,
              data: customer,
              timestamp: Date.now(),
            });
            localStorage.setItem('khs-crm-sync-queue', JSON.stringify(queue));
            
            return customers[index];
          }
        }
      }
      throw error;
    }
  },

  // Delete (archive) customer
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/customers/${id}`);
    } catch (error) {
      // If offline, mark as deleted in localStorage
      if (!navigator.onLine) {
        const localCustomers = localStorage.getItem('khs-crm-customers');
        if (localCustomers) {
          const customers = JSON.parse(localCustomers);
          const filtered = customers.filter((c: Customer) => c.id !== id);
          localStorage.setItem('khs-crm-customers', JSON.stringify(filtered));
          
          // Queue for sync
          const syncQueue = localStorage.getItem('khs-crm-sync-queue') || '[]';
          const queue = JSON.parse(syncQueue);
          queue.push({
            type: 'customer',
            action: 'delete',
            id,
            timestamp: Date.now(),
          });
          localStorage.setItem('khs-crm-sync-queue', JSON.stringify(queue));
        }
      } else {
        throw error;
      }
    }
  },

  // Sync local changes with server
  async sync(): Promise<void> {
    const syncQueue = localStorage.getItem('khs-crm-sync-queue');
    if (!syncQueue) return;

    const queue = JSON.parse(syncQueue);
    const customerChanges = queue.filter((item: any) => item.type === 'customer');
    
    if (customerChanges.length === 0) return;

    try {
      const localCustomers = localStorage.getItem('khs-crm-customers');
      const customers = localCustomers ? JSON.parse(localCustomers) : [];
      
      const response = await api.post('/customers/sync', { customers });
      
      // Update local storage with server IDs
      const results = response.data.results;
      for (const result of results) {
        if (result.status === 'created' && result.data) {
          // Replace temp ID with real ID
          const tempId = result.id;
          const realId = result.data.id;
          
          const customerIndex = customers.findIndex((c: Customer) => c.id === tempId);
          if (customerIndex !== -1) {
            customers[customerIndex] = result.data;
          }
        }
      }
      
      localStorage.setItem('khs-crm-customers', JSON.stringify(customers));
      
      // Clear processed items from sync queue
      const remainingQueue = queue.filter((item: any) => item.type !== 'customer');
      localStorage.setItem('khs-crm-sync-queue', JSON.stringify(remainingQueue));
    } catch (error) {
      throw error;
    }
  },
};