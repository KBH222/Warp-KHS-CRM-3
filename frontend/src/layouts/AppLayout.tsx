import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '../stores/auth.store';
import { useState, useEffect } from 'react';

// Icons - using simple SVGs for now
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const AppLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    // Temporarily disabled service initialization
    // Will be restored once services are fixed
    setIsBiometricEnabled(false);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // Logout failed - force navigation
      navigate('/login');
    }
  };

  const handleToggleBiometric = async () => {
    // Temporarily disabled
    alert('Biometric authentication is temporarily unavailable.');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm flex-shrink-0 z-30 relative">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">KHS CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2 rounded-lg hover:bg-gray-100"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-4 top-14 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role.toLowerCase()}</p>
            </div>
            
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/offline-dashboard');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                Offline Dashboard
              </div>
            </button>
            
            <button
              onClick={handleToggleBiometric}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Biometric Login
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  isBiometricEnabled ? 'bg-green-400' : 'bg-gray-300'
                }`}></div>
              </div>
            </button>
            
            <div className="border-t border-gray-200 my-2"></div>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </div>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area with proper scrolling */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <Outlet />
        </main>
      </div>
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowMenu(false)}
        />
      )}
      
    </div>
  );
};