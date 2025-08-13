// Global type declarations for PWA functionality

declare global {
  // Google Analytics gtag function
  function gtag(command: string, ...args: any[]): void;

  // Service Worker types
  interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
    __WB_MANIFEST: any;
  }

  // Workbox background sync
  interface SyncEvent extends ExtendableEvent {
    tag: string;
  }

  // Notification API extensions
  interface NotificationOptions {
    actions?: NotificationAction[];
  }

  interface NotificationEvent extends ExtendableEvent {
    action: string;
    data?: any;
  }

  // Periodic Background Sync API
  interface ServiceWorkerRegistration {
    periodicSync?: {
      register(tag: string, options?: { minInterval: number }): Promise<void>;
      getTags(): Promise<string[]>;
      unregister(tag: string): Promise<void>;
    };
  }

  // Network Information API
  interface Navigator {
    connection?: {
      effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
      downlink: number;
      rtt: number;
      addEventListener(type: 'change', listener: () => void): void;
      removeEventListener(type: 'change', listener: () => void): void;
    };
  }

  // Web App Install Banner
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export {};