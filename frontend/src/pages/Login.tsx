import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid email or password');
      }

      const { token, refreshToken, user } = await response.json();
      
      // Store tokens and user data
      localStorage.setItem('khs-crm-token', token);
      localStorage.setItem('khs-crm-refresh-token', refreshToken);
      localStorage.setItem('khs-crm-user', JSON.stringify(user));
      
      // Navigate to dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="max-w-md w-full">
        <div style={{
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Logo/Title */}
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>KHS CRM</h1>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>Sign in to your account</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isLoading ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #E5E7EB',
            color: '#6B7280',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>Default credentials:</p>
            <code style={{
              backgroundColor: '#F3F4F6',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'block',
              fontFamily: 'monospace'
            }}>
              Email: admin@khscrm.com<br />
              Password: admin123
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;