const API_URL = import.meta.env.VITE_API_URL || '';

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

async function getAuthToken(): Promise<string | null> {
  // Try multiple token locations (same as auth.api.ts)
  return localStorage.getItem('auth-token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('khs-crm-token') ||
         sessionStorage.getItem('auth-token') ||
         sessionStorage.getItem('token') ||
         null;
}

export const khsToolsSyncApi = {
  // Get the current tools sync data from the database
  async get(): Promise<KHSToolsSyncData> {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/khs-tools-sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tools sync data: ${response.status}`);
    }

    return response.json();
  },

  // Update the tools sync data in the database
  async update(data: Partial<KHSToolsSyncData>): Promise<KHSToolsSyncData> {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/khs-tools-sync`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error: any = new Error(`Failed to update tools sync data: ${response.status}`);
      error.response = { status: response.status };
      throw error;
    }

    return response.json();
  }
};