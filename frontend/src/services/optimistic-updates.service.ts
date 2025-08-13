import { Customer, Job, Material, CreateCustomerRequest, UpdateCustomerRequest, CreateJobRequest, UpdateJobRequest, CreateMaterialRequest, UpdateMaterialRequest } from '@khs-crm/types';
import { offlineDb } from './db.service';
import { syncService } from './sync.service';
import { apiClient } from './api.service';
import { API_ENDPOINTS } from '@khs-crm/constants';

/**
 * Service for handling optimistic updates - immediately show changes in UI
 * while queuing them for sync in the background
 */
class OptimisticUpdatesService {
  private pendingUpdates = new Map<string, any>();

  /**
   * Generate a temporary ID for new entities
   */
  private generateTempId(prefix: string): string {
    return `temp_${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Apply optimistic update and queue for sync
   */
  private async applyOptimisticUpdate<T>(
    entityType: 'customer' | 'job' | 'material',
    operation: 'create' | 'update' | 'delete',
    optimisticData: T,
    syncPayload: any,
    entityId?: string
  ): Promise<T> {
    const updateId = `${entityType}_${operation}_${entityId || 'new'}_${Date.now()}`;
    
    // Store pending update
    this.pendingUpdates.set(updateId, {
      entityType,
      operation,
      optimisticData,
      timestamp: new Date(),
    });

    try {
      // Apply optimistic update locally
      switch (entityType) {
        case 'customer':
          if (operation === 'delete' && entityId) {
            await offlineDb.deleteCustomer(entityId);
          } else {
            await offlineDb.saveCustomer(optimisticData as Customer);
          }
          break;
        case 'job':
          if (operation === 'delete' && entityId) {
            await offlineDb.deleteJob(entityId);
          } else {
            await offlineDb.saveJob(optimisticData as Job);
          }
          break;
        case 'material':
          if (operation === 'delete' && entityId) {
            // For materials, we do soft delete
            const material = optimisticData as Material;
            await offlineDb.saveMaterial({ ...material, isDeleted: true });
          } else {
            await offlineDb.saveMaterial(optimisticData as Material);
          }
          break;
      }

      // Queue for sync
      await syncService.queueOperation({
        operation,
        entityType,
        entityId,
        payload: syncPayload,
        timestamp: new Date(),
      });

      // Remove from pending updates
      this.pendingUpdates.delete(updateId);

      return optimisticData;
    } catch (error) {
      // Revert optimistic update on error
      this.pendingUpdates.delete(updateId);
      throw error;
    }
  }

  // Customer operations
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const tempId = this.generateTempId('customer');
    const now = new Date();

    const optimisticCustomer: Customer = {
      id: tempId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address,
      notes: data.notes || null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    if (navigator.onLine) {
      try {
        // Try online creation first
        const serverCustomer = await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS, data);
        await offlineDb.saveCustomer(serverCustomer);
        await offlineDb.markAsSynced('customer', serverCustomer.id);
        return serverCustomer;
      } catch (error) {
        console.warn('Online customer creation failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    return this.applyOptimisticUpdate('customer', 'create', optimisticCustomer, data);
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    // Get existing customer
    const existingCustomer = await offlineDb.getCustomer(id);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    const optimisticCustomer: Customer = {
      ...existingCustomer,
      ...data,
      updatedAt: new Date(),
    };

    if (navigator.onLine) {
      try {
        // Try online update first
        const serverCustomer = await apiClient.put<Customer>(
          API_ENDPOINTS.CUSTOMER_BY_ID(id), 
          data
        );
        await offlineDb.saveCustomer(serverCustomer);
        await offlineDb.markAsSynced('customer', id);
        return serverCustomer;
      } catch (error) {
        console.warn('Online customer update failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    return this.applyOptimisticUpdate('customer', 'update', optimisticCustomer, data, id);
  }

  async deleteCustomer(id: string): Promise<void> {
    if (navigator.onLine) {
      try {
        // Try online deletion first
        await apiClient.delete(API_ENDPOINTS.CUSTOMER_BY_ID(id));
        await offlineDb.deleteCustomer(id);
        return;
      } catch (error) {
        console.warn('Online customer deletion failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    await this.applyOptimisticUpdate('customer', 'delete', null, { id }, id);
  }

  // Job operations
  async createJob(data: CreateJobRequest): Promise<Job> {
    const tempId = this.generateTempId('job');
    const now = new Date();

    const optimisticJob: Job = {
      id: tempId,
      title: data.title,
      description: data.description || null,
      status: data.status || 'NOT_STARTED',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      notes: data.notes || null,
      customerId: data.customerId,
      createdById: 'current-user', // This should be set from auth context
      createdAt: now,
      updatedAt: now,
    };

    if (navigator.onLine) {
      try {
        // Try online creation first
        const serverJob = await apiClient.post<Job>(API_ENDPOINTS.JOBS, data);
        await offlineDb.saveJob(serverJob);
        await offlineDb.markAsSynced('job', serverJob.id);
        return serverJob;
      } catch (error) {
        console.warn('Online job creation failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    return this.applyOptimisticUpdate('job', 'create', optimisticJob, data);
  }

  async updateJob(id: string, data: UpdateJobRequest): Promise<Job> {
    const existingJob = await offlineDb.getJob(id);
    if (!existingJob) {
      throw new Error('Job not found');
    }

    const optimisticJob: Job = {
      ...existingJob,
      ...data,
      updatedAt: new Date(),
    };

    if (navigator.onLine) {
      try {
        // Try online update first
        const serverJob = await apiClient.put<Job>(
          API_ENDPOINTS.JOB_BY_ID(id), 
          data
        );
        await offlineDb.saveJob(serverJob);
        await offlineDb.markAsSynced('job', id);
        return serverJob;
      } catch (error) {
        console.warn('Online job update failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    return this.applyOptimisticUpdate('job', 'update', optimisticJob, data, id);
  }

  async deleteJob(id: string): Promise<void> {
    if (navigator.onLine) {
      try {
        // Try online deletion first
        await apiClient.delete(API_ENDPOINTS.JOB_BY_ID(id));
        await offlineDb.deleteJob(id);
        return;
      } catch (error) {
        console.warn('Online job deletion failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    await this.applyOptimisticUpdate('job', 'delete', null, { id }, id);
  }

  // Material operations
  async createMaterial(data: CreateMaterialRequest): Promise<Material> {
    const tempId = this.generateTempId('material');
    const now = new Date();

    const optimisticMaterial: Material = {
      id: tempId,
      jobId: data.jobId,
      itemName: data.itemName,
      quantity: data.quantity,
      unit: data.unit || 'each',
      purchased: false,
      notes: data.notes || null,
      addedById: 'current-user', // This should be set from auth context
      purchasedById: null,
      purchasedBy: null,
      purchasedAt: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    if (navigator.onLine) {
      try {
        // Try online creation first
        const serverMaterial = await apiClient.post<Material>(
          API_ENDPOINTS.JOB_MATERIALS(data.jobId), 
          data
        );
        await offlineDb.saveMaterial(serverMaterial);
        await offlineDb.markAsSynced('material', serverMaterial.id);
        return serverMaterial;
      } catch (error) {
        console.warn('Online material creation failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    return this.applyOptimisticUpdate('material', 'create', optimisticMaterial, data);
  }

  async updateMaterial(data: UpdateMaterialRequest): Promise<Material> {
    const existingMaterials = await offlineDb.getMaterials('');
    const existingMaterial = existingMaterials.find(m => m.id === data.id);
    
    if (!existingMaterial) {
      throw new Error('Material not found');
    }

    const optimisticMaterial: Material = {
      ...existingMaterial,
      ...data,
      updatedAt: new Date(),
    };

    if (navigator.onLine) {
      try {
        // Try online update first
        const serverMaterial = await apiClient.put<Material>(
          API_ENDPOINTS.MATERIAL_BY_ID(data.id), 
          data
        );
        await offlineDb.saveMaterial(serverMaterial);
        await offlineDb.markAsSynced('material', data.id);
        return serverMaterial;
      } catch (error) {
        console.warn('Online material update failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    return this.applyOptimisticUpdate('material', 'update', optimisticMaterial, data, data.id);
  }

  async deleteMaterial(id: string): Promise<void> {
    if (navigator.onLine) {
      try {
        // Try online deletion first
        await apiClient.delete(API_ENDPOINTS.MATERIAL_BY_ID(id));
        
        // Soft delete locally
        const materials = await offlineDb.getMaterials('');
        const material = materials.find(m => m.id === id);
        if (material) {
          await offlineDb.saveMaterial({ ...material, isDeleted: true });
        }
        return;
      } catch (error) {
        console.warn('Online material deletion failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic update
    const materials = await offlineDb.getMaterials('');
    const material = materials.find(m => m.id === id);
    if (material) {
      await this.applyOptimisticUpdate('material', 'delete', material, { id }, id);
    }
  }

  // Bulk operations
  async bulkUpdateMaterials(jobId: string, materialIds: string[], purchased: boolean): Promise<Material[]> {
    const materials = await offlineDb.getMaterials(jobId);
    const targetMaterials = materials.filter(m => materialIds.includes(m.id));
    
    if (targetMaterials.length === 0) {
      return [];
    }

    const now = new Date();
    const optimisticMaterials = targetMaterials.map(material => ({
      ...material,
      purchased,
      purchasedAt: purchased ? now : null,
      purchasedById: purchased ? 'current-user' : null,
      updatedAt: now,
    }));

    if (navigator.onLine) {
      try {
        // Try online bulk update first
        const serverMaterials = await apiClient.put<Material[]>(
          API_ENDPOINTS.MATERIALS_BULK_UPDATE,
          { jobId, materialIds, purchased }
        );
        await offlineDb.saveMaterials(serverMaterials);
        
        // Mark all as synced
        for (const material of serverMaterials) {
          await offlineDb.markAsSynced('material', material.id);
        }
        
        return serverMaterials;
      } catch (error) {
        console.warn('Online bulk material update failed, falling back to optimistic update:', error);
      }
    }

    // Fallback to optimistic updates
    await offlineDb.saveMaterials(optimisticMaterials);
    
    // Queue individual sync operations for each material
    for (const material of optimisticMaterials) {
      await syncService.queueOperation({
        operation: 'update',
        entityType: 'material',
        entityId: material.id,
        payload: {
          id: material.id,
          purchased: material.purchased,
          purchasedAt: material.purchasedAt,
          purchasedById: material.purchasedById,
        },
        timestamp: new Date(),
      });
    }

    return optimisticMaterials;
  }

  /**
   * Get pending updates for debugging
   */
  getPendingUpdates(): Map<string, any> {
    return new Map(this.pendingUpdates);
  }

  /**
   * Clear all pending updates (use with caution)
   */
  clearPendingUpdates(): void {
    this.pendingUpdates.clear();
  }

  /**
   * Check if an entity has pending updates
   */
  hasPendingUpdate(entityType: string, entityId: string): boolean {
    for (const [updateId, update] of this.pendingUpdates) {
      if (update.entityType === entityType && updateId.includes(entityId)) {
        return true;
      }
    }
    return false;
  }
}

export const optimisticUpdatesService = new OptimisticUpdatesService();