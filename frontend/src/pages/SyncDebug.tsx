import React, { useState, useEffect } from 'react';
import { customerServiceFixed } from '../services/customer.service.fixed';
import { simpleSyncService } from '../services/sync.service.simple';
import { offlineDb } from '../services/db.service';
import { workerService } from '../services/worker.service';

export default function SyncDebug() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>({});
  const [localData, setLocalData] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const loadData = async () => {
    try {
      // Load from service (API if online, local if offline)
      const serviceCustomers = await customerServiceFixed.getCustomers();
      setCustomers(serviceCustomers);
      addLog(`Loaded ${serviceCustomers.length} customers from service`);

      // Load directly from IndexedDB
      const dbCustomers = await offlineDb.getCustomers();
      setLocalData(dbCustomers);
      addLog(`Found ${dbCustomers.length} customers in IndexedDB`);
      
      // Load workers
      const serviceWorkers = await workerService.getAll();
      setWorkers(serviceWorkers);
      addLog(`Loaded ${serviceWorkers.length} workers`);

      // Get sync status
      const status = simpleSyncService.getSyncStatus();
      const pending = simpleSyncService.getPendingOperations();
      setSyncStatus({
        ...status,
        pendingOps: pending
      });
      addLog(`Sync queue has ${pending.length} operations`);
    } catch (error) {
      console.error('Failed to load data', error);
      addLog(`Error loading data: ${error}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const createTestCustomer = async () => {
    try {
      const customer = await customerServiceFixed.createCustomer({
        name: `Test Customer ${Date.now()}`,
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@example.com'
      });
      addLog(`Created customer: ${customer.name} (${customer.id})`);
      await loadData();
    } catch (error) {
      console.error('Failed to create customer', error);
      addLog(`Error creating customer: ${error}`);
    }
  };

  const forceSync = async () => {
    try {
      addLog('Starting force sync...');
      const result = await simpleSyncService.syncAll();
      addLog(`Sync complete: ${result.synced} synced, ${result.failed} failed`);
      await loadData();
    } catch (error) {
      console.error('Force sync failed', error);
      addLog(`Sync error: ${error}`);
    }
  };

  const refreshFromServer = async () => {
    try {
      addLog('Refreshing from server...');
      await customerServiceFixed.refreshFromServer();
      addLog('Server refresh complete');
      await loadData();
    } catch (error) {
      console.error('Refresh failed', error);
      addLog(`Refresh error: ${error}`);
    }
  };
  
  const refreshWorkers = async () => {
    try {
      addLog('Refreshing workers from server...');
      const freshWorkers = await workerService.forceRefresh();
      addLog(`Workers refresh complete: ${freshWorkers.length} workers loaded`);
      await loadData();
    } catch (error) {
      console.error('Workers refresh failed', error);
      addLog(`Workers refresh error: ${error}`);
    }
  };

  const clearSyncQueue = () => {
    simpleSyncService.clearQueue();
    addLog('Sync queue cleared');
    loadData();
  };
  
  const clearAllWorkerData = async () => {
    try {
      addLog('Clearing all worker data...');
      
      // Clear localStorage
      localStorage.removeItem('khs-crm-workers');
      addLog('Cleared worker localStorage');
      
      // Force refresh from server
      await refreshWorkers();
      
    } catch (error) {
      console.error('Clear worker data failed', error);
      addLog(`Clear worker data error: ${error}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sync Debug Dashboard</h1>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Auto-refresh (2s)</span>
        </label>
      </div>
      
      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Online:</span>{' '}
            <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
              {navigator.onLine ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Syncing:</span>{' '}
            {syncStatus.syncing ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-medium">Pending Operations:</span>{' '}
            {syncStatus.pendingOps?.length || 0}
          </div>
          <div>
            <span className="font-medium">Queue Size:</span>{' '}
            {syncStatus.queueSize || 0}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Actions</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={createTestCustomer}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Test Customer
          </button>
          <button
            onClick={forceSync}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!navigator.onLine}
          >
            Force Sync
          </button>
          <button
            onClick={refreshFromServer}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={!navigator.onLine}
          >
            Refresh from Server
          </button>
          <button
            onClick={refreshWorkers}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            disabled={!navigator.onLine}
          >
            Refresh Workers
          </button>
          <button
            onClick={clearAllWorkerData}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Clear & Refresh Workers
          </button>
          <button
            onClick={clearSyncQueue}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Sync Queue
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reload Data
          </button>
        </div>
      </div>

      {/* Data Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">
            Service Data ({customers.length})
          </h2>
          <div className="max-h-60 overflow-auto">
            {customers.map(c => (
              <div key={c.id} className="text-sm py-1 border-b">
                <span className={c.id.startsWith('temp_') ? 'text-orange-600' : ''}>
                  {c.name} - {c.id}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">
            IndexedDB Data ({localData.length})
          </h2>
          <div className="max-h-60 overflow-auto">
            {localData.map(c => (
              <div key={c.id} className="text-sm py-1 border-b">
                <span className={c.id.startsWith('temp_') ? 'text-orange-600' : ''}>
                  {c.name} - {c.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Workers Info */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">
          Workers ({workers.length})
        </h2>
        <div className="max-h-40 overflow-auto">
          {workers.map((w: any) => (
            <div key={w.id} className="text-sm py-1 border-b">
              <span className="font-medium">{w.name}</span> - {w.fullName} ({w.status})
            </div>
          ))}
        </div>
      </div>

      {/* Pending Operations */}
      {syncStatus.pendingOps?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Pending Operations</h2>
          <div className="max-h-40 overflow-auto">
            {syncStatus.pendingOps.map((op: any) => (
              <div key={op.id} className="text-sm py-1 border-b font-mono">
                {op.operation} {op.entityType} {op.entityId || 'new'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="max-h-60 overflow-auto bg-gray-100 p-2 rounded">
          {logs.map((log, i) => (
            <div key={i} className="text-xs font-mono">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}