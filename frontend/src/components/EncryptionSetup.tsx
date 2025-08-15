import { useState } from 'react';
import { encryptionService } from '../services/encryptionService';

interface EncryptionSetupProps {
  onComplete: () => void;
}

export const EncryptionSetup = ({ onComplete }: EncryptionSetupProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSetup = async () => {
    setError(null);

    // Validate passwords
    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Initialize encryption with the password
      await encryptionService.initialize(password);

      // Test encryption
      const testPassed = await encryptionService.test();
      if (!testPassed) {
        throw new Error('Encryption test failed');
      }

      // Clear password from memory
      setPassword('');
      setConfirmPassword('');

      // Mark encryption as set up
      localStorage.setItem('khs-crm-encryption-enabled', 'true');

      onComplete();
    } catch (error) {
      // Encryption setup failed
      setError('Failed to set up encryption. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#F9FAFB',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #E5E7EB',
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '18px', 
        fontWeight: '600',
      }}>
        🔐 Set Up Encryption
      </h3>

      <p style={{ 
        margin: '0 0 20px 0', 
        fontSize: '14px',
        color: '#6B7280',
      }}>
        Create a master password to encrypt sensitive data. This password will be required to access encrypted information.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          Master Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter master password"
            style={{
              width: '100%',
              padding: '8px 40px 8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm master password"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '6px',
          marginBottom: '16px',
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '14px',
            color: '#DC2626',
          }}>
            ⚠️ {error}
          </p>
        </div>
      )}

      <div style={{
        padding: '12px',
        backgroundColor: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '6px',
        marginBottom: '16px',
      }}>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px',
          fontWeight: '600',
          color: '#92400E',
        }}>
          Important Security Notes:
        </h4>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '20px',
          fontSize: '13px',
          color: '#92400E',
        }}>
          <li>Choose a strong password that you haven't used elsewhere</li>
          <li>This password cannot be recovered if forgotten</li>
          <li>Write it down and store it in a secure location</li>
          <li>You'll need this password on each device</li>
        </ul>
      </div>

      <button
        onClick={handleSetup}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: isLoading ? '#9CA3AF' : '#10B981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          width: '100%',
        }}
      >
        {isLoading ? 'Setting up encryption...' : 'Set Up Encryption'}
      </button>
    </div>
  );
};