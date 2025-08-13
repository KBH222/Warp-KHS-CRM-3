import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';

interface InstallBenefits {
  icon: string;
  title: string;
  description: string;
}

const FIELD_BENEFITS: InstallBenefits[] = [
  {
    icon: '🔄',
    title: 'Offline Access',
    description: 'Work in remote job sites without internet'
  },
  {
    icon: '⚡',
    title: 'Faster Loading',
    description: 'Quick access to job data and materials'
  },
  {
    icon: '📱',
    title: 'Native Feel',
    description: 'App-like experience on phone and desktop'
  },
  {
    icon: '🔔',
    title: 'Job Notifications',
    description: 'Get instant updates about project changes'
  }
];

export const PWAInstallBanner = () => {
  const { isInstallable, install, isPWA } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    // Check if banner was dismissed in the last 7 days
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedTime = new Date(dismissed).getTime();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (dismissedTime > sevenDaysAgo) {
        setIsDismissed(true);
      }
    }

    // Detect device type
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
  }, []);

  if (!isInstallable || isDismissed || isPWA) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await install();
    
    if (success) {
      // Track successful installation
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install', {
          device_type: deviceType,
          installation_prompt: showDetailed ? 'detailed' : 'simple'
        });
      }
    } else {
      setIsInstalling(false);
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
  };

  const handleShowDetails = () => {
    setShowDetailed(true);
  };

  if (showDetailed) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏗️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Install KHS CRM</h3>
                  <p className="text-sm text-gray-600">Field Operations App</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailed(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Perfect for Construction Field Work:</h4>
              <div className="space-y-3">
                {FIELD_BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-lg">{benefit.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{benefit.title}</p>
                      <p className="text-xs text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-medium text-blue-900 text-sm">
                    {deviceType === 'mobile' ? 'Mobile Installation' : 'Desktop Installation'}
                  </p>
                  <p className="text-xs text-blue-700">
                    {deviceType === 'mobile' 
                      ? 'Add to your home screen for instant access on job sites'
                      : 'Install as a desktop app for easy access from your computer'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isInstalling ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Installing...</span>
                  </span>
                ) : (
                  `Install ${deviceType === 'mobile' ? 'on Phone' : 'on Desktop'}`
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-40 max-w-md mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🏗️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">Install KHS CRM</h3>
            <p className="text-xs text-blue-100 mt-1">
              Get the full construction field app experience - works offline!
            </p>
            <button
              onClick={handleShowDetails}
              className="text-xs text-blue-200 underline mt-1 hover:text-white"
            >
              See all benefits →
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-200 hover:text-white p-1 flex-shrink-0 ml-2"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isInstalling ? 'Installing...' : 'Install App'}
        </button>
        <button
          onClick={handleShowDetails}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-400 transition-colors"
        >
          Details
        </button>
      </div>
    </div>
  );
};