import { Outlet } from 'react-router-dom';
import { useUser } from '../stores/auth.store';
import { useState, useEffect } from 'react';
import { profileStorage } from '../utils/localStorage';

export const AppLayout = () => {
  const user = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [companyAbbreviation, setCompanyAbbreviation] = useState<string>('KHS');

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Load logo and abbreviation from profile
    const profile = profileStorage.get();
    if (profile) {
      if (profile.businessLogo) {
        setLogoUrl(profile.businessLogo);
      }
      if (profile.businessAbbreviation) {
        setCompanyAbbreviation(profile.businessAbbreviation);
      }
    }

    // Listen for storage changes to update logo and abbreviation
    const handleStorageChange = () => {
      const updatedProfile = profileStorage.get();
      if (updatedProfile) {
        if (updatedProfile.businessLogo) {
          setLogoUrl(updatedProfile.businessLogo);
        }
        if (updatedProfile.businessAbbreviation) {
          setCompanyAbbreviation(updatedProfile.businessAbbreviation);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header bg-white shadow-sm">
        <div className="h-14 flex items-center">
          <div className="w-full max-w-[1200px] mx-auto px-5 flex items-center justify-between">
            <h1 
              className="font-semibold text-gray-900 flex items-center gap-2" 
              style={isMobile ? {
                marginLeft: 'auto',
                marginRight: 'auto',
                flex: '1',
                textAlign: 'center',
                fontSize: '26px',
                justifyContent: 'center'
              } : {
                marginLeft: '375px',
                fontSize: '26px'
              }}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="KHS Logo" 
                  className="w-8 h-8 object-contain flex-shrink-0"
                  style={{ maxWidth: '32px', maxHeight: '32px' }}
                />
              ) : (
                <div 
                  className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold"
                >
                  {companyAbbreviation.charAt(0)}
                </div>
              )}
              <span>{companyAbbreviation}</span>
              <span style={{ marginLeft: '6px' }}>CRM</span>
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