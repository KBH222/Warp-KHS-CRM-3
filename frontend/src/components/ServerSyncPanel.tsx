import { useState, useEffect } from 'react';
import { autoSyncService } from '../services/autoSyncService';
import { toast } from 'react-toastify';

export const ServerSyncPanel = () => {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStats, setSyncStats] = useState({
    customers: 0,
    jobs: 0,
    workers: 0
  });

  useEffect(() => {
    // Load settings
    const savedTime = localStorage.getItem('khs-crm-last-sync');
    const savedAutoSync = localStorage.getItem('khs-crm-auto-sync') === 'true';

    if (savedTime) {
      setLastSync(new Date(savedTime));
    }
    setAutoSyncEnabled(savedAutoSync);

    // Update stats
    updateStats();

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync on startup
    if (savedAutoSync && navigator.onLine) {
      handleAutoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync check every 5 minutes when enabled
  useEffect(() => {
    if (!autoSyncEnabled || !isOnline) return;

    const interval = setInterval(() => {
      handleAutoSync();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoSyncEnabled, isOnline]);

  const updateStats = () => {
    setSyncStats({
      customers: JSON.parse(localStorage.getItem('khs-crm-customers') || '[]').length,
      jobs: JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]').length,
      workers: JSON.parse(localStorage.getItem('khs-crm-workers') || '[]').length
    });
  };

  const handleAutoSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const hasUpdates = await autoSyncService.checkForUpdates();

      if (hasUpdates) {
        const serverData = await autoSyncService.downloadLatestSync();
        if (serverData) {
          autoSyncService.applySyncData(serverData);
          setLastSync(new Date(serverData.timestamp));
          updateStats();
          toast.success('✅ Auto-sync complete! Data updated.');

          // Reload after a short delay
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    if (!isOnline) {
      toast.error('You must be online to sync data');
      return;
    }

    setIsSyncing(true);
    try {
      const data = autoSyncService.prepareLocalData();
      const success = await autoSyncService.uploadSync(data);

      if (success) {
        const now = new Date();
        setLastSync(now);
        toast.success('✅ Data uploaded to sync server!');
      } else {
        toast.error('Failed to upload sync data');
      }
    } catch (error) {
      toast.error('Sync error: ' + error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!isOnline) {
      toast.error('You must be online to sync data');
      return;
    }

    setIsSyncing(true);
    try {
      const serverData = await autoSyncService.downloadLatestSync();

      if (!serverData) {
        toast.info('No sync data available on server');
        return;
      }

      // Check if server data is newer
      const serverTime = new Date(serverData.timestamp);
      if (lastSync && serverTime <= lastSync) {
        toast.info('Your data is already up to date');
        return;
      }

      autoSyncService.applySyncData(serverData);
      setLastSync(serverTime);
      updateStats();

      toast.success('✅ Data synced from server!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Sync error: ' + error);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = () => {
    const newState = !autoSyncEnabled;
    setAutoSyncEnabled(newState);
    localStorage.setItem('khs-crm-auto-sync', newState.toString());

    if (newState) {
      toast.info('🔄 Auto-sync enabled! Data will sync automatically.');
      handleAutoSync();
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
        fontSize: '20.7px',
        fontWeight: '600',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '27.6px' }}>☁️</span>
        Automatic Cloud Sync
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '13.8px',
          backgroundColor: isOnline ? '#10B981' : '#EF4444',
          color: 'white'
        }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
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
            <div style={{ fontWeight: '500' }}>Enable Automatic Sync</div>
            <div style={{ fontSize: '13.8px', color: '#6B7280', marginTop: '2px' }}>
              Syncs every 5 minutes and on startup
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
          <div style={{ fontSize: '27.6px', fontWeight: '600', color: '#3B82F6' }}>
            {syncStats.customers}
          </div>
          <div style={{ fontSize: '13.8px', color: '#6B7280' }}>Customers</div>
        </div>
        <div style={{
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '27.6px', fontWeight: '600', color: '#10B981' }}>
            {syncStats.jobs}
          </div>
          <div style={{ fontSize: '13.8px', color: '#6B7280' }}>Jobs</div>
        </div>
        <div style={{
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '27.6px', fontWeight: '600', color: '#F59E0B' }}>
            {syncStats.workers}
          </div>
          <div style={{ fontSize: '13.8px', color: '#6B7280' }}>Workers</div>
        </div>
      </div>

      {/* Last Sync */}
      {lastSync && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#E0F2FE',
          borderRadius: '6px',
          fontSize: '16.1px',
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
          disabled={!isOnline || isSyncing}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: !isOnline || isSyncing ? '#9CA3AF' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !isOnline || isSyncing ? 'not-allowed' : 'pointer',
            fontSize: '16.1px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>{isSyncing ? '⏳' : '☁️'}</span>
          Upload to Cloud
        </button>

        <button
          onClick={handleImport}
          disabled={!isOnline || isSyncing}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: !isOnline || isSyncing ? '#9CA3AF' : '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !isOnline || isSyncing ? 'not-allowed' : 'pointer',
            fontSize: '16.1px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>{isSyncing ? '⏳' : '⬇️'}</span>
          Download from Cloud
        </button>

        {autoSyncEnabled && (
          <button
            onClick={handleAutoSync}
            disabled={!isOnline || isSyncing}
            style={{
              padding: '12px',
              backgroundColor: !isOnline || isSyncing ? '#9CA3AF' : '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: !isOnline || isSyncing ? 'not-allowed' : 'pointer',
              fontSize: '16.1px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{isSyncing ? '⏳' : '🔄'}</span>
            Sync Now
          </button>
        )}
      </div>

      {/* Status Messages */}
      {!isOnline && (
        <div style={{
          backgroundColor: '#FEE2E2',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '16.1px',
          color: '#991B1B',
          marginBottom: '16px'
        }}>
          ⚠️ You're offline. Sync will resume when connection is restored.
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#F0FDF4',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '16.1px',
        lineHeight: '1.6'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16.1px', fontWeight: '600', color: '#166534' }}>
          ✨ Automatic Sync Active!
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#166534' }}>
          <li>Data syncs to your server at kenhawk.biz</li>
          <li>No manual file handling needed</li>
          <li>All team members stay updated automatically</li>
          <li>{autoSyncEnabled ? 'Syncing every 5 minutes' : 'Enable auto-sync for automatic updates'}</li>
        </ul>
      </div>
    </div>
  );
};