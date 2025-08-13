/**
 * Worker Service
 * Manages worker data with localStorage persistence
 */

export interface Worker {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  email: string;
  specialty: string;
  status: 'Available' | 'On Job' | 'Off Duty';
  currentJob?: string | null;
  color: string;
  notes?: string;
}

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

  constructor() {
    this.loadWorkers();
  }

  private loadWorkers() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.workers = JSON.parse(stored);
      } else {
        this.workers = defaultWorkers;
        this.saveWorkers();
      }
    } catch (error) {
      console.error('Failed to load workers:', error);
      this.workers = defaultWorkers;
    }
  }

  private saveWorkers() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workers));
    } catch (error) {
      console.error('Failed to save workers:', error);
    }
  }

  getAll(): Worker[] {
    return [...this.workers];
  }

  getById(id: string): Worker | undefined {
    return this.workers.find(w => w.id === id);
  }

  getByInitials(initials: string): Worker | undefined {
    return this.workers.find(w => w.name === initials);
  }

  create(worker: Omit<Worker, 'id'>): Worker {
    const newWorker: Worker = {
      ...worker,
      id: this.generateId(worker.name)
    };
    this.workers.push(newWorker);
    this.saveWorkers();
    return newWorker;
  }

  update(id: string, updates: Partial<Worker>): Worker | undefined {
    const index = this.workers.findIndex(w => w.id === id);
    if (index === -1) return undefined;

    this.workers[index] = { ...this.workers[index], ...updates };
    this.saveWorkers();
    return this.workers[index];
  }

  delete(id: string): boolean {
    const index = this.workers.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.workers.splice(index, 1);
    this.saveWorkers();
    return true;
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
  getNextColor(): string {
    const usedColors = this.workers.map(w => w.color);
    const availableColor = workerColors.find(color => !usedColors.includes(color));
    return availableColor || workerColors[0];
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