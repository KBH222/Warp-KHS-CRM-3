import { useState, useEffect } from 'react';
import { googleDriveService } from '../services/googleDriveService';

interface GoogleDriveStatusProps {
  onSyncComplete?: () => void;
}

export const GoogleDriveStatus = ({ onSyncComplete }: GoogleDriveStatusProps) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastGoogleSync, setLastGoogleSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      checkStatus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const checkStatus = async () => {
    try {
      await googleDriveService.init();
      setIsSignedIn(googleDriveService.isAuthenticated());
      if (googleDriveService.isAuthenticated()) {
        loadLastSyncTime();
      }
      if (!googleDriveService.isConfigured()) {
        setError('Google Drive not configured');
      }
    } catch (err) {
      console.error('Failed to initialize Google Drive:', err);
      setError('Failed to initialize Google Drive');
    }
  };

  const loadLastSyncTime = async () => {
    try {
      const syncTime = localStorage.getItem('khs-crm-google-sync');
      if (syncTime) {
        setLastGoogleSync(new Date(syncTime));
      }
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      const success = await googleDriveService.authenticate();
      if (success) {
        setIsSignedIn(true);
        await loadLastSyncTime();
      } else {
        setError('Failed to sign in');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
    }
  };

  const handleSignOut = async () => {
    try {
      googleDriveService.signOut();
      setIsSignedIn(false);
      setLastGoogleSync(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message || 'Failed to sign out');
    }
  };

  const handleSync = async () => {
    try {
      setError(null);
      setIsSyncing(true);

      // Create or get KHS CRM folder
      const folders = await googleDriveService.listFiles(undefined, 'KHS CRM Data');
      let folderId = folders.find(f => f.name === 'KHS CRM Data')?.id;
      
      if (!folderId) {
        const folder = await googleDriveService.createFolder('KHS CRM Data');
        folderId = folder?.id;
      }

      if (!folderId) {
        throw new Error('Failed to create Google Drive folder');
      }

      // Get local data
      const jobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
      const timestamp = new Date().toISOString();

      // Upload jobs data
      const jobsBlob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
      const jobsFile = new File([jobsBlob], `jobs_${timestamp}.json`, { type: 'application/json' });
      
      await googleDriveService.uploadFile(jobsFile, folderId);

      // Update sync timestamp
      localStorage.setItem('khs-crm-google-sync', timestamp);

      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));

      setLastGoogleSync(new Date());
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setError(error.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!googleDriveService.isConfigured()) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#FEE2E2',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #FCA5A5'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#DC2626' }}>⚠️</span>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#991B1B' }}>
              Google Drive not configured
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#991B1B' }}>
              Google Drive API credentials are missing. Please check your environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#F9FAFB',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #E5E7EB'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '14px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>☁️ Google Drive Sync</span>
            {isSignedIn && (
              <span style={{
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: '#10B981',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                Connected
              </span>
            )}
          </h3>
          {error && (
            <p style={{ 
              margin: '4px 0', 
              fontSize: '12px', 
              color: '#DC2626' 
            }}>
              ⚠️ {error}
            </p>
          )}
          {isSignedIn && lastGoogleSync && (
            <p style={{ 
              margin: '4px 0', 
              fontSize: '12px', 
              color: '#6B7280' 
            }}>
              Last cloud sync: {lastGoogleSync ? lastGoogleSync.toLocaleTimeString() : 'Never'}
            </p>
          )}
          {!isSignedIn && (
            <p style={{ 
              margin: '4px 0', 
              fontSize: '12px', 
              color: '#6B7280' 
            }}>
              Sign in to sync across devices
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isSignedIn ? (
            <button
              onClick={handleSignIn}
              style={{
                padding: '6px 16px',
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                style={{
                  padding: '6px 16px',
                  backgroundColor: isSyncing ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isSyncing ? (
                  <>
                    <span style={{ 
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Syncing...
                  </>
                ) : (
                  <>☁️ Sync with Drive</>
                )}
              </button>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};