import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const LoginForm = () => {
  const navigate = useNavigate();
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
      const success = await authService.login(password);
      
      if (success) {
        // Clear password from memory
        setPassword('');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      // Login failed
      setError((error as Error).message || 'Login failed. Please try again.');
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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F3F4F6',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '20px',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '32px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '32.2px', 
              fontWeight: '700',
              color: '#111827',
            }}>
              KHS CRM
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '16.1px',
              color: '#6B7280',
            }}>
              Sign in to continue
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px',
              fontSize: '16.1px',
              fontWeight: '500',
              color: '#374151',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '16.1px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
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
                {error}
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: isLoading ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16.1px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2563EB';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#3B82F6';
              }
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '14.95px',
              color: '#6B7280',
              textAlign: 'center',
            }}>
              🔒 Your data is secured with local authentication and encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};