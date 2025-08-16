import { useState } from 'react';
import { encryptionService } from '../services/encryptionService';

interface EncryptionLoginProps {
  onSuccess: () => void;
  onSkip?: () => void;
}

export const EncryptionLogin = ({ onSuccess, onSkip }: EncryptionLoginProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError(null);

    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      // Initialize encryption with the password
      await encryptionService.initialize(password);

      // Test encryption to verify password
      const testPassed = await encryptionService.test();
      if (!testPassed) {
        throw new Error('Invalid password');
      }

      // Clear password from memory
      setPassword('');

      onSuccess();
    } catch (error) {
      // Encryption login failed
      setError('Invalid password. Please try again.');
      encryptionService.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
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
        fontSize: '20.7px', 
        fontWeight: '600',
      }}>
        🔓 Unlock Encrypted Data
      </h3>

      <p style={{ 
        margin: '0 0 20px 0', 
        fontSize: '16.1px',
        color: '#6B7280',
      }}>
        Enter your master password to access encrypted information.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px',
          fontSize: '16.1px',
          fontWeight: '500',
        }}>
          Master Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your master password"
            autoFocus
            style={{
              width: '100%',
              padding: '8px 40px 8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '16.1px',
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
              fontSize: '13.8px',
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
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
            fontSize: '16.1px',
            color: '#DC2626',
          }}>
            ⚠️ {error}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 20px',
            backgroundColor: isLoading ? '#9CA3AF' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16.1px',
            fontWeight: '500',
          }}
        >
          {isLoading ? 'Unlocking...' : 'Unlock'}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#E5E7EB',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16.1px',
              fontWeight: '500',
            }}
          >
            Skip
          </button>
        )}
      </div>

      <p style={{ 
        margin: '16px 0 0 0', 
        fontSize: '13.8px',
        color: '#9CA3AF',
        textAlign: 'center',
      }}>
        Forgot your password? Encrypted data cannot be recovered.
      </p>
    </div>
  );
};