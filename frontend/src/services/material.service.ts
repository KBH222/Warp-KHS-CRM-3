// Inline type definitions
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

interface CreateMaterialRequest {
  name: string;
  description?: string;
  unit: string;
  cost: number;
  supplier?: string;
}

interface UpdateMaterialRequest {
  name?: string;
  description?: string;
  unit?: string;
  cost?: number;
  supplier?: string;
  isArchived?: boolean;
}

interface BulkUpdateMaterialsRequest {
  materials: Array<{
    id: string;
    cost?: number;
    supplier?: string;
    isArchived?: boolean;
  }>;
}

interface MaterialFilters {
  search?: string;
  supplier?: string;
  isArchived?: boolean;
}
import { optimisticUpdatesService } from './optimistic-updates.service';
import { offlineDataService } from './offline-data.service';

/**
 * Enhanced material service with optimistic updates and offline capabilities
 */
class MaterialService {
  /**
   * Get all materials for a job with optional filters
   */
  async getMaterials(jobId: string, filters?: MaterialFilters): Promise<Material[]> {
    return offlineDataService.getMaterials(jobId, filters);
  }

  /**
   * Create a new material with optimistic updates
   */
  async createMaterial(data: CreateMaterialRequest): Promise<Material> {
    const material = await optimisticUpdatesService.createMaterial(data);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('material');
    offlineDataService.invalidateCache('job', data.jobId);
    
    return material;
  }

  /**
   * Update an existing material with optimistic updates
   */
  async updateMaterial(data: UpdateMaterialRequest): Promise<Material> {
    const material = await optimisticUpdatesService.updateMaterial(data);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('material', data.id);
    
    return material;
  }

  /**
   * Delete a material with optimistic updates
   */
  async deleteMaterial(id: string): Promise<void> {
    await optimisticUpdatesService.deleteMaterial(id);
    
    // Invalidate related caches
    offlineDataService.invalidateCache('material', id);
  }

  /**
   * Bulk update materials (mark as purchased/unpurchased)
   */
  async bulkUpdateMaterials(
    jobId: string,
    materialIds: string[],
    purchased: boolean
  ): Promise<Material[]> {
    const materials = await optimisticUpdatesService.bulkUpdateMaterials(
      jobId,
      materialIds,
      purchased
    );
    
    // Invalidate related caches
    offlineDataService.invalidateCache('material');
    offlineDataService.invalidateCache('job', jobId);
    
    return materials;
  }

  /**
   * Mark material as purchased
   */
  async markAsPurchased(id: string): Promise<Material> {
    return this.updateMaterial({
      id,
      purchased: true,
    });
  }

  /**
   * Mark material as unpurchased
   */
  async markAsUnpurchased(id: string): Promise<Material> {
    return this.updateMaterial({
      id,
      purchased: false,
    });
  }

  /**
   * Get purchased materials for a job
   */
  async getPurchasedMaterials(jobId: string): Promise<Material[]> {
    return this.getMaterials(jobId, { purchased: true });
  }

  /**
   * Get unpurchased materials for a job
   */
  async getUnpurchasedMaterials(jobId: string): Promise<Material[]> {
    return this.getMaterials(jobId, { purchased: false });
  }

  /**
   * Search materials by item name
   */
  async searchMaterials(jobId: string, query: string): Promise<Material[]> {
    return this.getMaterials(jobId, { search: query });
  }

  /**
   * Validate material data
   */
  validateMaterialData(data: Partial<CreateMaterialRequest>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.itemName || data.itemName.trim().length === 0) {
      errors.push('Item name is required');
    }

    if (!data.quantity || data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!data.jobId) {
      errors.push('Job ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get material statistics for a job
   */
  async getMaterialStats(jobId: string): Promise<{
    total: number;
    purchased: number;
    unpurchased: number;
    totalValue: number;
    purchasedValue: number;
    unpurchasedValue: number;
  }> {
    const materials = await this.getMaterials(jobId);

    const purchased = materials.filter(m => m.purchased);
    const unpurchased = materials.filter(m => !m.purchased);

    // Note: In a real implementation, you'd want to store prices/costs
    // For now, we'll just count quantities
    const totalValue = materials.reduce((sum, m) => sum + m.quantity, 0);
    const purchasedValue = purchased.reduce((sum, m) => sum + m.quantity, 0);
    const unpurchasedValue = unpurchased.reduce((sum, m) => sum + m.quantity, 0);

    return {
      total: materials.length,
      purchased: purchased.length,
      unpurchased: unpurchased.length,
      totalValue,
      purchasedValue,
      unpurchasedValue,
    };
  }

  /**
   * Get all materials statistics across all jobs
   */
  async getAllMaterialStats(): Promise<{
    totalMaterials: number;
    totalPurchased: number;
    totalUnpurchased: number;
    recentlyAdded: number;
  }> {
    const [recentData] = await Promise.all([
      offlineDataService.getRecentlyModified(24), // Last 24 hours
    ]);

    // We need to get all materials across all jobs
    // This is a simplified approach - in a real app you might want to cache this
    const allJobMaterials: Material[] = [];
    
    try {
      // Get all jobs first
      const jobs = await offlineDataService.getJobs();
      
      // Get materials for each job
      for (const job of jobs) {
        const jobMaterials = await this.getMaterials(job.id);
        allJobMaterials.push(...jobMaterials);
      }
    } catch (error) {
      console.error('Failed to get all materials stats:', error);
    }

    const purchased = allJobMaterials.filter(m => m.purchased && !m.isDeleted);
    const unpurchased = allJobMaterials.filter(m => !m.purchased && !m.isDeleted);

    return {
      totalMaterials: allJobMaterials.filter(m => !m.isDeleted).length,
      totalPurchased: purchased.length,
      totalUnpurchased: unpurchased.length,
      recentlyAdded: recentData.materials.length,
    };
  }

  /**
   * Get common material units
   */
  getCommonUnits(): string[] {
    return [
      'each',
      'box',
      'case',
      'feet',
      'yards',
      'meters',
      'inches',
      'gallons',
      'liters',
      'pounds',
      'kilograms',
      'hours',
      'days',
      'rolls',
      'sheets',
      'bags',
      'tons',
    ];
  }

  /**
   * Format quantity with unit
   */
  formatQuantity(quantity: number, unit: string): string {
    if (quantity === 1) {
      // Handle singular forms
      const singularMap: Record<string, string> = {
        'feet': 'foot',
        'yards': 'yard',
        'meters': 'meter',
        'inches': 'inch',
        'gallons': 'gallon',
        'liters': 'liter',
        'pounds': 'pound',
        'kilograms': 'kilogram',
        'hours': 'hour',
        'days': 'day',
        'rolls': 'roll',
        'sheets': 'sheet',
        'bags': 'bag',
        'tons': 'ton',
      };
      
      const singularUnit = singularMap[unit] || unit;
      return `${quantity} ${singularUnit}`;
    }
    
    return `${quantity} ${unit}`;
  }

  /**
   * Group materials by status
   */
  async groupMaterialsByStatus(jobId: string): Promise<{
    purchased: Material[];
    unpurchased: Material[];
  }> {
    const materials = await this.getMaterials(jobId);
    
    return {
      purchased: materials.filter(m => m.purchased),
      unpurchased: materials.filter(m => !m.purchased),
    };
  }

  /**
   * Get materials that need attention (unpurchased for jobs that are in progress)
   */
  async getMaterialsNeedingAttention(): Promise<Material[]> {
    try {
      const inProgressJobs = await offlineDataService.getJobs({ 
        status: 'IN_PROGRESS' 
      });
      
      const materialsNeedingAttention: Material[] = [];
      
      for (const job of inProgressJobs) {
        const unpurchasedMaterials = await this.getUnpurchasedMaterials(job.id);
        materialsNeedingAttention.push(...unpurchasedMaterials);
      }
      
      return materialsNeedingAttention;
    } catch (error) {
      console.error('Failed to get materials needing attention:', error);
      return [];
    }
  }
}

export const materialService = new MaterialService();