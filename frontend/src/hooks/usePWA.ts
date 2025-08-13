import { useState, useEffect } from 'react';
import { backgroundSyncService } from '../services/background-sync.service';
import { offlineCacheService } from '../services/offline-cache.service';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWACapabilities {
  isInstallable: boolean;
  isPWA: boolean;
  supportsBackgroundSync: boolean;
  supportsPeriodicSync: boolean;
  supportsPushNotifications: boolean;
  supportsOfflineStorage: boolean;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  connectionType: string;
}

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Initialize PWA services
        await Promise.all([
          backgroundSyncService.initialize(),
          offlineCacheService.initialize()
        ]);
        
        // Check PWA capabilities
        const pwaCaps = await checkPWACapabilities();
        setCapabilities(pwaCaps);
        
        setIsInitialized(true);
        console.log('PWA services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize PWA services:', error);
      }
    };

    initializePWA();
  }, []);

  useEffect(() => {
    // Check if app is running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      setIsPWA(isStandalone || isInWebAppiOS || isMinimalUI);
    };

    checkPWA();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Track install prompt availability
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install_prompt_available', {
          device_type: capabilities?.deviceType || 'unknown'
        });
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsPWA(true);
      
      // Track successful installation
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_installed', {
          device_type: capabilities?.deviceType || 'unknown'
        });
      }
      
      // Initialize post-install features
      initializePostInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', checkPWA);
    };
  }, [capabilities]);

  const checkPWACapabilities = async (): Promise<PWACapabilities> => {
    const capabilities: PWACapabilities = {
      isInstallable: false,
      isPWA: window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      supportsPeriodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
      supportsPushNotifications: 'serviceWorker' in navigator && 'PushManager' in window,
      supportsOfflineStorage: 'indexedDB' in window,
      deviceType: getDeviceType(),
      connectionType: getConnectionType()
    };

    return capabilities;
  };

  const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
      return 'mobile';
    } else {
      return 'desktop';
    }
  };

  const getConnectionType = (): string => {
    if ('connection' in navigator) {
      return (navigator as any).connection.effectiveType || 'unknown';
    }
    return 'unknown';
  };

  const initializePostInstall = async () => {
    try {
      // Request notification permissions for job updates
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permissions granted');
        }
      }

      // Setup push notifications if supported
      if (capabilities?.supportsPushNotifications) {
        await setupPushNotifications();
      }

      // Preload critical data for offline use
      await preloadCriticalData();
      
    } catch (error) {
      console.error('Post-install initialization failed:', error);
    }
  };

  const setupPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications for job updates
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VAPID_PUBLIC_KEY // You'd set this in your env
      });

      // Send subscription to your server
      console.log('Push notification subscription:', subscription);
      
    } catch (error) {
      console.error('Failed to setup push notifications:', error);
    }
  };

  const preloadCriticalData = async () => {
    try {
      // Preload today's jobs and active customers for offline access
      if (isInitialized) {
        await backgroundSyncService.triggerSync('critical');
      }
    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  };

  const install = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        
        // Track successful installation
        if (typeof gtag !== 'undefined') {
          gtag('event', 'pwa_install_completed', {
            device_type: capabilities?.deviceType || 'unknown',
            connection_type: capabilities?.connectionType || 'unknown'
          });
        }
        
        return true;
      } else {
        // Track dismissal
        if (typeof gtag !== 'undefined') {
          gtag('event', 'pwa_install_dismissed', {
            device_type: capabilities?.deviceType || 'unknown'
          });
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  const checkForUpdates = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        console.log('Checked for service worker updates');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const getInstallationInstructions = () => {
    const deviceType = capabilities?.deviceType || 'unknown';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      return {
        title: 'Install KHS CRM on iOS',
        steps: [
          'Tap the Share button in Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ]
      };
    } else if (deviceType === 'mobile') {
      return {
        title: 'Install KHS CRM on Android',
        steps: [
          'Tap the menu button (3 dots)',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Install" when prompted'
        ]
      };
    } else {
      return {
        title: 'Install KHS CRM on Desktop',
        steps: [
          'Click the install icon in the address bar',
          'Or use the menu: Settings > Install KHS CRM',
          'Click "Install" to add to your desktop'
        ]
      };
    }
  };

  return {
    isInstallable,
    isPWA,
    install,
    capabilities,
    isInitialized,
    checkForUpdates,
    getInstallationInstructions,
    preloadCriticalData
  };
};