import { useState, useEffect, useRef } from 'react';
import { teamSync } from '../services/teamSync';
import { toast } from 'react-toastify';

export const AutoSyncPanel = () => {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncFolderPath, setSyncFolderPath] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncStats, setSyncStats] = useState({
    customers: 0,
    jobs: 0,
    workers: 0
  });

  useEffect(() => {
    // Load settings
    const savedTime = localStorage.getItem('khs-crm-last-sync');
    const savedAutoSync = localStorage.getItem('khs-crm-auto-sync') === 'true';
    const savedPath = localStorage.getItem('khs-crm-sync-path') || '';
    
    if (savedTime) {
      setLastSync(new Date(savedTime));
    }
    setAutoSyncEnabled(savedAutoSync);
    setSyncFolderPath(savedPath);

    // Update stats
    updateStats();

    // Check for auto-sync on startup
    if (savedAutoSync) {
      checkForNewSync();
    }
  }, []);

  // Auto-sync check every 30 seconds when enabled
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(() => {
      checkForNewSync();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [autoSyncEnabled]);

  const updateStats = () => {
    setSyncStats({
      customers: JSON.parse(localStorage.getItem('khs-crm-customers') || '[]').length,
      jobs: JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]').length,
      workers: JSON.parse(localStorage.getItem('khs-crm-workers') || '[]').length
    });
  };

  const checkForNewSync = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      // Show prompt to select file from OneDrive
      toast.info('Select the latest sync file from your OneDrive folder', {
        autoClose: false,
        toastId: 'sync-check'
      });
      
      // Programmatically click the file input
      fileInputRef.current?.click();
    } catch (error) {
      console.error('Auto-sync check failed:', error);
    } finally {
      setIsChecking(false);
      toast.dismiss('sync-check');
    }
  };

  const handleExport = async () => {
    await teamSync.exportForCloudSync();
    
    // Update last sync time
    const now = new Date();
    setLastSync(now);
    localStorage.setItem('khs-crm-last-sync', now.toISOString());
    
    toast.success('Sync file downloaded! Save it to your OneDrive sync folder.');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if this is a newer file
    const fileDate = new Date(file.lastModified);
    if (lastSync && fileDate <= lastSync) {
      toast.info('This sync file is not newer than your current data.');
      return;
    }

    const success = await teamSync.importFromFile(file);
    if (success) {
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('khs-crm-last-sync', now.toISOString());
      updateStats();
      
      toast.success('Data synced successfully!');
      // Reload to show new data
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const toggleAutoSync = () => {
    const newState = !autoSyncEnabled;
    setAutoSyncEnabled(newState);
    localStorage.setItem('khs-crm-auto-sync', newState.toString());
    
    if (newState) {
      toast.info('Auto-sync enabled! The app will check for updates periodically.');
      checkForNewSync();
    } else {
      toast.info('Auto-sync disabled.');
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '24px' }}>🔄</span>
        Auto-Sync with OneDrive
      </h2>

      {/* Auto-sync Toggle */}
      <div style={{
        padding: '16px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={autoSyncEnabled}
            onChange={toggleAutoSync}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer'
            }}
          />
          <div>
            <div style={{ fontWeight: '500' }}>Enable Auto-Sync</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Automatically check for new sync files on startup
            </div>
          </div>
        </label>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#3B82F6' }}>
            {syncStats.customers}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Customers</div>
        </div>
        <div style={{
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#10B981' }}>
            {syncStats.jobs}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Jobs</div>
        </div>
        <div style={{
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#F59E0B' }}>
            {syncStats.workers}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Workers</div>
        </div>
      </div>

      {/* Last Sync */}
      {lastSync && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#E0F2FE',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#0369A1',
          marginBottom: '16px'
        }}>
          Last sync: {lastSync.toLocaleString()}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>📤</span>
          Export Team Data
        </button>

        <label style={{
          flex: 1,
          padding: '12px',
          backgroundColor: '#10B981',
          color: 'white',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>📥</span>
          Import Team Data
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>

        {autoSyncEnabled && (
          <button
            onClick={checkForNewSync}
            disabled={isChecking}
            style={{
              padding: '12px',
              backgroundColor: isChecking ? '#9CA3AF' : '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{isChecking ? '⏳' : '🔍'}</span>
            Check Now
          </button>
        )}
      </div>

      {/* Setup Instructions */}
      <div style={{
        backgroundColor: '#FEF3C7',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400E' }}>
          📁 OneDrive Setup:
        </h3>
        <ol style={{ margin: '0', paddingLeft: '20px', color: '#92400E' }}>
          <li>Create a folder in OneDrive: <strong>"KHS CRM Sync"</strong></li>
          <li>When exporting, save files there with date/time in name</li>
          <li>Enable auto-sync to check for updates automatically</li>
          <li>Team members use the same folder for syncing</li>
        </ol>
      </div>
    </div>
  );
};