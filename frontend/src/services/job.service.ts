// Inline type definitions
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

interface CreateJobRequest {
  customerId: string;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  estimatedHours?: number;
}

interface UpdateJobRequest {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

interface JobFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  customerId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
}

type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
import { optimisticUpdatesService } from './optimistic-updates.service';
import { offlineDataService } from './offline-data.service';

/**
 * Enhanced job service with optimistic updates and offline capabilities
 */
class JobService {
  /**
   * Get all jobs with optional filters
   */
  async getJobs(filters?: JobFilters): Promise<Job[]> {
    return offlineDataService.getJobs(filters);
  }

  /**
   * Get a single job by ID
   */
  async getJob(id: string): Promise<Job | null> {
    return offlineDataService.getJobWithDetails(id);
  }

  /**
   * Create a new job with optimistic updates
   */
  async createJob(data: CreateJobRequest): Promise<Job> {
    const job = await optimisticUpdatesService.createJob(data);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('job');
    offlineDataService.invalidateCache('customer', data.customerId);
    
    return job;
  }

  /**
   * Update an existing job with optimistic updates
   */
  async updateJob(id: string, data: UpdateJobRequest): Promise<Job> {
    const job = await optimisticUpdatesService.updateJob(id, data);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('job', id);
    
    return job;
  }

  /**
   * Delete a job with optimistic updates
   */
  async deleteJob(id: string): Promise<void> {
    await optimisticUpdatesService.deleteJob(id);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('job', id);
  }

  /**
   * Update job status with optimistic updates
   */
  async updateJobStatus(id: string, status: JobStatus): Promise<Job> {
    return this.updateJob(id, { status });
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: JobStatus | JobStatus[]): Promise<Job[]> {
    return this.getJobs({ status });
  }

  /**
   * Get jobs for a specific customer
   */
  async getJobsForCustomer(customerId: string): Promise<Job[]> {
    return this.getJobs({ customerId });
  }

  /**
   * Get active jobs (not completed or on hold)
   */
  async getActiveJobs(): Promise<Job[]> {
    return this.getJobs({ 
      status: ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_MATERIALS'] 
    });
  }

  /**
   * Get completed jobs
   */
  async getCompletedJobs(): Promise<Job[]> {
    return this.getJobs({ status: 'COMPLETED' });
  }

  /**
   * Search jobs by query
   */
  async searchJobs(query: string): Promise<Job[]> {
    return this.getJobs({ search: query });
  }

  /**
   * Get jobs scheduled for a date range
   */
  async getJobsInDateRange(startDate: Date, endDate: Date): Promise<Job[]> {
    return this.getJobs({ 
      startDate: { from: startDate, to: endDate } 
    });
  }

  /**
   * Get jobs assigned to a specific user
   */
  async getJobsForUser(userId: string): Promise<Job[]> {
    return this.getJobs({ assignedUserId: userId });
  }

  /**
   * Validate job data
   */
  validateJobData(data: Partial<CreateJobRequest>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Job title is required');
    }

    if (!data.customerId) {
      errors.push('Customer is required');
    }

    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      errors.push('Start date cannot be after end date');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{
    total: number;
    notStarted: number;
    inProgress: number;
    waitingOnMaterials: number;
    completed: number;
    onHold: number;
    completedThisWeek: number;
    overdue: number;
  }> {
    const [allJobs, recentData] = await Promise.all([
      this.getJobs(),
      offlineDataService.getRecentlyModified(7 * 24), // Last week
    ]);

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const completedThisWeek = recentData.jobs.filter(j => j.status === 'COMPLETED');
    
    const overdue = allJobs.filter(job => {
      if (!job.endDate || job.status === 'COMPLETED') return false;
      return new Date(job.endDate) < now;
    });

    return {
      total: allJobs.length,
      notStarted: allJobs.filter(j => j.status === 'NOT_STARTED').length,
      inProgress: allJobs.filter(j => j.status === 'IN_PROGRESS').length,
      waitingOnMaterials: allJobs.filter(j => j.status === 'WAITING_ON_MATERIALS').length,
      completed: allJobs.filter(j => j.status === 'COMPLETED').length,
      onHold: allJobs.filter(j => j.status === 'ON_HOLD').length,
      completedThisWeek: completedThisWeek.length,
      overdue: overdue.length,
    };
  }

  /**
   * Get job status display information
   */
  getStatusDisplay(status: JobStatus): { label: string; color: string; icon: string } {
    const statusMap = {
      NOT_STARTED: { label: 'Not Started', color: 'gray', icon: 'clock' },
      IN_PROGRESS: { label: 'In Progress', color: 'blue', icon: 'cog' },
      WAITING_ON_MATERIALS: { label: 'Waiting on Materials', color: 'yellow', icon: 'package' },
      COMPLETED: { label: 'Completed', color: 'green', icon: 'check' },
      ON_HOLD: { label: 'On Hold', color: 'orange', icon: 'pause' },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: 'question' };
  }

  /**
   * Calculate job duration
   */
  calculateJobDuration(job: Job): number | null {
    if (!job.startDate || !job.endDate) return null;
    
    const start = new Date(job.startDate);
    const end = new Date(job.endDate);
    
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if job is overdue
   */
  isJobOverdue(job: Job): boolean {
    if (!job.endDate || job.status === 'COMPLETED') return false;
    return new Date(job.endDate) < new Date();
  }

  /**
   * Get upcoming jobs (next 7 days)
   */
  async getUpcomingJobs(): Promise<Job[]> {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const jobs = await this.getActiveJobs();
    
    return jobs.filter(job => {
      if (!job.startDate) return false;
      const startDate = new Date(job.startDate);
      return startDate >= now && startDate <= nextWeek;
    });
  }
}

export const jobService = new JobService();