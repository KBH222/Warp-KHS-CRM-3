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

interface Job {
  id: string;
  customerId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}

interface Material {
  id: string;
  name: string;
  description?: string;
  unit: string;
  cost: number;
  supplier?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerFilters {
  search?: string;
  isArchived?: boolean;
}

interface JobFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  customerId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
}

interface MaterialFilters {
  search?: string;
  supplier?: string;
  isArchived?: boolean;
}
import { offlineDb } from './db.service';
import { optimisticUpdatesService } from './optimistic-updates.service';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Enhanced offline data service that provides unified access to data
 * with automatic caching, compression, and smart loading
 */
class OfflineDataService {
  private dataCache = new Map<string, { data: any; timestamp: number; compressed: boolean }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get customers with smart caching and filtering
   */
  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    const cacheKey = `customers_${JSON.stringify(filters || {})}`;
    
    // Check memory cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Check IndexedDB cache
    const dbCached = await offlineDb.getCachedData(cacheKey);
    if (dbCached) {
      this.setCachedData(cacheKey, dbCached);
      return dbCached;
    }

    // Load from database
    const customers = await offlineDb.getCustomers(filters);
    
    // Cache the result
    this.setCachedData(cacheKey, customers);
    await offlineDb.setCachedData(cacheKey, customers, this.CACHE_TTL, true);
    
    return customers;
  }

  /**
   * Get single customer with caching
   */
  async getCustomer(id: string): Promise<Customer | null> {
    const cacheKey = `customer_${id}`;
    
    // Check memory cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Load from database
    const customer = await offlineDb.getCustomer(id);
    if (customer) {
      this.setCachedData(cacheKey, customer);
    }
    
    return customer || null;
  }

  /**
   * Get jobs with smart caching and filtering
   */
  async getJobs(filters?: JobFilters): Promise<Job[]> {
    const cacheKey = `jobs_${JSON.stringify(filters || {})}`;
    
    // Check memory cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Check IndexedDB cache
    const dbCached = await offlineDb.getCachedData(cacheKey);
    if (dbCached) {
      this.setCachedData(cacheKey, dbCached);
      return dbCached;
    }

    // Load from database with enhanced filtering
    let jobs = await offlineDb.getJobs();
    
    // Apply filters
    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      jobs = jobs.filter(job => statuses.includes(job.status));
    }
    
    if (filters?.customerId) {
      jobs = jobs.filter(job => job.customerId === filters.customerId);
    }
    
    if (filters?.assignedUserId) {
      jobs = jobs.filter(job => 
        job.assignments?.some(a => a.userId === filters.assignedUserId)
      );
    }
    
    if (filters?.startDate) {
      if (filters.startDate.from) {
        jobs = jobs.filter(job => 
          job.startDate && new Date(job.startDate) >= filters.startDate!.from!
        );
      }
      if (filters.startDate.to) {
        jobs = jobs.filter(job => 
          job.startDate && new Date(job.startDate) <= filters.startDate!.to!
        );
      }
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      jobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Cache the result
    this.setCachedData(cacheKey, jobs);
    await offlineDb.setCachedData(cacheKey, jobs, this.CACHE_TTL, true);
    
    return jobs;
  }

  /**
   * Get single job with related data
   */
  async getJobWithDetails(id: string): Promise<(Job & { customer?: Customer; materials?: Material[] }) | null> {
    const cacheKey = `job_details_${id}`;
    
    // Check memory cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Load job
    const job = await offlineDb.getJob(id);
    if (!job) {
      return null;
    }

    // Load related data
    const [customer, materials] = await Promise.all([
      offlineDb.getCustomer(job.customerId),
      offlineDb.getMaterials(job.id),
    ]);

    const jobWithDetails = {
      ...job,
      customer: customer || undefined,
      materials: materials || [],
    };

    // Cache the result
    this.setCachedData(cacheKey, jobWithDetails);
    
    return jobWithDetails;
  }

  /**
   * Get materials with smart filtering
   */
  async getMaterials(jobId: string, filters?: MaterialFilters): Promise<Material[]> {
    const cacheKey = `materials_${jobId}_${JSON.stringify(filters || {})}`;
    
    // Check memory cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Load from database
    let materials = await offlineDb.getMaterials(jobId);
    
    // Apply filters
    if (filters?.purchased !== undefined) {
      materials = materials.filter(m => m.purchased === filters.purchased);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      materials = materials.filter(m =>
        m.itemName.toLowerCase().includes(searchLower) ||
        m.unit.toLowerCase().includes(searchLower) ||
        m.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Cache the result
    this.setCachedData(cacheKey, materials);
    
    return materials;
  }

  /**
   * Get dashboard statistics with caching
   */
  async getDashboardStats(): Promise<{
    activeJobs: number;
    completedJobsThisWeek: number;
    pendingMaterials: number;
    totalCustomers: number;
    unsyncedItems: number;
  }> {
    const cacheKey = 'dashboard_stats';
    
    // Check memory cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate stats
    const [jobs, materials, customers, dbStats] = await Promise.all([
      this.getJobs(),
      offlineDb.getMaterials(''), // Get all materials
      this.getCustomers(),
      offlineDb.getDatabaseStats(),
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const stats = {
      activeJobs: jobs.filter(j => j.status === 'IN_PROGRESS').length,
      completedJobsThisWeek: jobs.filter(j => 
        j.status === 'COMPLETED' && 
        new Date(j.updatedAt) >= oneWeekAgo
      ).length,
      pendingMaterials: materials.filter(m => !m.purchased && !m.isDeleted).length,
      totalCustomers: customers.filter(c => !c.isArchived).length,
      unsyncedItems: dbStats.unsynced,
    };

    // Cache with shorter TTL for stats
    this.setCachedData(cacheKey, stats, 2 * 60 * 1000); // 2 minutes
    
    return stats;
  }

  /**
   * Search across all entities
   */
  async globalSearch(query: string, limit = 20): Promise<{
    customers: Customer[];
    jobs: Job[];
    materials: Material[];
  }> {
    const searchLower = query.toLowerCase();
    
    const [customers, jobs, allMaterials] = await Promise.all([
      this.getCustomers({ search: query }),
      this.getJobs({ search: query }),
      offlineDb.getMaterials(''), // Get all materials for search
    ]);

    // Filter materials by search
    const materials = allMaterials
      .filter(m => 
        !m.isDeleted &&
        (m.itemName.toLowerCase().includes(searchLower) ||
         m.notes?.toLowerCase().includes(searchLower))
      )
      .slice(0, limit);

    return {
      customers: customers.slice(0, limit),
      jobs: jobs.slice(0, limit),
      materials,
    };
  }

  /**
   * Get recently modified items
   */
  async getRecentlyModified(hours = 24): Promise<{
    customers: Customer[];
    jobs: Job[];
    materials: Material[];
  }> {
    const cacheKey = `recent_modified_${hours}h`;
    
    // Check memory cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const since = new Date();
    since.setHours(since.getHours() - hours);
    const sinceTimestamp = since.getTime();

    const [allCustomers, allJobs, allMaterials] = await Promise.all([
      offlineDb.getCustomers(),
      offlineDb.getJobs(),
      offlineDb.getMaterials(''),
    ]);

    const result = {
      customers: allCustomers.filter(c => {
        const lastModified = (c as any)._lastModified || new Date(c.updatedAt).getTime();
        return lastModified >= sinceTimestamp;
      }),
      jobs: allJobs.filter(j => {
        const lastModified = (j as any)._lastModified || new Date(j.updatedAt).getTime();
        return lastModified >= sinceTimestamp;
      }),
      materials: allMaterials.filter(m => {
        const lastModified = (m as any)._lastModified || new Date(m.updatedAt).getTime();
        return lastModified >= sinceTimestamp && !m.isDeleted;
      }),
    };

    // Cache for 5 minutes
    this.setCachedData(cacheKey, result, 5 * 60 * 1000);
    
    return result;
  }

  /**
   * Get unsynced items
   */
  async getUnsyncedItems(): Promise<{
    customers: Customer[];
    jobs: Job[];
    materials: Material[];
  }> {
    return await offlineDb.getUnsyncedEntities();
  }

  /**
   * Preload critical data for offline use
   */
  async preloadCriticalData(): Promise<void> {
    try {
      // Preload most commonly accessed data
      await Promise.all([
        this.getCustomers({ isArchived: false }), // Active customers
        this.getJobs({ status: ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_MATERIALS'] }), // Active jobs
        this.getDashboardStats(),
      ]);
    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    this.dataCache.clear();
    await offlineDb.clearCache();
  }

  /**
   * Invalidate cache for specific entity type
   */
  invalidateCache(entityType: 'customer' | 'job' | 'material', id?: string): void {
    const patterns = [
      `${entityType}s_`,
      `${entityType}_`,
      'dashboard_stats',
      'recent_modified_',
    ];

    if (id) {
      patterns.push(`${entityType}_${id}`);
      patterns.push(`${entityType}_details_${id}`);
    }

    // Clear from memory cache
    for (const [key] of this.dataCache) {
      if (patterns.some(pattern => key.startsWith(pattern))) {
        this.dataCache.delete(key);
      }
    }

    // Clear from IndexedDB cache (async)
    this.clearDbCache(patterns);
  }

  private async clearDbCache(patterns: string[]): Promise<void> {
    try {
      // This is a simplified approach - in a real implementation,
      // you'd want to iterate through cache keys and delete matching ones
      await offlineDb.clearCache();
    } catch (error) {
      console.error('Failed to clear database cache:', error);
    }
  }

  /**
   * Memory cache helpers
   */
  private getCachedData(key: string): any {
    const cached = this.dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.dataCache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl?: number): void {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now(),
      compressed: false,
    });

    // Limit memory cache size
    if (this.dataCache.size > 100) {
      const oldestKey = this.dataCache.keys().next().value;
      this.dataCache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memoryEntries: number;
    memorySize: number;
  } {
    let memorySize = 0;
    for (const [key, value] of this.dataCache) {
      memorySize += JSON.stringify(value).length;
    }

    return {
      memoryEntries: this.dataCache.size,
      memorySize,
    };
  }
}

export const offlineDataService = new OfflineDataService();