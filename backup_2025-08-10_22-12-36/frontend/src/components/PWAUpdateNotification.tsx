import { useState, useEffect } from 'react';
import { useRegisterSW } from '../hooks/usePWARegister';

interface UpdateInfo {
  version?: string;
  features?: string[];
  isUrgent?: boolean;
}

const UPDATE_FEATURES = [
  'Improved offline sync reliability',
  'Enhanced job status tracking',
  'Better material list management',
  'Performance improvements for field use',
  'Bug fixes and stability updates'
];

export const PWAUpdateNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({});
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('Service Worker registered successfully');
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed:', error);
    },
    onNeedRefresh() {
      setShowNotification(true);
      setUpdateInfo({
        version: '2.1.0', // This would come from your app version
        features: UPDATE_FEATURES.slice(0, 3), // Show top 3 features
        isUrgent: false
      });
    },
    onOfflineReady() {
      console.log('App is ready to work offline');
      // Could show a toast notification here
    },
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Track update acceptance
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_update_accepted', {
          version: updateInfo.version || 'unknown',
          update_type: updateInfo.isUrgent ? 'urgent' : 'regular'
        });
      }
      
      await updateServiceWorker(true);
      
      // Show updating message briefly before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    setNeedRefresh(false);
    
    // Track update dismissal
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_update_dismissed', {
        version: updateInfo.version || 'unknown'
      });
    }
  };

  const handleLater = () => {
    setShowNotification(false);
    
    // Show again in 24 hours for non-urgent updates
    if (!updateInfo.isUrgent) {
      localStorage.setItem('pwa-update-remind', 
        (Date.now() + 24 * 60 * 60 * 1000).toString()
      );
    }
  };

  useEffect(() => {
    // Check if we should remind about update
    const remindTime = localStorage.getItem('pwa-update-remind');
    if (remindTime && Date.now() > parseInt(remindTime) && needRefresh) {
      setShowNotification(true);
      localStorage.removeItem('pwa-update-remind');
    }
  }, [needRefresh]);

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                updateInfo.isUrgent ? 'bg-orange-500' : 'bg-green-500'
              }`}>
                <span className="text-2xl">
                  {updateInfo.isUrgent ? '⚠️' : '🔄'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {updateInfo.isUrgent ? 'Important Update' : 'App Update Available'}
                </h3>
                <p className="text-sm text-gray-600">
                  {updateInfo.version && `Version ${updateInfo.version}`}
                </p>
              </div>
            </div>
            {!updateInfo.isUrgent && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              {updateInfo.isUrgent 
                ? 'This update contains critical fixes for field operations. We recommend installing it now.'
                : 'A new version with improvements and bug fixes is available.'
              }
            </p>
            
            {updateInfo.features && updateInfo.features.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 text-sm mb-2">What's New:</h4>
                <ul className="space-y-1">
                  {updateInfo.features.map((feature, index) => (
                    <li key={index} className="text-xs text-blue-700 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {updateInfo.isUrgent && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <span className="text-orange-500 text-sm">⚠️</span>
                <p className="text-xs text-orange-700">
                  <strong>Critical Update:</strong> This update fixes important issues that may affect your work in the field. 
                  The update will take less than 30 seconds.
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`flex-1 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                updateInfo.isUrgent 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isUpdating ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Updating...</span>
                </span>
              ) : (
                `${updateInfo.isUrgent ? 'Install Critical Update' : 'Update Now'}`
              )}
            </button>
            
            {!updateInfo.isUrgent && (
              <button
                onClick={handleLater}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Later
              </button>
            )}
          </div>

          {!updateInfo.isUrgent && (
            <p className="text-xs text-gray-500 text-center mt-3">
              The app will continue to work normally. You can update anytime from Settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};