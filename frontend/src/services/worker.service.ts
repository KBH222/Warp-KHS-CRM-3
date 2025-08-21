/**
 * Worker Service
 * Manages worker data with API and localStorage persistence
 */

import { workersApi, Worker } from './api/workers.api';
import { mergeTimesheets, getModifiedDays, addTimesheetMetadata, stripTimesheetMetadata } from '../utils/timesheetMerge';

export { Worker } from './api/workers.api';

const STORAGE_KEY = 'khs-crm-workers';

// Default workers
const defaultWorkers: Worker[] = [
  {
    id: 'KBH',
    name: 'KBH',
    fullName: 'Keith B. Henderson',
    phone: '(555) 111-2222',
    email: 'kbh@khsconstruction.com',
    specialty: 'General Construction',
    status: 'Available',
    currentJob: null,
    color: '#3B82F6'
  },
  {
    id: 'ISA',
    name: 'ISA',
    fullName: 'Isabella A. Rodriguez',
    phone: '(555) 333-4444',
    email: 'isa@khsconstruction.com',
    specialty: 'Finish Work',
    status: 'On Job',
    currentJob: 'Kitchen Remodel - Sarah Johnson',
    color: '#10B981'
  },
  {
    id: 'TYL',
    name: 'TYL',
    fullName: 'Tyler L. Mitchell',
    phone: '(555) 555-6666',
    email: 'tyl@khsconstruction.com',
    specialty: 'Carpentry',
    status: 'On Job',
    currentJob: 'Deck Installation - Mike Davis',
    color: '#F59E0B'
  }
];

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
    try {
      // Try to load from API first
      const apiWorkers = await workersApi.getAll();
      this.workers = apiWorkers;
      this.initialized = true;
      
      // If no workers in database, create defaults
      if (this.workers.length === 0) {
        for (const worker of defaultWorkers) {
          await this.create(worker);
        }
      }
    } catch (error) {
      // Fallback to localStorage if API fails
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.workers = JSON.parse(stored);
      } else {
        this.workers = defaultWorkers;
      }
      this.initialized = true;
    } catch (error) {
      this.workers = defaultWorkers;
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