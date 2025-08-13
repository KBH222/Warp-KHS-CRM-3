// Google Drive Sync Service for KHS CRM
declare const gapi: any;

// Google Drive API Configuration
// These are OAuth2 client-side credentials (safe for frontend)
// The API key is restricted to specific domains and APIs
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_API_KEY';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const FOLDER_NAME = 'KHS-CRM-Data';
const CUSTOMERS_FILE = 'customers.json';
const JOBS_FILE = 'jobs.json';

export class GoogleDriveSync {
  private isInitialized = false;
  private folderId: string | null = null;

  // Check if credentials are configured
  isConfigured(): boolean {
    return CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' && API_KEY !== 'YOUR_API_KEY';
  }

  // Initialize Google API
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(() => {
          this.isInitialized = true;
          resolve();
        }).catch(reject);
      });
    });
  }

  // Sign in with Google
  async signIn(): Promise<void> {
    if (!this.isInitialized) await this.init();
    const auth = gapi.auth2.getAuthInstance();
    await auth.signIn();
  }

  // Sign out
  async signOut(): Promise<void> {
    const auth = gapi.auth2.getAuthInstance();
    await auth.signOut();
  }

  // Check if user is signed in
  isSignedIn(): boolean {
    if (!this.isInitialized) return false;
    const auth = gapi.auth2.getAuthInstance();
    return auth.isSignedIn.get();
  }

  // Get or create the KHS-CRM-Data folder
  private async getOrCreateFolder(): Promise<string> {
    if (this.folderId) return this.folderId;

    // Search for existing folder
    const response = await gapi.client.drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.result.files && response.result.files.length > 0) {
      this.folderId = response.result.files[0].id;
      return this.folderId;
    }

    // Create new folder
    const folderMetadata = {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await gapi.client.drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    this.folderId = folder.result.id;
    return this.folderId;
  }

  // Upload or update a file
  private async uploadFile(fileName: string, content: unknown): Promise<void> {
    const folderId = await this.getOrCreateFolder();
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    // Search for existing file
    const searchResponse = await gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)'
    });

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folderId]
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(content, null, 2) +
      close_delim;

    if (searchResponse.result.files && searchResponse.result.files.length > 0) {
      // Update existing file
      await gapi.client.request({
        path: `/upload/drive/v3/files/${searchResponse.result.files[0].id}`,
        method: 'PATCH',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody
      });
    } else {
      // Create new file
      await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody
      });
    }
  }

  // Download a file
  private async downloadFile(fileName: string): Promise<unknown> {
    const folderId = await this.getOrCreateFolder();

    // Search for the file
    const searchResponse = await gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)'
    });

    if (!searchResponse.result.files || searchResponse.result.files.length === 0) {
      return null;
    }

    // Download file content
    const fileId = searchResponse.result.files[0].id;
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });

    return response.result;
  }

  // Sync customers data - with selective field filtering
  async syncCustomers(localData: unknown[]): Promise<unknown[]> {
    if (!this.isSignedIn()) throw new Error('Not signed in to Google');

    // Import the sync policy
    const { filterForSync } = await import('../types/dataSyncPolicy');
    
    // Filter each customer to only sync allowed fields
    const dataToSync = localData.map(customer => 
      filterForSync(customer as Record<string, any>, 'customers')
    );

    // Upload filtered data
    await this.uploadFile(CUSTOMERS_FILE, dataToSync);

    // Download and merge with local data
    const cloudData = await this.downloadFile(CUSTOMERS_FILE);
    
    // Merge cloud data with local-only fields
    if (cloudData && Array.isArray(cloudData)) {
      const { extractLocalOnly } = await import('../types/dataSyncPolicy');
      return localData.map((localCustomer: any) => {
        const cloudCustomer = cloudData.find((c: any) => c.id === localCustomer.id);
        if (cloudCustomer) {
          // Merge cloud data with local-only fields preserved
          return { ...cloudCustomer, ...extractLocalOnly(localCustomer, 'customers') };
        }
        return localCustomer;
      });
    }
    
    return localData;
  }

  // Sync jobs data
  async syncJobs(localData: unknown[]): Promise<unknown[]> {
    if (!this.isSignedIn()) throw new Error('Not signed in to Google');

    // Upload local data
    await this.uploadFile(JOBS_FILE, localData);

    // Download and return the latest data
    const cloudData = await this.downloadFile(JOBS_FILE);
    return cloudData || localData;
  }

  // Full sync - upload and download all data with field filtering
  async fullSync(customers: unknown[], jobs: unknown[]): Promise<{ customers: unknown[], jobs: unknown[] }> {
    if (!this.isSignedIn()) throw new Error('Not signed in to Google');

    // Import the sync policy
    const { filterForSync, extractLocalOnly } = await import('../types/dataSyncPolicy');

    // Filter data for sync
    const customersToSync = customers.map(c => filterForSync(c as Record<string, any>, 'customers'));
    const jobsToSync = jobs.map(j => filterForSync(j as Record<string, any>, 'jobs'));

    // Upload filtered data
    await Promise.all([
      this.uploadFile(CUSTOMERS_FILE, customersToSync),
      this.uploadFile(JOBS_FILE, jobsToSync)
    ]);

    // Download all data
    const [cloudCustomers, cloudJobs] = await Promise.all([
      this.downloadFile(CUSTOMERS_FILE),
      this.downloadFile(JOBS_FILE)
    ]);

    // Merge cloud data with local-only fields
    const mergedCustomers = this.mergeWithLocalData(customers, cloudCustomers, 'customers');
    const mergedJobs = this.mergeWithLocalData(jobs, cloudJobs, 'jobs');

    return {
      customers: mergedCustomers,
      jobs: mergedJobs
    };
  }

  // Get last sync time from metadata
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const folderId = await this.getOrCreateFolder();
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: 1
      });

      if (response.result.files && response.result.files.length > 0) {
        return new Date(response.result.files[0].modifiedTime);
      }
    } catch (error) {
      console.error('Error getting last sync time:', error);
    }
    return null;
  }

  // Helper to merge cloud data with local-only fields
  private mergeWithLocalData(
    localData: unknown[], 
    cloudData: unknown, 
    category: string
  ): unknown[] {
    if (!cloudData || !Array.isArray(cloudData)) {
      return localData;
    }

    const { extractLocalOnly } = require('../types/dataSyncPolicy');

    return localData.map((localItem: any) => {
      const cloudItem = cloudData.find((c: any) => c.id === localItem.id);
      if (cloudItem) {
        // Merge: cloud data + preserved local-only fields
        const localOnlyFields = extractLocalOnly(localItem, category);
        return { ...cloudItem, ...localOnlyFields };
      }
      return localItem;
    });
  }
}

// Export singleton instance
export const googleDriveSync = new GoogleDriveSync();