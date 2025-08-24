import { API_BASE_URL } from '../config';

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
  private getAuthHeaders() {
    const token = localStorage.getItem('khs-crm-token') || localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  async getSettings(): Promise<ToolSettings> {
    const response = await fetch(`${API_BASE_URL}/api/tools/settings`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tool settings: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateSettings(settings: Partial<ToolSettings>): Promise<ToolSettings> {
    const response = await fetch(`${API_BASE_URL}/api/tools/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update tool settings: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getItems(): Promise<ToolItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/tools/items`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tool items: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateItem(id: string, isChecked: boolean): Promise<ToolItem> {
    const response = await fetch(`${API_BASE_URL}/api/tools/items/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isChecked })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update tool item: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createItem(listId: string, name: string, quantity?: string, notes?: string): Promise<ToolItem> {
    const response = await fetch(`${API_BASE_URL}/api/tools/items`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ listId, name, quantity, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create tool item: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/tools/items/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete tool item: ${response.statusText}`);
    }
  }

  async clearList(listId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/tools/lists/${listId}/clear`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear tool list: ${response.statusText}`);
    }
  }
}

export const toolsAPI = new ToolsAPI();