import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecuritySettings as SecuritySettingsType, DEFAULT_SECURITY_SETTINGS, DataClassification, AuditLogEntry } from '../types/security';
import { auditService } from '../services/auditService';
import { encryptionService } from '../services/encryptionService';
import { EncryptionSetup } from '../components/EncryptionSetup';
import { EncryptionLogin } from '../components/EncryptionLogin';

const SETTINGS_KEY = 'khs-crm-security-settings';

export const SecuritySettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SecuritySettingsType>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SECURITY_SETTINGS;
  });

  const [auditStats, setAuditStats] = useState<{
    totalEntries: number;
    byAction: Record<string, number>;
    byDataType: Record<string, number>;
    recentFailures: AuditLogEntry[];
  } | null>(null);
  const [showAuditDetails, setShowAuditDetails] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);

  useEffect(() => {
    // Save settings whenever they change
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    auditService.logAccess('write', 'security-settings', DataClassification.INTERNAL, settings);
  }, [settings]);

  useEffect(() => {
    // Load audit statistics
    setAuditStats(auditService.getStats());
    
    // Check encryption status
    const isEnabled = localStorage.getItem('khs-crm-encryption-enabled') === 'true';
    setEncryptionEnabled(isEnabled);
    setEncryptionReady(encryptionService.isReady());
  }, []);

  const handleToggle = (key: keyof SecuritySettingsType) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSyncTypeToggle = (classification: DataClassification) => {
    setSettings(prev => {
      const types = [...prev.allowedSyncTypes];
      const index = types.indexOf(classification);
      
      if (index > -1) {
        types.splice(index, 1);
      } else {
        types.push(classification);
      }
      
      return { ...prev, allowedSyncTypes: types };
    });
  };

  const clearAuditLog = () => {
    if (window.confirm('Are you sure you want to clear the audit log? This action cannot be undone.')) {
      auditService.clearAuditLog();
      setAuditStats(auditService.getStats());
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0 }}>Security Settings</h1>
        <button 
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#E5E7EB',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </div>

      {/* Security Status Alert */}
      <div style={{
        padding: '16px',
        backgroundColor: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#92400E' }}>
          🔒 Security Status
        </h3>
        <p style={{ margin: 0, color: '#92400E' }}>
          Customer data sync is permanently disabled for security. All customer information is stored locally only.
        </p>
      </div>

      {/* Encryption Setup */}
      {showEncryptionSetup && (
        <EncryptionSetup 
          onComplete={() => {
            setShowEncryptionSetup(false);
            setEncryptionEnabled(true);
            setEncryptionReady(true);
            // Update settings
            setSettings(prev => ({ ...prev, enableEncryption: true }));
          }}
        />
      )}

      {/* Encryption Login */}
      {encryptionEnabled && !encryptionReady && !showEncryptionSetup && (
        <EncryptionLogin 
          onSuccess={() => {
            setEncryptionReady(true);
          }}
          onSkip={() => {
            // Continue without encryption
            setSettings(prev => ({ ...prev, enableEncryption: false }));
          }}
        />
      )}

      {/* Core Security Settings */}
      <div style={{
        backgroundColor: '#F9FAFB',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Core Security</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={settings.enableAuditLogging}
              onChange={() => handleToggle('enableAuditLogging')}
            />
            <span>Enable Audit Logging</span>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>
              (Track all data access and modifications)
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={settings.enableEncryption}
              onChange={() => {
                if (!settings.enableEncryption && !encryptionEnabled) {
                  // Show setup when enabling
                  setShowEncryptionSetup(true);
                } else {
                  handleToggle('enableEncryption');
                }
              }}
            />
            <span>Enable Encryption</span>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>
              (Encrypt sensitive data at rest)
              {encryptionReady && <span style={{ color: '#10B981' }}> ✓ Active</span>}
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={settings.requireAuthentication}
              onChange={() => handleToggle('requireAuthentication')}
            />
            <span>Require Authentication</span>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>
              (Require login to access app)
            </span>
          </label>
        </div>
      </div>

      {/* Sync Settings */}
      <div style={{
        backgroundColor: '#F9FAFB',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Sync Settings</h2>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <input
            type="checkbox"
            checked={settings.syncEnabled}
            onChange={() => handleToggle('syncEnabled')}
          />
          <span>Enable Data Sync</span>
          <span style={{ color: '#DC2626', fontSize: '14px', fontWeight: '500' }}>
            (Customer data will never sync regardless of this setting)
          </span>
        </label>

        {settings.syncEnabled && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input
                type="checkbox"
                checked={settings.localNetworkSyncOnly}
                onChange={() => handleToggle('localNetworkSyncOnly')}
              />
              <span>Local Network Only</span>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>
                (Sync only on local WiFi network)
              </span>
            </label>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Allowed Data Types for Sync:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={settings.allowedSyncTypes.includes(DataClassification.PUBLIC)}
                    onChange={() => handleSyncTypeToggle(DataClassification.PUBLIC)}
                  />
                  <span>Public Data</span>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>
                    (App settings, preferences)
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={settings.allowedSyncTypes.includes(DataClassification.INTERNAL)}
                    onChange={() => handleSyncTypeToggle(DataClassification.INTERNAL)}
                  />
                  <span>Internal Data</span>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>
                    (Job information, schedules)
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={settings.allowedSyncTypes.includes(DataClassification.CONFIDENTIAL)}
                    onChange={() => handleSyncTypeToggle(DataClassification.CONFIDENTIAL)}
                  />
                  <span>Confidential Data</span>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>
                    (Worker information - requires encryption)
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                  />
                  <span>Restricted Data</span>
                  <span style={{ color: '#DC2626', fontSize: '14px' }}>
                    (Customer PII - never syncs)
                  </span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Audit Log Stats */}
      {auditStats && (
        <div style={{
          backgroundColor: '#F9FAFB',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Audit Log Statistics</h2>
            <button
              onClick={() => setShowAuditDetails(!showAuditDetails)}
              style={{
                padding: '4px 12px',
                backgroundColor: '#E5E7EB',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showAuditDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6B7280' }}>
                Total Entries
              </h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                {auditStats.totalEntries}
              </p>
            </div>

            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6B7280' }}>
                Recent Failures
              </h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#DC2626' }}>
                {auditStats.recentFailures.length}
              </p>
            </div>
          </div>

          {showAuditDetails && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ margin: '16px 0 8px 0', fontSize: '16px' }}>By Action Type:</h3>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {Object.entries(auditStats.byAction).map(([action, count]) => (
                  <div key={action} style={{ marginBottom: '4px' }}>
                    {action}: {count}
                  </div>
                ))}
              </div>

              <h3 style={{ margin: '16px 0 8px 0', fontSize: '16px' }}>By Data Type:</h3>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {Object.entries(auditStats.byDataType).map(([type, count]) => (
                  <div key={type} style={{ marginBottom: '4px' }}>
                    {type}: {count}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={clearAuditLog}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Clear Audit Log
          </button>
        </div>
      )}
    </div>
  );
};