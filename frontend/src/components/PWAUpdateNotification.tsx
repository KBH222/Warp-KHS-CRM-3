import { useRegisterSW } from '../hooks/usePWARegister';

export const PWAUpdateNotification = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('Service Worker registered');
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 shadow-lg z-50 safe-top">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">App update available!</span>
          <div className="flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};