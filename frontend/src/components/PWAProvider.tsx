import React, { createContext, useContext, useEffect, useState } from 'react';
import { PWAInstallBanner } from './PWAInstallBanner';
import { PWAUpdateNotification } from './PWAUpdateNotification';
import { OfflineIndicator } from './OfflineIndicator';
import { usePWA } from '../hooks/usePWA';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { backgroundSyncService } from '../services/background-sync.service';

interface PWAContextValue {
  isPWA: boolean;
  isOnline: boolean;
  capabilities: any;
  triggerSync: (priority?: 'critical' | 'important' | 'normal') => Promise<void>;
  checkForUpdates: () => Promise<void>;
  preloadCriticalData: () => Promise<void>;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: React.ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  // Validate children prop
  if (!children) {
    console.error('[PWAProvider] No children provided!');
    return <div>Error: PWAProvider requires children</div>;
  }
  const pwa = usePWA();
  const isOnline = useOnlineStatus();
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);

  useEffect(() => {
    // Register service worker and initialize PWA features
    const initializePWA = async () => {
      try {
        if ('serviceWorker' in navigator) {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });

          setIsServiceWorkerRegistered(true);

          // Listen for service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Show update notification
                  // Service worker update available
                }
              });
            }
          });

          // Service Worker registered successfully
        }

        // Initialize background sync if PWA is initialized
        if (pwa.isInitialized) {
          await backgroundSyncService.initialize();
        }

      } catch (error) {
        // Service Worker registration failed
      }
    };

    initializePWA();
  }, [pwa.isInitialized]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && isServiceWorkerRegistered && pwa.isInitialized) {
      // Trigger sync after coming online
      const timeoutId = setTimeout(() => {
        backgroundSyncService.triggerSync('critical').catch(console.error);
      }, 2000); // Small delay to ensure connection is stable

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, isServiceWorkerRegistered, pwa.isInitialized]);

  // Show PWA install banner for construction workers
  useEffect(() => {
    if (pwa.capabilities?.deviceType === 'mobile' && pwa.isInstallable) {
      // Show install banner after 30 seconds for mobile users
      const timeoutId = setTimeout(() => {
        // PWA installation available for mobile construction worker
      }, 30000);

      return () => clearTimeout(timeoutId);
    }
  }, [pwa.capabilities, pwa.isInstallable]);

  const contextValue: PWAContextValue = {
    isPWA: pwa.isPWA,
    isOnline,
    capabilities: pwa.capabilities,
    triggerSync: async (priority) => {
      if (isOnline) {
        await backgroundSyncService.triggerSync(priority);
      }
    },
    checkForUpdates: pwa.checkForUpdates,
    preloadCriticalData: pwa.preloadCriticalData
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}

      {/* PWA Components - only render if components are available */}
      {PWAInstallBanner && <PWAInstallBanner />}
      {/* Update notification disabled - {PWAUpdateNotification && <PWAUpdateNotification />} */}
      {OfflineIndicator && <OfflineIndicator />}

      {/* Construction-specific PWA features */}
      {pwa.isPWA && ConstructionPWAFeatures && <ConstructionPWAFeatures />}
    </PWAContext.Provider>
  );
};

// Construction-specific PWA features
const ConstructionPWAFeatures: React.FC = () => {
  const { isOnline, triggerSync } = usePWAContext();

  useEffect(() => {
    // Setup periodic sync for field workers
    const setupPeriodicSync = () => {
      // Sync critical data every 5 minutes when online
      const intervalId = setInterval(async () => {
        if (isOnline) {
          try {
            await triggerSync('critical');
          } catch (error) {
            // Periodic sync failed
          }
        }
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(intervalId);
    };

    const cleanup = setupPeriodicSync();
    return cleanup;
  }, [isOnline, triggerSync]);

  return null; // This component doesn't render anything visible
};

// Hook for easy access to PWA functionality in components
export const usePWAFeatures = () => {
  return usePWAContext();
};