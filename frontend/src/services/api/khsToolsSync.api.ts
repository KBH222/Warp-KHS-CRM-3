import { apiClient } from './base.api';

export interface KHSToolsSyncData {
  id: string;
  tools: any; // JSON object containing all tools data
  selectedDemoCategories: string[];
  selectedInstallCategories: string[];
  lockedCategories: string[];
  showDemo: boolean;
  showInstall: boolean;
  lastUpdatedBy?: string;
  lastUpdated: string;
  version: number;
}

export const khsToolsSyncApi = {
  // Get the current tools sync data from the database
  async get(): Promise<KHSToolsSyncData> {
    const response = await apiClient.get('/khs-tools-sync');
    return response.data;
  },

  // Update the tools sync data in the database
  async update(data: Partial<KHSToolsSyncData>): Promise<KHSToolsSyncData> {
    const response = await apiClient.put('/khs-tools-sync', data);
    return response.data;
  }
};