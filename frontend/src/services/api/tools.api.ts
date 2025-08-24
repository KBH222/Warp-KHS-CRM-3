import { apiClient } from '../api.service';

export interface ToolSettings {
  id: string;
  selectedCategories: string[];
  isLocked: boolean;
  showDemo: boolean;
  showInstall: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolItem {
  id: string;
  listId: string;
  name: string;
  quantity?: string;
  isChecked: boolean;
  notes?: string;
  sortOrder: number;
  list: {
    id: string;
    name: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
  };
}

class ToolsAPI {
  async getSettings(): Promise<ToolSettings> {
    console.log('[ToolsAPI] Fetching settings using apiClient');
    const response = await apiClient.get('/api/tools/settings');
    return response.data;
  }

  async updateSettings(settings: Partial<ToolSettings>): Promise<ToolSettings> {
    const response = await apiClient.put('/api/tools/settings', settings);
    return response.data;
  }

  async getItems(): Promise<ToolItem[]> {
    const response = await apiClient.get('/api/tools/items');
    return response.data;
  }

  async updateItem(id: string, isChecked: boolean): Promise<ToolItem> {
    const response = await apiClient.put(`/api/tools/items/${id}`, { isChecked });
    return response.data;
  }

  async createItem(listId: string, name: string, quantity?: string, notes?: string): Promise<ToolItem> {
    const response = await apiClient.post('/api/tools/items', { 
      listId, 
      name, 
      quantity, 
      notes: notes || 'custom' // Mark custom items
    });
    return response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/api/tools/items/${id}`);
  }

  async clearList(listId: string): Promise<void> {
    await apiClient.put(`/api/tools/lists/${listId}/clear`);
  }
}

export const toolsAPI = new ToolsAPI();