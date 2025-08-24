import { Outlet } from 'react-router-dom';
import { useUser } from '../stores/auth.store';
import { useState, useEffect } from 'react';

export const AppLayout = () => {
  const user = useUser();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header bg-white shadow-sm">
        <div className="h-14 flex items-center">
          <div className="w-full max-w-[1200px] mx-auto px-5 flex items-center justify-between">
            <h1 
              className="text-lg font-semibold text-gray-900" 
              style={isMobile ? {
                marginLeft: 'auto',
                marginRight: 'auto',
                flex: '1',
                textAlign: 'center'
              } : {
                marginLeft: '375px'
              }}
            >
              KHS CRM
            </h1>
            {!isMobile && (
              <span className="text-sm text-gray-600">
                {user?.name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};