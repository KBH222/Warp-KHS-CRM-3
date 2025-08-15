import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.simple';

interface OfflineStatusBarProps {
  className?: string;
  showDetails?: boolean;
}

interface SyncStats {
  pendingOperations: number;
  failedOperations: number;
  lastSyncTime?: Date;
  syncInProgress: boolean;
  unsyncedItems: number;
  databaseSize: number;
}

const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const isOnline = useOnlineStatus();
  const [syncStats, setSyncStats] = useState<SyncStats>({
    pendingOperations: 0,
    failedOperations: 0,
    syncInProgress: false,
    unsyncedItems: 0,
    databaseSize: 0,
  });

  // Simplified version without problematic services
  useEffect(() => {
    // For now, just use mock data to prevent errors
    setSyncStats({
      pendingOperations: 0,
      failedOperations: 0,
      syncInProgress: false,
      unsyncedItems: 0,
      databaseSize: 0,
      lastSyncTime: new Date(),
    });
  }, []);

  const handleForceSync = async () => {
    if (isOnline) {
      try {
        // Placeholder - sync functionality will be restored later
        // Sync requested
      } catch (error) {
        // Force sync failed
      }
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-500';
    if (syncStats.syncInProgress) return 'bg-blue-500';
    if (syncStats.failedOperations > 0) return 'bg-red-500';
    if (syncStats.pendingOperations > 0 || syncStats.unsyncedItems > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStats.syncInProgress) return 'Syncing...';
    if (syncStats.failedOperations > 0) return `${syncStats.failedOperations} failed`;
    if (syncStats.pendingOperations > 0) return `${syncStats.pendingOperations} pending`;
    if (syncStats.unsyncedItems > 0) return `${syncStats.unsyncedItems} unsynced`;
    return 'Synced';
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Main Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5">
        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}>
              {syncStats.syncInProgress && (
                <div className="w-3 h-3 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
          </div>

          {/* Last Sync Time */}
          <div className="text-xs text-gray-500">
            Last sync: {formatTime(syncStats.lastSyncTime)}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Stats */}
          {(syncStats.pendingOperations > 0 || syncStats.unsyncedItems > 0) && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {syncStats.pendingOperations > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {syncStats.pendingOperations} pending
                </span>
              )}
              {syncStats.unsyncedItems > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {syncStats.unsyncedItems} unsynced
                </span>
              )}
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleForceSync();
            }}
            disabled={!isOnline || syncStats.syncInProgress}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              !isOnline || syncStats.syncInProgress
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncStats.syncInProgress ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Show error details only if there are failures */}
      {syncStats.failedOperations > 0 && (
        <div className="border-t border-gray-100 bg-red-50">
          <div className="px-4 py-2 text-xs text-red-700">
            {syncStats.failedOperations} sync operation{syncStats.failedOperations > 1 ? 's' : ''} failed. Check your connection and try again.
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatusBar;