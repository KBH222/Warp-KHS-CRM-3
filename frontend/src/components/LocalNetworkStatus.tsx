import { useState, useEffect } from 'react';
import { localNetworkSync } from '../services/localNetworkSync';
import { DataClassification } from '../types/security';

interface LocalNetworkStatusProps {
  onSyncComplete?: () => void;
}

export const LocalNetworkStatus = ({ onSyncComplete }: LocalNetworkStatusProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check for local network sync availability
    const checkConnection = () => {
      const activePeers = localNetworkSync.getActivePeers();
      setPeers(activePeers);
      setIsConnected(activePeers.length > 0);
    };

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    try {
      setError(null);
      setIsSyncing(true);

      // Get data to sync (only non-restricted data)
      const jobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
      const materials = JSON.parse(localStorage.getItem('khs-crm-materials') || '[]');

      // Sync each data type
      await localNetworkSync.syncData('jobs', jobs, DataClassification.INTERNAL);
      await localNetworkSync.syncData('materials', materials, DataClassification.PUBLIC);

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      // Local sync error
      setError(error.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      await localNetworkSync.initialize();
    } catch (error: any) {
      // Connection error
      setError('Failed to connect to local network');
    }
  };

  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#F9FAFB',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #E5E7EB',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '14px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📡 Local Network Sync</span>
            {isConnected ? (
              <span style={{
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: '#10B981',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '500',
              }}>
                {peers.length} device{peers.length !== 1 ? 's' : ''} found
              </span>
            ) : (
              <span style={{
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: '#6B7280',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '500',
              }}>
                Not connected
              </span>
            )}
          </h3>
          {error && (
            <p style={{ 
              margin: '4px 0', 
              fontSize: '12px', 
              color: '#DC2626',
            }}>
              ⚠️ {error}
            </p>
          )}
          <p style={{ 
            margin: '4px 0', 
            fontSize: '12px', 
            color: '#6B7280',
          }}>
            Sync data with devices on the same WiFi network
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              style={{
                padding: '6px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Connect
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
                  gap: '6px',
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
                      animation: 'spin 1s linear infinite',
                    }} />
                    Syncing...
                  </>
                ) : (
                  <>📡 Sync Now</>
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
                  fontWeight: '500',
                }}
              >
                {showDetails ? 'Hide' : 'Show'} Devices
              </button>
            </>
          )}
        </div>
      </div>

      {showDetails && peers.length > 0 && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #E5E7EB',
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '14px', 
            fontWeight: '600',
          }}>
            Connected Devices:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {peers.map(peer => (
              <div 
                key={peer.id}
                style={{
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '16px' }}>
                  {peer.name.includes('iPhone') || peer.name.includes('Android') ? '📱' : '💻'}
                </span>
                <span style={{ fontWeight: '500' }}>{peer.name}</span>
                <span style={{ 
                  fontSize: '11px', 
                  color: '#6B7280',
                  marginLeft: 'auto',
                }}>
                  ID: {peer.id.substring(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDetails && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#EFF6FF',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#1E40AF',
        }}>
          <strong>Note:</strong> Only job and material data syncs over local network. 
          Customer information remains on this device only for privacy.
        </div>
      )}
    </div>
  );
};