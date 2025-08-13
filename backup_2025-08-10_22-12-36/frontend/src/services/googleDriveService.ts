// Google Drive service for file storage and management
import { toast } from 'react-toastify';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  thumbnailLink?: string;
}

interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  scope: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenClient: any = null;
  private gapiInited = false;
  private gisInited = false;
  private config: GoogleDriveConfig;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
    };
  }

  async init(): Promise<void> {
    try {
      if (!this.config.clientId || !this.config.apiKey) {
        console.error('Google Drive credentials not configured');
        return;
      }

      // Load Google API client library
      await this.loadGoogleAPIs();
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      // Don't throw - let the app continue working
    }
  }

  private async loadGoogleAPIs(): Promise<void> {
    // Load GAPI script with timeout
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          window.gapi.load('client', async () => {
            try {
              await window.gapi.client.init({
                apiKey: this.config.apiKey,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              });
              this.gapiInited = true;
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        };
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.body.appendChild(script);
      }),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Google API loading timeout')), 10000)
      )
    ]);

    // Load Google Identity Services with timeout
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          try {
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: this.config.clientId,
              scope: this.config.scope,
              callback: (response: any) => {
                if (response.error) {
                  console.error('Token error:', response);
                  toast.error('Failed to authenticate with Google Drive');
                  return;
                }
                this.accessToken = response.access_token;
                localStorage.setItem('khs-google-drive-token', this.accessToken);
                toast.success('Connected to Google Drive');
              },
            });
            this.gisInited = true;
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.body.appendChild(script);
      }),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Google Identity Services loading timeout')), 10000)
      )
    ]);
  }

  async authenticate(): Promise<boolean> {
    if (!this.gapiInited || !this.gisInited) {
      await this.init();
    }

    return new Promise((resolve) => {
      if (this.accessToken) {
        resolve(true);
        return;
      }

      // Check for stored token
      const storedToken = localStorage.getItem('khs-google-drive-token');
      if (storedToken) {
        this.accessToken = storedToken;
        window.gapi.client.setToken({ access_token: storedToken });
        resolve(true);
        return;
      }

      // Request new token
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken();
        // Wait for callback to complete
        const checkToken = setInterval(() => {
          if (this.accessToken) {
            clearInterval(checkToken);
            window.gapi.client.setToken({ access_token: this.accessToken });
            resolve(true);
          }
        }, 100);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkToken);
          resolve(false);
        }, 30000);
      } else {
        resolve(false);
      }
    });
  }

  async createFolder(name: string, parentId?: string): Promise<GoogleDriveFile | null> {
    if (!await this.authenticate()) {
      toast.error('Please authenticate with Google Drive first');
      return null;
    }

    try {
      const metadata: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentId) {
        metadata.parents = [parentId];
      }

      const response = await window.gapi.client.drive.files.create({
        resource: metadata,
        fields: 'id, name, mimeType, createdTime, modifiedTime, webViewLink'
      });

      return response.result as GoogleDriveFile;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      return null;
    }
  }

  async listFiles(folderId?: string, query?: string): Promise<GoogleDriveFile[]> {
    if (!await this.authenticate()) {
      return [];
    }

    try {
      let q = "trashed = false";
      
      if (folderId) {
        q += ` and '${folderId}' in parents`;
      }
      
      if (query) {
        q += ` and name contains '${query}'`;
      }

      const response = await window.gapi.client.drive.files.list({
        q,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, thumbnailLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 100
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      toast.error('Failed to list files');
      return [];
    }
  }

  async uploadFile(file: File, folderId?: string, onProgress?: (progress: number) => void): Promise<GoogleDriveFile | null> {
    if (!await this.authenticate()) {
      toast.error('Please authenticate with Google Drive first');
      return null;
    }

    try {
      const metadata: any = {
        name: file.name,
        mimeType: file.type
      };

      if (folderId) {
        metadata.parents = [folderId];
      }

      // Create form data
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            toast.success(`Uploaded ${file.name} to Google Drive`);
            resolve(result);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink');
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        xhr.send(form);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!await this.authenticate()) {
      return false;
    }

    try {
      await window.gapi.client.drive.files.delete({
        fileId
      });
      toast.success('File deleted');
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
      return false;
    }
  }

  async downloadFile(fileId: string, fileName: string): Promise<void> {
    if (!await this.authenticate()) {
      return;
    }

    try {
      const response = await window.gapi.client.drive.files.get({
        fileId,
        alt: 'media'
      });

      // Create blob and download
      const blob = new Blob([response.body], { type: response.headers['Content-Type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${fileName}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  }

  async getFileMetadata(fileId: string): Promise<GoogleDriveFile | null> {
    if (!await this.authenticate()) {
      return null;
    }

    try {
      const response = await window.gapi.client.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, thumbnailLink'
      });

      return response.result as GoogleDriveFile;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.clientId && this.config.apiKey);
  }

  isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  signOut(): void {
    this.accessToken = null;
    localStorage.removeItem('khs-google-drive-token');
    if (window.gapi && window.gapi.client) {
      window.gapi.client.setToken(null);
    }
    toast.info('Signed out of Google Drive');
  }
}

// Create singleton instance
export const googleDriveService = new GoogleDriveService();

// Export types
export type { GoogleDriveFile, GoogleDriveConfig };