/**
 * Worker Service
 * Manages worker data with API and localStorage persistence
 */

import { workersApi, Worker } from './api/workers.api';

export type { Worker } from './api/workers.api';

const STORAGE_KEY = 'khs-crm-workers';

// No default workers - start with empty list
const defaultWorkers: Worker[] = [];

// Available colors for workers
export const workerColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#84CC16', // Lime
];

class WorkerService {
  private workers: Worker[] = [];
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('=== WorkerService.initialize ===');
    try {
      // Try to load from API first
      const apiWorkers = await workersApi.getAll();
      console.log('API returned workers:', apiWorkers.length);
      this.workers = apiWorkers;
      
      // If no workers in database, that's fine - start with empty list
      if (this.workers.length === 0) {
        console.log('No workers found in database, starting with empty list');
      }
      
      this.initialized = true;
    } catch (error) {
      console.log('API failed, loading from localStorage:', error);
      // Fallback to localStorage if API fails
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    console.log('=== WorkerService.loadFromLocalStorage ===');
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log('localStorage has data:', !!stored);
      if (stored) {
        this.workers = JSON.parse(stored);
        console.log('Loaded workers from localStorage:', this.workers.length);
        
        // Migrate existing workers to ensure they have timesheet field
        let needsUpdate = false;
        this.workers = this.workers.map(worker => {
          if (!worker.timesheet) {
            needsUpdate = true;
            return { ...worker, timesheet: {} };
          }
          return worker;
        });
        
        // Save back if we added timesheet to any workers
        if (needsUpdate) {
          console.log('Migrating workers to add timesheet field');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workers));
        }
      } else {
        console.log('No data in localStorage, starting with empty list');
        this.workers = [];
        // Save empty array to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workers));
      }
      this.initialized = true;
    } catch (error) {
      console.log('Error in loadFromLocalStorage:', error);
      // Start with empty array on error
      this.workers = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workers));
      this.initialized = true;
    }
  }

  private async waitForInit() {
    let attempts = 0;
    while (!this.initialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  async getAll(): Promise<Worker[]> {
    await this.waitForInit();
    try {
      const workers = await workersApi.getAll();
      this.workers = workers;
      
      // Debug localStorage
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        const tyler = parsed.find((w: Worker) => w.name === 'TYL' || w.fullName?.includes('Tyler'));
        if (tyler) {
          console.log('=== TYLER IN LOCALSTORAGE ===');
          console.log('Full data:', tyler);
          console.log('Timesheet:', tyler.timesheet);
          console.log('Monday:', tyler.timesheet?.Mon);
        }
      }
      
      return workers;
    } catch (error) {
      return [...this.workers];
    }
  }

  async getById(id: string): Promise<Worker | undefined> {
    await this.waitForInit();
    try {
      return await workersApi.getById(id);
    } catch (error) {
      return this.workers.find(w => w.id === id);
    }
  }

  async getByInitials(initials: string): Promise<Worker | undefined> {
    await this.waitForInit();
    const workers = await this.getAll();
    return workers.find(w => w.name === initials);
  }

  async create(worker: Omit<Worker, 'id'>): Promise<Worker> {
    await this.waitForInit();
    try {
      const newWorker = await workersApi.create(worker);
      this.workers.push(newWorker);
      return newWorker;
    } catch (error) {
      // Fallback to local creation
      const newWorker: Worker = {
        ...worker,
        id: this.generateId(worker.name)
      };
      this.workers.push(newWorker);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workers));
      return newWorker;
    }
  }

  async update(id: string, updates: Partial<Worker>): Promise<Worker | undefined> {
    await this.waitForInit();
    
    console.log('=== WorkerService.update ===');
    console.log('ID:', id);
    console.log('Updates:', updates);
    console.log('Timesheet specifically:', updates.timesheet);
    console.log('Has timesheet?', 'timesheet' in updates);
    
    try {
      // Just pass through to API - no complex merging
      const updatedWorker = await workersApi.update(id, updates);
      
      // Update local cache
      const index = this.workers.findIndex(w => w.id === id);
      if (index !== -1) {
        this.workers[index] = updatedWorker;
      }
      
      return updatedWorker;
    } catch (error) {
      console.error('Worker update failed:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.waitForInit();
    try {
      await workersApi.delete(id);
      const index = this.workers.findIndex(w => w.id === id);
      if (index !== -1) {
        this.workers.splice(index, 1);
      }
      return true;
    } catch (error) {
      // Fallback to local delete
      const index = this.workers.findIndex(w => w.id === id);
      if (index === -1) return false;
      
      this.workers.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workers));
      return true;
    }
  }

  private generateId(name: string): string {
    // Try to use the initials as ID
    const initials = name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
    
    // Check if initials are already taken
    let id = initials;
    let counter = 1;
    while (this.workers.some(w => w.id === id)) {
      id = `${initials}${counter}`;
      counter++;
    }
    return id;
  }

  // Get next available color
  async getNextColor(): Promise<string> {
    await this.waitForInit();
    const workers = await this.getAll();
    const usedColors = workers.map(w => w.color);
    const availableColor = workerColors.find(color => !usedColors.includes(color));
    return availableColor || workerColors[0];
  }

  // Sync with server
  async sync(): Promise<void> {
    await workersApi.sync();
  }

  // Clear all workers
  async clearAllWorkers(): Promise<void> {
    console.log('=== WorkerService.clearAllWorkers ===');
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared localStorage');
    
    // Reset to empty array
    this.workers = [];
    
    // Save empty array to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workers));
    console.log('Reset to empty workers list');
  }
  
  // Force refresh from server
  async forceRefresh(): Promise<Worker[]> {
    console.log('=== WorkerService.forceRefresh ===');
    
    try {
      // Clear localStorage first
      localStorage.removeItem(STORAGE_KEY);
      console.log('Cleared localStorage for fresh fetch');
      
      // Fetch fresh data from server
      const workers = await workersApi.getAll();
      console.log('Fetched fresh workers from server:', workers.length);
      
      // Update local cache
      this.workers = workers;
      
      // Save to localStorage for offline access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
      console.log('Saved fresh data to localStorage');
      
      return workers;
    } catch (error) {
      console.error('Force refresh failed:', error);
      throw error;
    }
  }
  
  // Utility to format phone number
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
}

export const workerService = new WorkerService();