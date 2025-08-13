import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useBiometric } from '../stores/auth.store';
import { offlineAuthService } from '../services/offline-auth.service';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isBiometricEnabled, biometricLogin } = useBiometric();
  const isOnline = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [enableBiometricOption, setEnableBiometricOption] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  useEffect(() => {
    // Check if biometric authentication is supported
    const checkBiometricSupport = async () => {
      const supported = await offlineAuthService.isBiometricSupported();
      setBiometricSupported(supported);
    };
    
    checkBiometricSupport();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(
        {
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        },
        enableBiometricOption && biometricSupported
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricEnabled) return;
    
    setError('');
    setIsLoading(true);

    try {
      await biometricLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">KHS CRM</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        {/* Connection Status */}
        <div className={`border rounded-lg p-4 ${
          isOnline 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-400' : 'bg-yellow-400'
            }`}></div>
            <p className={`text-sm font-medium ${
              isOnline ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </p>
          </div>
          {!isOnline && (
            <p className="text-xs text-yellow-700 mt-1">
              You can still sign in with stored credentials
            </p>
          )}
        </div>
        
        {/* Demo Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-sm text-blue-800">
            <p>Owner: owner@khs.com / password123</p>
            <p>Worker: worker@khs.com / password123</p>
          </div>
        </div>
        
        {/* Biometric Login Option */}
        {isBiometricEnabled && biometricSupported && (
          <div className="text-center">
            <button
              onClick={handleBiometricLogin}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {isLoading ? 'Authenticating...' : 'Sign in with Biometric'}
            </button>
            <p className="text-xs text-gray-500 mt-2">Or sign in with your password below</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me for 30 days
              </label>
            </div>
            
            {biometricSupported && !isBiometricEnabled && (
              <div className="flex items-center">
                <input
                  id="enable-biometric"
                  name="enable-biometric"
                  type="checkbox"
                  checked={enableBiometricOption}
                  onChange={(e) => setEnableBiometricOption(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="enable-biometric" className="ml-2 block text-sm text-gray-900">
                  Enable biometric login (fingerprint/face ID)
                </label>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;