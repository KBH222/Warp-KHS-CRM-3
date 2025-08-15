import { useState, useEffect } from 'react';
import { googleDriveSync } from '../services/googleDriveSync';
import { SYNC_POLICY } from '../types/dataSyncPolicy';

interface PracticalSyncStatusProps {
  onSyncComplete?: () => void;
}

export const PracticalSyncStatus = ({ onSyncComplete }: PracticalSyncStatusProps) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      if (googleDriveSync.isConfigured()) {
        googleDriveSync.init().then(() => {
          setIsSignedIn(googleDriveSync.isSignedIn());
          if (googleDriveSync.isSignedIn()) {
            loadLastSyncTime();
          }
        }).catch(err => {
          // Failed to initialize Google API
          setError('Google Drive not configured. See setup instructions.');
        });
      } else {
        setError('Google Drive API not configured');
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const loadLastSyncTime = async () => {
    try {
      const time = await googleDriveSync.getLastSyncTime();
      setLastSync(time);
    } catch (error) {
      // Error loading last sync time
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      await googleDriveSync.signIn();
      setIsSignedIn(true);
      await loadLastSyncTime();
    } catch (error: any) {
      // Sign in error
      setError(error.message || 'Failed to sign in');
    }
  };

  const handleSignOut = async () => {
    try {
      await googleDriveSync.signOut();
      setIsSignedIn(false);
      setLastSync(null);
    } catch (error: any) {
      // Sign out error
      setError(error.message || 'Failed to sign out');
    }
  };

  const handleSync = async () => {
    try {
      setError(null);
      setIsSyncing(true);

      // Get local data
      const customers = JSON.parse(localStorage.getItem('khs-crm-customers') || '[]');
      const jobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');

      // Sync with Google Drive (filtered fields only)
      const synced = await googleDriveSync.fullSync(customers, jobs);

      // Update local storage with synced data
      localStorage.setItem('khs-crm-customers', JSON.stringify(synced.customers));
      localStorage.setItem('khs-crm-jobs', JSON.stringify(synced.jobs));
      localStorage.setItem('khs-crm-google-sync', new Date().toISOString());

      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));

      setLastSync(new Date());
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      // Sync error
      setError(error.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!googleDriveSync.isConfigured()) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#92400E' }}>
          ⚠️ Google Drive Setup Required
        </h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#92400E' }}>
          To enable sync, add your Google API credentials to the .env file.
          See <code>.env.example</code> for instructions.
        </p>
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
          {isSignedIn && lastSync && (
            <p style={{ 
              margin: '4px 0', 
              fontSize: '12px', 
              color: '#6B7280' 
            }}>
              Last sync: {lastSync.toLocaleTimeString()}
            </p>
          )}
          {!isSignedIn && (
            <p style={{ 
              margin: '4px 0', 
              fontSize: '12px', 
              color: '#6B7280' 
            }}>
              Sign in to sync business data across devices
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  <>☁️ Sync Now</>
                )}
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {showDetails ? 'Hide' : 'Show'} Details
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

      {showDetails && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            What Syncs to Google Drive:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                ✓ Customer Info (Business Data)
              </h5>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6B7280' }}>
                <li>Names & addresses (public record)</li>
                <li>Phone & email (business contact)</li>
                <li>Job site locations</li>
                <li>General notes</li>
              </ul>
            </div>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                ✓ Job Details
              </h5>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6B7280' }}>
                <li>Project descriptions</li>
                <li>Task assignments</li>
                <li>Material lists</li>
                <li>Schedules & timelines</li>
              </ul>
            </div>
          </div>
          
          <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            What Stays Local Only:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#DC2626' }}>
                🔒 Financial Data
              </h5>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6B7280' }}>
                <li>Payment methods</li>
                <li>Credit card info</li>
                <li>Bank accounts</li>
                <li>Pricing & margins</li>
              </ul>
            </div>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#DC2626' }}>
                🔒 Private Information
              </h5>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6B7280' }}>
                <li>Social Security Numbers</li>
                <li>Private family notes</li>
                <li>Medical information</li>
                <li>Employee wages</li>
              </ul>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#EFF6FF',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#1E40AF'
          }}>
            <strong>Note:</strong> This practical approach syncs business-operational data while keeping 
            genuinely sensitive financial and personal information secure on your device.
          </div>
        </div>
      )}
    </div>
  );
};