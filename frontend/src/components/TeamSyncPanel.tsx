import { useState, useEffect } from 'react';
import { teamSync } from '../services/teamSync';
import { toast } from 'react-toastify';

export const TeamSyncPanel = () => {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({
    customers: 0,
    jobs: 0,
    workers: 0
  });

  useEffect(() => {
    // Load last sync time
    const savedTime = localStorage.getItem('khs-crm-last-sync');
    if (savedTime) {
      setLastSync(new Date(savedTime));
    }

    // Update stats
    updateStats();
  }, []);

  const updateStats = () => {
    setSyncStats({
      customers: JSON.parse(localStorage.getItem('khs-crm-customers') || '[]').length,
      jobs: JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]').length,
      workers: JSON.parse(localStorage.getItem('khs-crm-workers') || '[]').length
    });
  };

  const handleExport = async () => {
    await teamSync.exportForCloudSync();
    toast.success('Sync file downloaded! Share this with your team via OneDrive, email, or USB.');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await teamSync.importFromFile(file);
    if (success) {
      setLastSync(new Date());
      updateStats();
      // Reload to show new data
      setTimeout(() => window.location.reload(), 1500);
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
        <span style={{ fontSize: '27.6px' }}>👥</span>
        Team Data Sync
      </h2>

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
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16.1px',
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
          fontSize: '16.1px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>📥</span>
          Import Team Data
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Instructions */}
      <div style={{
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '16.1px',
        lineHeight: '1.6'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16.1px', fontWeight: '600' }}>
          🚀 How Team Sync Works:
        </h3>
        <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
          <li><strong>Export:</strong> Creates a sync file with all your data</li>
          <li><strong>Share:</strong> Save to OneDrive, email, or USB drive</li>
          <li><strong>Import:</strong> Team members import the file to sync</li>
        </ol>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#FEF3C7',
          borderRadius: '6px',
          marginTop: '12px'
        }}>
          <strong style={{ color: '#92400E' }}>💡 Pro Tip:</strong>
          <div style={{ color: '#92400E', marginTop: '4px' }}>
            Set up a shared OneDrive folder called "KHS CRM Sync". 
            Save exports there and team members can grab the latest file anytime!
          </div>
        </div>
      </div>
    </div>
  );
};