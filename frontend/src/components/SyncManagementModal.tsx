import React, { useState, useEffect } from 'react';
import { syncService } from '../services/sync.service';
import { offlineDb } from '../services/db.service';
// Inline type definitions
interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'job' | 'material' | 'user';
  entityId?: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
}

interface SyncManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SyncQueueItem extends SyncOperation {
  _priority: number;
  _attempts: number;
  _status: 'pending' | 'processing' | 'failed' | 'completed';
  _lastAttempt?: number;
}

interface DatabaseStats {
  size: number;
  customers: number;
  jobs: number;
  materials: number;
  pendingSync: number;
  unsynced: number;
  lastSync?: Date;
}

const SyncManagementModal: React.FC<SyncManagementModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'stats' | 'conflicts'>('queue');
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadData();
      const interval = setInterval(loadData, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [queue, stats] = await Promise.all([
        offlineDb.getSyncQueue(),
        offlineDb.getDatabaseStats(),
      ]);

      setSyncQueue(queue as SyncQueueItem[]);
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load sync management data:', error);
    }
  };

  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      await syncService.forceSync();
      await loadData();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('Are you sure you want to clear the entire sync queue? This cannot be undone.')) {
      setIsLoading(true);
      try {
        await syncService.clearSyncQueue();
        await loadData();
      } catch (error) {
        console.error('Failed to clear sync queue:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRetrySelected = async () => {
    if (selectedItems.size === 0) return;

    setIsLoading(true);
    try {
      for (const operationId of selectedItems) {
        await offlineDb.updateSyncOperationStatus(operationId, 'pending');
      }
      setSelectedItems(new Set());
      await loadData();
      // Trigger sync to process the retried items
      syncService.forceSync();
    } catch (error) {
      console.error('Failed to retry selected operations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;

    if (window.confirm(`Are you sure you want to remove ${selectedItems.size} operations from the queue?`)) {
      setIsLoading(true);
      try {
        for (const operationId of selectedItems) {
          await offlineDb.removeSyncOperation(operationId);
        }
        setSelectedItems(new Set());
        await loadData();
      } catch (error) {
        console.error('Failed to remove selected operations:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === syncQueue.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(syncQueue.map(item => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'bg-red-100 text-red-800';
    if (priority <= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: string | number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Sync Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'queue', label: 'Sync Queue', count: syncQueue.length },
              { key: 'stats', label: 'Database Stats' },
              { key: 'conflicts', label: 'Conflicts', count: syncQueue.filter(q => q._attempts > 0).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Sync Queue Tab */}
          {activeTab === 'queue' && (
            <div className="h-full flex flex-col">
              {/* Queue Actions */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === syncQueue.length && syncQueue.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Select All ({selectedItems.size} selected)
                      </span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRetrySelected}
                      disabled={selectedItems.size === 0 || isLoading}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      Retry Selected
                    </button>
                    <button
                      onClick={handleRemoveSelected}
                      disabled={selectedItems.size === 0 || isLoading}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                    >
                      Remove Selected
                    </button>
                    <button
                      onClick={handleForceSync}
                      disabled={isLoading}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                      {isLoading ? 'Syncing...' : 'Force Sync'}
                    </button>
                    <button
                      onClick={handleClearQueue}
                      disabled={isLoading}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Queue List */}
              <div className="flex-1 overflow-auto">
                {syncQueue.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    No operations in sync queue
                  </div>
                ) : (
                  <div className="divide-y">
                    {syncQueue.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                            className="rounded border-gray-300"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item._status)}`}>
                                  {item._status}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item._priority)}`}>
                                  Priority {item._priority}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {item.operation} {item.entityType}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {item._attempts > 0 && `${item._attempts} attempts • `}
                                {formatTime(item.timestamp)}
                              </div>
                            </div>

                            <div className="mt-1 text-sm text-gray-600">
                              ID: {item.entityId || 'new'}
                              {item._lastAttempt && (
                                <span className="ml-4">
                                  Last attempt: {formatTime(item._lastAttempt)}
                                </span>
                              )}
                            </div>

                            {/* Payload Preview */}
                            <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                              <pre className="whitespace-pre-wrap overflow-hidden">
                                {JSON.stringify(item.payload, null, 2).substring(0, 200)}
                                {JSON.stringify(item.payload).length > 200 && '...'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Database Stats Tab */}
          {activeTab === 'stats' && dbStats && (
            <div className="p-6 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatBytes(dbStats.size)}</div>
                  <div className="text-blue-800">Database Size</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dbStats.customers}</div>
                  <div className="text-green-800">Customers</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dbStats.jobs}</div>
                  <div className="text-purple-800">Jobs</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{dbStats.materials}</div>
                  <div className="text-orange-800">Materials</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{dbStats.pendingSync}</div>
                  <div className="text-yellow-800">Pending Sync</div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{dbStats.unsynced}</div>
                  <div className="text-red-800">Unsynced Items</div>
                </div>
              </div>

              {dbStats.lastSync && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Last successful sync: {formatTime(dbStats.lastSync.getTime())}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conflicts Tab */}
          {activeTab === 'conflicts' && (
            <div className="p-6 overflow-auto">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Conflict Resolution</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Conflicts are automatically resolved using the configured strategy.
                  {syncQueue.filter(q => q._attempts > 0).length > 0 && (
                    <span className="block mt-2">
                      {syncQueue.filter(q => q._attempts > 0).length} operations have failed and may need manual resolution.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncManagementModal;