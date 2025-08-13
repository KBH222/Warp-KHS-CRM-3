import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface SyncStatus {
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: Date | null;
}

// Mock sync status for now - will be replaced with real sync service
const useSyncStatus = (): SyncStatus => {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingChanges: 0,
    lastSyncTime: null,
  });

  useEffect(() => {
    // Simulate sync status updates
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return status;
};

export const SyncStatusIndicator = () => {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingChanges, lastSyncTime } = useSyncStatus();

  const formatLastSync = (date: Date | null) => {
    if (!date) {
return 'Never';
}
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
return 'Just now';
}
    if (minutes === 1) {
return '1 minute ago';
}
    if (minutes < 60) {
return `${minutes} minutes ago`;
}
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
return '1 hour ago';
}
    if (hours < 24) {
return `${hours} hours ago`;
}
    
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed bottom-24 right-4 bg-white rounded-lg shadow-md border border-gray-200 p-3 z-30">
      <div className="flex items-center space-x-3">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isSyncing ? (
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : isOnline ? (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {isSyncing ? 'Syncing...' : isOnline ? 'All changes saved' : 'Offline mode'}
          </p>
          {pendingChanges > 0 && !isOnline && (
            <p className="text-xs text-gray-500">{pendingChanges} pending changes</p>
          )}
          <p className="text-xs text-gray-500">
            Last sync: {formatLastSync(lastSyncTime)}
          </p>
        </div>
      </div>
    </div>
  );
};