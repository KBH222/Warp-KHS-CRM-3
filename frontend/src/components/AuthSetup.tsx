import { useState } from 'react';
import { authService } from '../services/authService';

interface AuthSetupProps {
  onComplete: () => void;
}

export const AuthSetup = ({ onComplete }: AuthSetupProps) => {
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

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    setIsLoading(true);

    try {
      // Initialize authentication
      await authService.initialize(password);

      // Clear password from memory
      setPassword('');
      setConfirmPassword('');

      onComplete();
    } catch (error) {
      // Auth setup failed
      setError('Failed to set up authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '40px auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '24px', 
        fontWeight: '600',
        textAlign: 'center',
      }}>
        Set Up Authentication
      </h2>

      <p style={{ 
        margin: '0 0 24px 0', 
        fontSize: '14px',
        color: '#6B7280',
        textAlign: 'center',
      }}>
        Create a password to secure your KHS CRM data
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
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
          placeholder="Confirm password"
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
        backgroundColor: '#EFF6FF',
        border: '1px solid #3B82F6',
        borderRadius: '6px',
        marginBottom: '20px',
      }}>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px',
          fontWeight: '600',
          color: '#1E40AF',
        }}>
          Password Requirements:
        </h4>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '20px',
          fontSize: '13px',
          color: '#1E40AF',
        }}>
          <li>At least 8 characters long</li>
          <li>Contains uppercase and lowercase letters</li>
          <li>Contains at least one number</li>
          <li>Recommended: Include special characters (!@#$%^&*)</li>
        </ul>
      </div>

      <button
        onClick={handleSetup}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: isLoading ? '#9CA3AF' : '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          width: '100%',
        }}
      >
        {isLoading ? 'Setting up...' : 'Set Up Authentication'}
      </button>
    </div>
  );
};