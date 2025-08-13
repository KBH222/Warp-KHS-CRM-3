import { useState, useEffect } from 'react';

interface RegisterSWOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (r: ServiceWorkerRegistration) => void;
  onRegisterError?: (error: any) => void;
}

interface RegisterSWReturn {
  needRefresh: [boolean, (value: boolean) => void];
  offlineReady: [boolean, (value: boolean) => void];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

export function useRegisterSW(options: RegisterSWOptions = {}): RegisterSWReturn {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const {
    immediate = false,
    onNeedRefresh,
    onOfflineReady,
    onRegistered,
    onRegisterError
  } = options;

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        })
        .then((r) => {
          setRegistration(r);
          onRegistered?.(r);

          if (r.waiting && !r.active) {
            setNeedRefresh(true);
            onNeedRefresh?.();
          }

          if (r.active && !r.waiting) {
            setOfflineReady(true);
            onOfflineReady?.();
          }

          r.addEventListener('updatefound', () => {
            const newWorker = r.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    setNeedRefresh(true);
                    onNeedRefresh?.();
                  } else {
                    setOfflineReady(true);
                    onOfflineReady?.();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          onRegisterError?.(error);
        });
    }
  }, [immediate, onNeedRefresh, onOfflineReady, onRegistered, onRegisterError]);

  const updateServiceWorker = async (reloadPage = false) => {
    if (!registration || !registration.waiting) {
      return;
    }

    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    if (reloadPage) {
      window.location.reload();
    } else {
      setNeedRefresh(false);
    }
  };

  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  };
}