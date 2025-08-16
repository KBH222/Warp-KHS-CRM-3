import { useState, useEffect } from 'react';
import { googleDriveService, GoogleDriveFile } from '../services/googleDriveService';
import { toast } from 'react-toastify';

interface GoogleDriveIntegrationProps {
  folderId?: string;
  onFileSelect?: (file: GoogleDriveFile) => void;
  allowUpload?: boolean;
  allowDelete?: boolean;
  fileTypes?: string[];
}

export const GoogleDriveIntegration: React.FC<GoogleDriveIntegrationProps> = ({
  folderId,
  onFileSelect,
  allowUpload = true,
  allowDelete = true,
  fileTypes = []
}) => {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated, folderId]);

  const checkAuthStatus = async () => {
    await googleDriveService.init();
    setIsAuthenticated(googleDriveService.isAuthenticated());
  };

  const handleAuthenticate = async () => {
    setLoading(true);
    const success = await googleDriveService.authenticate();
    setIsAuthenticated(success);
    setLoading(false);
    
    if (success) {
      loadFiles();
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    const fileList = await googleDriveService.listFiles(folderId, searchQuery);
    setFiles(fileList);
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type if restrictions are set
    if (fileTypes.length > 0 && !fileTypes.includes(file.type)) {
      toast.error(`File type not allowed. Allowed types: ${fileTypes.join(', ')}`);
      return;
    }

    setLoading(true);
    const uploadedFile = await googleDriveService.uploadFile(
      file,
      folderId,
      (progress) => setUploadProgress(progress)
    );
    
    if (uploadedFile) {
      await loadFiles();
    }
    
    setUploadProgress(null);
    setLoading(false);
    event.target.value = ''; // Reset input
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Delete ${fileName}?`)) return;

    setLoading(true);
    const success = await googleDriveService.deleteFile(fileId);
    if (success) {
      await loadFiles();
    }
    setLoading(false);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    await googleDriveService.downloadFile(fileId, fileName);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!googleDriveService.isConfigured()) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#92400E' }}>
          Google Drive Not Configured
        </h3>
        <p style={{ margin: 0, color: '#92400E' }}>
          Google Drive credentials are not configured. Please check your environment variables.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '16px' }}>Connect to Google Drive</h3>
        <p style={{ marginBottom: '20px', color: '#6B7280' }}>
          Sign in to access and manage your files in Google Drive
        </p>
        <button
          onClick={handleAuthenticate}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '18.4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="white"/>
          </svg>
          {loading ? 'Connecting...' : 'Connect with Google'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0 }}>Google Drive Files</h3>
          <button
            onClick={() => googleDriveService.signOut()}
            style={{
              padding: '4px 8px',
              backgroundColor: '#E5E7EB',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Sign Out
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadFiles()}
            style={{
              padding: '8px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '16.1px',
              width: '200px'
            }}
          />

          {/* Upload Button */}
          {allowUpload && (
            <label style={{
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16.1px',
              display: 'inline-block'
            }}>
              Upload
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={loading}
                style={{ display: 'none' }}
                accept={fileTypes.join(',')}
              />
            </label>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadFiles}
            disabled={loading}
            style={{
              padding: '8px',
              backgroundColor: '#E5E7EB',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#3B82F6',
              height: '100%',
              width: `${uploadProgress}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ fontSize: '13.8px', color: '#6B7280', marginTop: '4px' }}>
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* Files List */}
      {loading && uploadProgress === null ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#6B7280' }}>No files found</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '12px'
        }}>
          {files.map(file => (
            <div
              key={file.id}
              style={{
                padding: '16px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: onFileSelect ? 'pointer' : 'default'
              }}
              onClick={() => onFileSelect?.(file)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* File icon */}
                  <span style={{ fontSize: '23px' }}>
                    {file.mimeType?.includes('folder') ? '📁' :
                     file.mimeType?.includes('image') ? '🖼️' :
                     file.mimeType?.includes('pdf') ? '📄' :
                     file.mimeType?.includes('spreadsheet') ? '📊' :
                     file.mimeType?.includes('document') ? '📝' : '📎'}
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{file.name}</h4>
                    <p style={{ margin: 0, fontSize: '13.8px', color: '#6B7280' }}>
                      {formatFileSize(file.size)} • {formatDate(file.modifiedTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {/* View Button */}
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#E5E7EB',
                      color: '#374151',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    View
                  </a>
                )}

                {/* Download Button */}
                {file.webContentLink && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.id, file.name);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Download
                  </button>
                )}

                {/* Delete Button */}
                {allowDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id, file.name);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};