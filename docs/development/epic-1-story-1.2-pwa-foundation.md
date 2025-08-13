# Development Story 1.2: PWA Foundation and Mobile Optimization

## Story Overview
**As a user,**  
**I want to install the app on my phone's home screen and use it like a native app,**  
**so that I can quickly access it without opening a browser.**

## Technical Implementation Details

### 1. Web App Manifest Configuration

#### manifest.json
```json
{
  "name": "KHS Construction CRM",
  "short_name": "KHS CRM",
  "description": "Field operations management for KHS Construction",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "label": "Dashboard view"
    },
    {
      "src": "/screenshots/customer-list.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "label": "Customer management"
    }
  ],
  "categories": ["business", "productivity"],
  "prefer_related_applications": false
}
```

### 2. Service Worker Implementation with Workbox

#### vite.config.ts PWA Plugin Setup
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: false, // Using separate manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.khscrm\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
});
```

### 3. Offline Page Implementation

#### public/offline.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KHS CRM - Offline</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f3f4f6;
    }
    .offline-container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    .offline-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      opacity: 0.5;
    }
    h1 {
      color: #1f2937;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #6b7280;
      line-height: 1.5;
    }
    .sync-status {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #fef3c7;
      border-radius: 8px;
      color: #92400e;
      font-size: 0.875rem;
    }
    .retry-button {
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <svg class="offline-icon" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13.477 14.89A6 6 0 015.11 6.524l-2.122 2.121a9 9 0 0012.728 12.728l2.122-2.122a6 6 0 01-4.362-4.362z"/>
      <path d="M15.414 4.586l-2.121 2.121A6 6 0 014.586 15.414l2.121 2.121A9 9 0 0015.414 4.586z"/>
    </svg>
    <h1>You're Offline</h1>
    <p>Don't worry! Your work is saved locally and will sync when you're back online.</p>
    <div class="sync-status">
      <strong>Pending Changes:</strong> <span id="pending-count">0</span> items waiting to sync
    </div>
    <button class="retry-button" onclick="window.location.reload()">
      Try Again
    </button>
  </div>
  <script>
    // Check for pending sync items
    if ('indexedDB' in window) {
      // This will be replaced with actual sync queue check
      const pendingCount = localStorage.getItem('pendingSyncCount') || '0';
      document.getElementById('pending-count').textContent = pendingCount;
    }
  </script>
</body>
</html>
```

### 4. Mobile-Optimized Base Layout

#### src/layouts/MobileLayout.tsx
```typescript
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, Briefcase, Menu } from 'lucide-react';

export const MobileLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">KHS CRM</h1>
          <button className="p-2 -mr-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 px-4 pb-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 h-16">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </NavLink>
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Customers</span>
          </NavLink>
          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-xs">Jobs</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <div className="w-5 h-5 bg-gray-400 rounded-full" />
            <span className="text-xs">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
```

### 5. Install Prompt Component

#### src/components/InstallPrompt.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS prompt if not installed
    if (isIOSDevice && !localStorage.getItem('iosPromptDismissed')) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('iosPromptDismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
      >
        <X className="w-4 h-4" />
      </button>

      <h3 className="font-semibold mb-2">Install KHS CRM</h3>
      
      {isIOS ? (
        <div className="text-sm text-gray-600 space-y-2">
          <p>Install this app on your iPhone:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Tap the share button <span className="inline-block w-4 h-4 align-middle">⬆️</span></li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
          </ol>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Add KHS CRM to your home screen for quick access and offline use.
          </p>
          <button
            onClick={handleInstall}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            Install App
          </button>
        </>
      )}
    </div>
  );
};
```

### 6. Mobile-Optimized Styles

#### src/styles/mobile.css
```css
/* Ensure proper viewport behavior */
html {
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

/* Prevent iOS bounce scrolling */
body {
  overscroll-behavior: none;
  position: fixed;
  width: 100%;
  height: 100vh;
}

/* Main app container with iOS safe areas */
.app-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  overflow: hidden;
}

/* Scrollable content area */
.content-scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Large touch targets */
.touch-target {
  min-height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* High contrast mode for outdoor visibility */
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0051cc;
    --color-text: #000000;
    --color-background: #ffffff;
    --color-border: #000000;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Loading states */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 7. PWA Update Notification

#### src/components/UpdateNotification.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5" />
          <div>
            <p className="font-medium">Update Available</p>
            <p className="text-sm opacity-90">A new version is ready to install</p>
          </div>
        </div>
        <button
          onClick={handleUpdate}
          className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50"
        >
          Update
        </button>
      </div>
    </div>
  );
};
```

### 8. App Shell Implementation

#### src/App.tsx
```typescript
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MobileLayout } from './layouts/MobileLayout';
import { InstallPrompt } from './components/InstallPrompt';
import { UpdateNotification } from './components/UpdateNotification';
import { LoadingScreen } from './components/LoadingScreen';

// Lazy load routes for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<MobileLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Suspense>
        <InstallPrompt />
        <UpdateNotification />
      </div>
    </BrowserRouter>
  );
}

export default App;
```

## Definition of Done

### Required Outputs
1. **PWA Installation**
   - [ ] App installable on iOS Safari (Add to Home Screen)
   - [ ] App installable on Android Chrome
   - [ ] App opens in standalone mode (no browser UI)
   - [ ] App icons display correctly on home screen

2. **Offline Functionality**
   - [ ] Service worker registered and caching assets
   - [ ] Offline page displays when no connection
   - [ ] App shell loads from cache when offline
   - [ ] Navigation works offline for cached pages

3. **Mobile Optimization**
   - [ ] Responsive on all phone sizes (320px-428px)
   - [ ] Bottom navigation accessible with thumb
   - [ ] Touch targets minimum 48x48px
   - [ ] No horizontal scrolling

4. **Performance**
   - [ ] Lighthouse PWA score > 90
   - [ ] First paint < 3 seconds on 4G
   - [ ] Cached pages load < 1 second

## Testing Requirements

### Manual Testing
1. **Installation Testing**
   - Test Add to Home Screen on iOS 14+
   - Test installation on Android Chrome
   - Verify app icon and splash screen
   - Test app launch from home screen

2. **Offline Testing**
   - Disable network and verify offline page
   - Test navigation while offline
   - Re-enable network and verify recovery
   - Check pending sync indicators

3. **Device Testing**
   - iPhone SE (small screen)
   - iPhone 14 Pro (notch)
   - Samsung Galaxy S22
   - iPad (verify phone layout)

### Automated Testing
1. Lighthouse CI for PWA metrics
2. Service worker registration tests
3. Manifest validation tests
4. Responsive design tests

## Estimated Effort
- **Story Points:** 13
- **Time Estimate:** 2-3 days
- **Complexity:** High (PWA complexities)

## Dependencies
- Story 1.1 must be complete (project setup)
- App icons and graphics needed
- SSL certificate for HTTPS (PWA requirement)

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS PWA limitations | High | Document workarounds, test thoroughly |
| Service worker bugs | Medium | Extensive testing, kill switch ready |
| Offline sync complexity | High | Start simple, iterate based on testing |
| Icon generation | Low | Use automated tools, multiple formats |

## Notes for Developers
- Test on real devices, not just Chrome DevTools
- iOS requires special meta tags for PWA features
- Service worker updates need careful handling
- Consider PWA compatibility library for older browsers
- Document iOS installation instructions clearly