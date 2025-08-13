import { useState } from 'react';
import { usePWAFeatures } from './PWAProvider';

export const PWAStatusIndicator = () => {
  const { isPWA, isOnline, capabilities } = usePWAFeatures();
  const [showDetails, setShowDetails] = useState(false);

  if (!capabilities) return null;

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isPWA) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isPWA) return 'PWA Active';
    return 'Web App';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📵';
    if (isPWA) return '📱';
    return '🌐';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-white text-xs font-medium shadow-lg transition-all ${getStatusColor()}`}
      >
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {capabilities.deviceType === 'mobile' && (
          <span className="text-xs opacity-75">📱</span>
        )}
      </button>

      {showDetails && (
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border p-4 min-w-64">
          <h3 className="font-semibold text-gray-900 mb-3">PWA Status</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className={`font-medium ${isPWA ? 'text-green-600' : 'text-gray-900'}`}>
                {isPWA ? 'Progressive Web App' : 'Web Browser'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Connection:</span>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
                {capabilities.connectionType !== 'unknown' && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({capabilities.connectionType})
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Device:</span>
              <span className="font-medium text-gray-900 capitalize">
                {capabilities.deviceType}
              </span>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-gray-500 mb-2">Capabilities:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className={`flex items-center space-x-1 ${capabilities.supportsBackgroundSync ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{capabilities.supportsBackgroundSync ? '✓' : '✗'}</span>
                  <span>Background Sync</span>
                </div>
                <div className={`flex items-center space-x-1 ${capabilities.supportsPushNotifications ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{capabilities.supportsPushNotifications ? '✓' : '✗'}</span>
                  <span>Notifications</span>
                </div>
                <div className={`flex items-center space-x-1 ${capabilities.supportsOfflineStorage ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{capabilities.supportsOfflineStorage ? '✓' : '✗'}</span>
                  <span>Offline Storage</span>
                </div>
                <div className={`flex items-center space-x-1 ${capabilities.supportsPeriodicSync ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{capabilities.supportsPeriodicSync ? '✓' : '✗'}</span>
                  <span>Periodic Sync</span>
                </div>
              </div>
            </div>
            
            {isPWA && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-blue-600">
                  🏗️ Optimized for construction field work
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};