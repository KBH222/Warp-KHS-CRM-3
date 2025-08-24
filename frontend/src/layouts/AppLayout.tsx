import { Outlet } from 'react-router-dom';
import { useUser } from '../stores/auth.store';
import { useState, useEffect } from 'react';
import { profileStorage } from '../utils/localStorage';

export const AppLayout = () => {
  const user = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(32);
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
    // Load logo, size, and abbreviation from profile
    const profile = profileStorage.get();
    if (profile) {
      if (profile.businessLogo) {
        setLogoUrl(profile.businessLogo);
      }
      if (profile.businessLogoSize) {
        setLogoSize(profile.businessLogoSize);
      }
      if (profile.businessAbbreviation) {
        setCompanyAbbreviation(profile.businessAbbreviation);
      }
    }

    // Listen for storage changes to update logo, size, and abbreviation
    const handleStorageChange = () => {
      const updatedProfile = profileStorage.get();
      if (updatedProfile) {
        if (updatedProfile.businessLogo) {
          setLogoUrl(updatedProfile.businessLogo);
        }
        if (updatedProfile.businessLogoSize) {
          setLogoSize(updatedProfile.businessLogoSize);
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
                  className="object-contain flex-shrink-0"
                  style={{ 
                    width: `${logoSize}px`, 
                    height: `${logoSize}px`,
                    maxWidth: `${logoSize}px`, 
                    maxHeight: `${logoSize}px` 
                  }}
                />
              ) : (
                <div 
                  className="bg-blue-500 rounded flex items-center justify-center text-white font-bold"
                  style={{ 
                    width: `${logoSize}px`, 
                    height: `${logoSize}px`,
                    fontSize: `${Math.floor(logoSize * 0.5)}px`
                  }}
                >
                  {companyAbbreviation.charAt(0)}
                </div>
              )}
              <span>{companyAbbreviation}</span>
              <span style={{ marginLeft: '6px' }}>CRM3</span>
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