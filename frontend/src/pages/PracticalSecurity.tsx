import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { practicalEncryption } from '../services/practicalEncryption';
import { authService } from '../services/authService';

const PracticalSecurity = () => {
  const navigate = useNavigate();
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [authEnabled, setAuthEnabled] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Check current status
    setAuthEnabled(authService.isInitialized());
    setEncryptionEnabled(practicalEncryption.isReady());
  }, []);

  const handleEnableEncryption = () => {
    if (!encryptionPassword) {
      setMessage({ type: 'error', text: 'Please enter a password for encryption' });
      return;
    }

    practicalEncryption.setPassword(encryptionPassword);
    setEncryptionEnabled(true);
    setMessage({ type: 'success', text: 'Financial data encryption enabled' });
    setEncryptionPassword('');
  };

  const handleDisableEncryption = () => {
    practicalEncryption.clear();
    setEncryptionEnabled(false);
    setMessage({ type: 'success', text: 'Encryption disabled' });
  };

  const handleSkipAuth = () => {
    localStorage.setItem('khs-crm-skip-auth', 'true');
    setMessage({ type: 'success', text: 'Authentication disabled - app will open directly' });
  };

  const handleEnableAuth = () => {
    localStorage.removeItem('khs-crm-skip-auth');
    setMessage({ type: 'success', text: 'Authentication enabled - restart app to set up' });
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
        <h1 style={{ margin: 0 }}>Practical Security Settings</h1>
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

      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEE2E2',
          border: `1px solid ${message.type === 'success' ? '#10B981' : '#DC2626'}`,
          borderRadius: '6px',
          marginBottom: '20px',
          color: message.type === 'success' ? '#064E3B' : '#991B1B'
        }}>
          {message.text}
        </div>
      )}

      {/* Practical Approach */}
      <div style={{
        backgroundColor: '#EFF6FF',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '20.7px' }}>🔧 Practical Security Approach</h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '16.1px', color: '#1E40AF' }}>
          This CRM uses a balanced security approach designed for real construction businesses:
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '16.1px', color: '#1E40AF' }}>
          <li>Customer names, addresses, and job details sync via Google Drive (public record data)</li>
          <li>Financial information (payments, pricing) stays encrypted on your device</li>
          <li>Workers can access job sites and contact customers directly</li>
          <li>Optional app password protection for device security</li>
        </ul>
      </div>

      {/* Financial Data Encryption */}
      <div style={{
        backgroundColor: '#F9FAFB',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20.7px' }}>💰 Financial Data Encryption</h2>
        
        {!encryptionEnabled ? (
          <div>
            <p style={{ margin: '0 0 16px 0', fontSize: '16.1px', color: '#6B7280' }}>
              Enable encryption to protect pricing, payment methods, and financial details.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="password"
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                placeholder="Enter encryption password"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '16.1px',
                  flex: 1
                }}
              />
              <button
                onClick={handleEnableEncryption}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px',
                  fontWeight: '500'
                }}
              >
                Enable Encryption
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 16px 0', fontSize: '16.1px', color: '#059669' }}>
              ✅ Financial data encryption is active
            </p>
            <button
              onClick={handleDisableEncryption}
              style={{
                padding: '8px 16px',
                backgroundColor: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16.1px',
                fontWeight: '500'
              }}
            >
              Disable Encryption
            </button>
          </div>
        )}
      </div>

      {/* App Password Protection */}
      <div style={{
        backgroundColor: '#F9FAFB',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20.7px' }}>🔐 App Password Protection</h2>
        
        {authEnabled ? (
          <div>
            <p style={{ margin: '0 0 16px 0', fontSize: '16.1px', color: '#6B7280' }}>
              App password is enabled. Users must log in to access the CRM.
            </p>
            <button
              onClick={handleSkipAuth}
              style={{
                padding: '8px 16px',
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16.1px',
                fontWeight: '500'
              }}
            >
              Disable Password (Direct Access)
            </button>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 16px 0', fontSize: '16.1px', color: '#6B7280' }}>
              App opens directly without password. Enable for device security.
            </p>
            <button
              onClick={handleEnableAuth}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16.1px',
                fontWeight: '500'
              }}
            >
              Enable Password Protection
            </button>
          </div>
        )}
      </div>

      {/* Data Sync Overview */}
      <div style={{
        backgroundColor: '#F9FAFB',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20.7px' }}>☁️ What Syncs vs What Stays Local</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18.4px', color: '#059669' }}>
              ✅ Syncs to Google Drive
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '16.1px', color: '#6B7280' }}>
              <li>Customer names & addresses</li>
              <li>Phone numbers & emails</li>
              <li>Job locations & descriptions</li>
              <li>Task assignments</li>
              <li>Material lists</li>
              <li>Work schedules</li>
              <li>Project photos</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18.4px', color: '#DC2626' }}>
              🔒 Stays Local Only
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '16.1px', color: '#6B7280' }}>
              <li>Payment methods</li>
              <li>Credit card details</li>
              <li>Bank account info</li>
              <li>Job pricing & margins</li>
              <li>Social Security Numbers</li>
              <li>Employee wages</li>
              <li>Private family notes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Support Info */}
      <div style={{
        backgroundColor: '#FEF3C7',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18.4px', color: '#92400E' }}>
          💡 Tips for Construction Businesses
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '16.1px', color: '#92400E' }}>
          <li>Enable financial encryption if you store payment info</li>
          <li>Use app password if multiple people access your device</li>
          <li>Google Drive sync lets workers see job details remotely</li>
          <li>Customer contact info syncs so workers can call/navigate</li>
        </ul>
      </div>
    </div>
  );
};

export default PracticalSecurity;