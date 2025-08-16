import { useState, useEffect } from 'react';
import { fileSystemSync } from '../services/fileSystemSync';

export const SimpleSyncStatus = () => {
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [autoBackup, setAutoBackup] = useState(true);

  useEffect(() => {
    // Load last backup time
    const savedTime = localStorage.getItem('khs-crm-last-backup');
    if (savedTime) {
      setLastBackup(new Date(savedTime));
    }

    // Start auto backup if enabled
    if (autoBackup) {
      fileSystemSync.startAutoBackup();
    }

    return () => {
      fileSystemSync.stopAutoBackup();
    };
  }, [autoBackup]);

  const handleManualBackup = async () => {
    await fileSystemSync.exportAllData();
    const now = new Date();
    setLastBackup(now);
    localStorage.setItem('khs-crm-last-backup', now.toISOString());
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await fileSystemSync.importFromFile(file);
    if (data) {
      // Import the data
      if (data.customers) localStorage.setItem('khs-crm-customers', JSON.stringify(data.customers));
      if (data.jobs) localStorage.setItem('khs-crm-jobs', JSON.stringify(data.jobs));
      if (data.workers) localStorage.setItem('khs-crm-workers', JSON.stringify(data.workers));
      if (data.materials) localStorage.setItem('khs-crm-materials', JSON.stringify(data.materials));
      if (data.invoices) localStorage.setItem('khs-crm-invoices', JSON.stringify(data.invoices));
      
      // Reload the page to show new data
      window.location.reload();
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#F0F9FF',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #BAE6FD'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18.4px', 
            fontWeight: '600',
            color: '#0369A1'
          }}>
            💾 Data Backup & Sync
          </h3>
          
          <div style={{ fontSize: '16.1px', color: '#0C4A6E', marginBottom: '8px' }}>
            {lastBackup ? (
              <>Last backup: {lastBackup.toLocaleTimeString()}</>
            ) : (
              <>No backups yet</>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <input
              type="checkbox"
              id="auto-backup"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
            />
            <label htmlFor="auto-backup" style={{ fontSize: '16.1px', color: '#0C4A6E' }}>
              Auto-backup every 5 minutes
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleManualBackup}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0EA5E9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16.1px',
              fontWeight: '500'
            }}
          >
            📥 Download Backup
          </button>

          <label style={{
            padding: '8px 16px',
            backgroundColor: '#10B981',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16.1px',
            fontWeight: '500',
            display: 'inline-block'
          }}>
            📤 Import Backup
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div style={{
        marginTop: '12px',
        padding: '12px',
        backgroundColor: '#DBEAFE',
        borderRadius: '6px',
        fontSize: '14.95px',
        color: '#1E40AF'
      }}>
        <strong>💡 Tip:</strong> Save backup files to your OneDrive folder for automatic cloud sync. 
        Your team can import the latest backup file to stay synchronized.
      </div>
    </div>
  );
};