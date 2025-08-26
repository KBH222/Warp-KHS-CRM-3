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
  const sources = [
    { storage: 'localStorage', key: 'auth-token' },
    { storage: 'localStorage', key: 'token' },
    { storage: 'localStorage', key: 'khs-crm-token' },
    { storage: 'sessionStorage', key: 'auth-token' },
    { storage: 'sessionStorage', key: 'token' }
  ];
  
  for (const source of sources) {
    try {
      const storage = source.storage === 'localStorage' ? localStorage : sessionStorage;
      const token = storage.getItem(source.key);
      if (token) {
        console.log(`[KHSToolsSync] Found auth token in ${source.storage}:${source.key}`);
        return token;
      }
    } catch (error) {
      console.error(`[KHSToolsSync] Error accessing ${source.storage}:`, error);
    }
  }
  
  console.warn('[KHSToolsSync] No auth token found in any storage location');
  return null;
}

export const khsToolsSyncApi = {
  // Get the current tools sync data from the database
  async get(): Promise<KHSToolsSyncData> {
    const token = await getAuthToken();
    const url = `${API_URL}/api/khs-tools-sync`;
    
    console.log('[KHSToolsSync] GET request:', { 
      url, 
      hasToken: !!token,
      apiUrl: API_URL 
    });
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[KHSToolsSync] GET response:', { 
        status: response.status, 
        ok: response.ok 
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[KHSToolsSync] GET error response:', errorText);
        throw new Error(`Failed to fetch tools sync data: ${response.status}`);
      }

      const data = await response.json();
      console.log('[KHSToolsSync] GET data received:', { 
        version: data.version,
        hasTools: !!data.tools 
      });
      
      return data;
    } catch (error) {
      console.error('[KHSToolsSync] GET request failed:', error);
      throw error;
    }
  },

  // Update the tools sync data in the database
  async update(data: Partial<KHSToolsSyncData>): Promise<KHSToolsSyncData> {
    const token = await getAuthToken();
    const url = `${API_URL}/api/khs-tools-sync`;
    
    console.log('[KHSToolsSync] PUT request:', { 
      url, 
      hasToken: !!token,
      version: data.version 
    });
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('[KHSToolsSync] PUT response:', { 
        status: response.status, 
        ok: response.ok 
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[KHSToolsSync] PUT error response:', errorText);
        const error: any = new Error(`Failed to update tools sync data: ${response.status}`);
        error.response = { status: response.status };
        throw error;
      }

      const responseData = await response.json();
      console.log('[KHSToolsSync] PUT data received:', { 
        version: responseData.version 
      });
      
      return responseData;
    } catch (error) {
      console.error('[KHSToolsSync] PUT request failed:', error);
      throw error;
    }
  }
};