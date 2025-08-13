# Frontend Architecture - Offline-First PWA

## Overview

The KHS CRM frontend is built as a Progressive Web App (PWA) using React and TypeScript, designed for offline-first operation in construction field environments. The architecture prioritizes reliability, performance, and usability on mobile devices in challenging conditions.

## Core Architecture Principles

### Offline-First Design

1. **Local-First Operations**: All user actions work against local data
2. **Optimistic UI Updates**: Immediate feedback, background sync
3. **Graceful Degradation**: Features adapt to connectivity state
4. **Conflict Resolution**: Automated with user notification
5. **Data Persistence**: Multiple storage layers for reliability

### Mobile-First Implementation

1. **Touch Optimization**: 48px minimum touch targets
2. **Thumb-Zone Design**: Critical actions within thumb reach
3. **Gesture Support**: Swipe, pull-to-refresh, long-press
4. **Viewport Management**: Proper scaling, no zoom on inputs
5. **Performance Budget**: < 3s initial load, < 1s interactions

## Technology Stack

```typescript
// Core Dependencies
{
  "react": "^18.2.0",              // UI framework
  "typescript": "^5.3.0",          // Type safety
  "vite": "^5.0.0",               // Build tool
  "vite-plugin-pwa": "^0.17.0",   // PWA generation
  
  // State Management
  "zustand": "^4.4.0",            // Global state
  "immer": "^10.0.0",             // Immutable updates
  
  // Routing & Navigation
  "react-router-dom": "^6.20.0",  // Client routing
  "react-router-typesafe": "^1.0.0", // Type-safe routes
  
  // Data & Sync
  "idb": "^8.0.0",                // IndexedDB wrapper
  "@tanstack/react-query": "^5.0.0", // Server state
  "axios": "^1.6.0",              // HTTP client
  
  // UI & Styling
  "tailwindcss": "^3.4.0",        // Utility CSS
  "@headlessui/react": "^1.7.0",  // Accessible components
  "react-hook-form": "^7.48.0",   // Form management
  "react-hot-toast": "^2.4.0",    // Notifications
  
  // PWA & Workers
  "workbox-window": "^7.0.0",     // Service worker
  "comlink": "^4.4.0",            // Worker communication
}
```

## Application Architecture

### Directory Structure

```
frontend/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── offline.html          # Offline fallback
│   └── icons/               # App icons
├── src/
│   ├── app/                 # App-level components
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── Providers.tsx
│   ├── components/          # Shared components
│   │   ├── ui/             # Base UI components
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components
│   ├── features/           # Feature modules
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── jobs/
│   │   ├── materials/
│   │   └── sync/
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core libraries
│   │   ├── api/           # API client
│   │   ├── db/            # IndexedDB
│   │   ├── sync/          # Sync engine
│   │   └── workers/       # Web workers
│   ├── stores/             # Zustand stores
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities
│   └── main.tsx           # Entry point
```

### Component Architecture

```typescript
// Feature module structure
features/
└── customers/
    ├── components/           # Feature components
    │   ├── CustomerList.tsx
    │   ├── CustomerDetail.tsx
    │   ├── CustomerForm.tsx
    │   └── CustomerSearch.tsx
    ├── hooks/               # Feature hooks
    │   ├── useCustomers.ts
    │   ├── useCustomer.ts
    │   └── useCustomerMutations.ts
    ├── stores/              # Feature store
    │   └── customerStore.ts
    ├── types/               # Feature types
    │   └── customer.types.ts
    ├── utils/               # Feature utils
    │   └── customerValidation.ts
    └── index.ts            # Public exports
```

## State Management Architecture

### Store Layers

```typescript
// 1. UI State (Zustand)
interface UIStore {
  // Navigation
  activeView: 'dashboard' | 'customers' | 'jobs';
  sidebarOpen: boolean;
  
  // Modals
  modals: {
    customerForm: boolean;
    jobForm: boolean;
    syncStatus: boolean;
  };
  
  // User preferences
  theme: 'light' | 'dark' | 'auto';
  compactView: boolean;
}

// 2. Domain State (Zustand + Immer)
interface CustomerStore {
  customers: Map<string, Customer>;
  searchResults: string[];
  filters: CustomerFilters;
  
  // Actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  search: (query: string) => Promise<void>;
}

// 3. Server State (React Query)
const useCustomers = (filters?: CustomerFilters) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customerAPI.getCustomers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

// 4. Offline State (IndexedDB)
interface OfflineStore {
  lastSync: Date | null;
  pendingChanges: SyncOperation[];
  conflicts: ConflictRecord[];
}
```

### State Flow

```
User Action → Local State Update → IndexedDB → Sync Queue → Server
     ↓                ↓                           ↓           ↓
  UI Update    Optimistic Update          Background Sync  Confirmation
```

## Offline Storage Architecture

### Storage Layers

```typescript
// 1. IndexedDB (Primary storage)
class OfflineDatabase {
  private db: IDBDatabase;
  
  async init() {
    this.db = await openDB('khs-crm', 1, {
      upgrade(db) {
        // Customers store
        const customerStore = db.createObjectStore('customers', {
          keyPath: 'id',
        });
        customerStore.createIndex('by-name', 'name');
        customerStore.createIndex('by-updated', 'updatedAt');
        
        // Jobs store
        const jobStore = db.createObjectStore('jobs', {
          keyPath: 'id',
        });
        jobStore.createIndex('by-status', 'status');
        jobStore.createIndex('by-customer', 'customerId');
        
        // Sync queue
        db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
      },
    });
  }
}

// 2. LocalStorage (Settings & preferences)
class SettingsStorage {
  private prefix = 'khs_';
  
  get<T>(key: string): T | null {
    const item = localStorage.getItem(this.prefix + key);
    return item ? JSON.parse(item) : null;
  }
  
  set<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }
}

// 3. SessionStorage (Temporary state)
class SessionCache {
  set(key: string, value: any, ttl?: number): void {
    sessionStorage.setItem(key, JSON.stringify({
      value,
      expires: ttl ? Date.now() + ttl : null,
    }));
  }
}

// 4. Cache API (HTTP responses)
class ResponseCache {
  private cacheName = 'khs-api-cache-v1';
  
  async cache(request: Request, response: Response): Promise<void> {
    const cache = await caches.open(this.cacheName);
    await cache.put(request, response.clone());
  }
}
```

### Storage Strategy

| Data Type | Storage | Size Limit | Persistence |
|-----------|---------|------------|-------------|
| Domain data | IndexedDB | ~50% disk | Permanent |
| User settings | LocalStorage | 10MB | Permanent |
| Session data | SessionStorage | 10MB | Session |
| API responses | Cache API | Variable | Managed |
| Auth tokens | Memory + Secure Cookie | Small | Session |

## Service Worker Architecture

### Service Worker Lifecycle

```javascript
// sw.js - Service Worker
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// API caching strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          // Only cache successful responses
          return response?.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Static assets
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-cache',
    plugins: [
      {
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    ],
  })
);

// Offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});
```

### Background Sync

```typescript
// Background sync registration
class BackgroundSyncManager {
  async register(tag: string, data?: any): Promise<void> {
    if ('sync' in self.registration) {
      try {
        await self.registration.sync.register(tag);
        if (data) {
          await this.saveQueueData(tag, data);
        }
      } catch (err) {
        // Fallback to regular sync
        await this.fallbackSync(tag, data);
      }
    }
  }
  
  private async fallbackSync(tag: string, data: any): Promise<void> {
    // Store in IndexedDB and retry with exponential backoff
    const queue = await this.getQueue();
    queue.push({ tag, data, retries: 0 });
    await this.processQueue();
  }
}

// Service worker sync handler
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-customers') {
    event.waitUntil(syncCustomers());
  } else if (event.tag === 'sync-jobs') {
    event.waitUntil(syncJobs());
  }
});
```

## Routing & Navigation

### Route Configuration

```typescript
// routes.tsx
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'customers',
        element: <CustomerLayout />,
        children: [
          { index: true, element: <CustomerList /> },
          { path: 'new', element: <CustomerForm /> },
          { path: ':id', element: <CustomerDetail /> },
          { path: ':id/edit', element: <CustomerForm /> },
        ],
      },
      {
        path: 'jobs',
        element: <JobLayout />,
        children: [
          { index: true, element: <JobList /> },
          { path: 'new', element: <JobForm /> },
          { path: ':id', element: <JobDetail /> },
          { path: ':id/materials', element: <MaterialsList /> },
        ],
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

// Type-safe navigation
const navigation = createTypesafeNavigation(routes);

// Usage
navigation.push('/customers/:id', { id: '123' });
navigation.replace('/jobs', { query: { status: 'active' } });
```

### Navigation Guards

```typescript
// Protected routes
function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

// Offline-aware navigation
function OfflineAwareLink({ to, children, ...props }: LinkProps) {
  const isOnline = useOnlineStatus();
  const requiresOnline = ONLINE_ONLY_ROUTES.includes(to);
  
  if (!isOnline && requiresOnline) {
    return (
      <button
        {...props}
        onClick={() => toast.error('This feature requires internet connection')}
        className="opacity-50 cursor-not-allowed"
      >
        {children}
      </button>
    );
  }
  
  return <Link to={to} {...props}>{children}</Link>;
}
```

## Component Design System

### Base Components

```typescript
// Button component with variants
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  children,
  ...props
}: ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}

// Form input with validation
interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps & InputHTMLAttributes<HTMLInputElement>>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    const id = useId();
    
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm',
            'focus:border-primary-500 focus:ring-primary-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            'min-h-[48px]', // Touch target
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
```

### Layout Components

```typescript
// Mobile-first layout
export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md lg:hidden"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          
          <h1 className="text-lg font-semibold">KHS CRM</h1>
          
          <SyncIndicator />
        </div>
      </header>
      
      {/* Sidebar (mobile) */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          
          {/* Sidebar panel */}
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Navigation onClose={() => setSidebarOpen(false)} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      
      {/* Main content */}
      <main className="pt-16 pb-20 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      
      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
        <div className="grid grid-cols-4 h-16">
          <NavLink to="/" icon={HomeIcon} label="Home" />
          <NavLink to="/customers" icon={UsersIcon} label="Customers" />
          <NavLink to="/jobs" icon={BriefcaseIcon} label="Jobs" />
          <NavLink to="/sync" icon={RefreshIcon} label="Sync" />
        </div>
      </nav>
    </div>
  );
}
```

## Performance Optimization

### Code Splitting

```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const Customers = lazy(() => import('./features/customers/Customers'));
const Jobs = lazy(() => import('./features/jobs/Jobs'));

// Component-level splitting
const HeavyComponent = lazy(() => 
  import('./components/HeavyComponent').then(module => ({
    default: module.HeavyComponent,
  }))
);

// Prefetching
const prefetchCustomers = () => {
  import('./features/customers/Customers');
};

// Usage with Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/customers/*" element={<Customers />} />
    <Route path="/jobs/*" element={<Jobs />} />
  </Routes>
</Suspense>
```

### Virtualization

```typescript
// Virtual scrolling for large lists
import { VirtualList } from '@tanstack/react-virtual';

function CustomerList() {
  const { data: customers } = useCustomers();
  
  const rowVirtualizer = useVirtualizer({
    count: customers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Row height
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <CustomerCard customer={customers[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Image Optimization

```typescript
// Progressive image loading
function ProgressiveImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [imageSrc, setImageSrc] = useState<string>();
  const [imageRef, inView] = useInView({ triggerOnce: true });
  
  useEffect(() => {
    if (inView && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setImageSrc(src);
    }
  }, [inView, src]);
  
  return (
    <div ref={imageRef} className="relative bg-gray-200">
      {imageSrc ? (
        <img src={imageSrc} alt={alt} {...props} />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-gray-300" />
      )}
    </div>
  );
}

// WebP with fallback
<picture>
  <source srcSet="/images/hero.webp" type="image/webp" />
  <source srcSet="/images/hero.jpg" type="image/jpeg" />
  <img src="/images/hero.jpg" alt="Hero" loading="lazy" />
</picture>
```

## Testing Strategy

### Unit Tests

```typescript
// Component testing
describe('CustomerForm', () => {
  it('validates required fields', async () => {
    const onSubmit = vi.fn();
    const { getByLabelText, getByText } = render(
      <CustomerForm onSubmit={onSubmit} />
    );
    
    // Submit without filling required fields
    fireEvent.click(getByText('Save'));
    
    await waitFor(() => {
      expect(getByText('Name is required')).toBeInTheDocument();
      expect(getByText('Address is required')).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// Hook testing
describe('useCustomers', () => {
  it('returns paginated customers', async () => {
    const { result } = renderHook(() => useCustomers({ page: 1 }));
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toHaveLength(20);
    expect(result.current.pagination).toMatchObject({
      page: 1,
      hasNext: true,
    });
  });
});
```

### Integration Tests

```typescript
// PWA installation test
describe('PWA Installation', () => {
  it('shows install prompt on supported browsers', async () => {
    const mockBeforeInstallPrompt = vi.fn();
    window.addEventListener('beforeinstallprompt', mockBeforeInstallPrompt);
    
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });
  });
});

// Offline functionality test
describe('Offline Mode', () => {
  it('shows cached data when offline', async () => {
    // Seed IndexedDB with test data
    await seedDatabase();
    
    // Go offline
    await setNetworkStatus('offline');
    
    renderApp();
    
    // Should show cached customers
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Should show offline indicator
    expect(screen.getByText('Offline Mode')).toBeInTheDocument();
  });
});
```

## Mobile-Specific Features

### Touch Gestures

```typescript
// Swipe to delete
function SwipeableListItem({ children, onDelete }: Props) {
  const handlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    trackMouse: true,
  });
  
  return (
    <div {...handlers} className="relative">
      <div className={cn(
        'transition-transform',
        showDelete && '-translate-x-20',
      )}>
        {children}
      </div>
      {showDelete && (
        <button
          onClick={onDelete}
          className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 text-white"
        >
          Delete
        </button>
      )}
    </div>
  );
}

// Pull to refresh
function PullToRefresh({ onRefresh, children }: Props) {
  const [isPulling, setIsPulling] = useState(false);
  
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      isPullable={!isPulling}
      canFetchMore={false}
    >
      {children}
    </PullToRefresh>
  );
}
```

### Device Features

```typescript
// Camera integration
async function capturePhoto(): Promise<File | null> {
  if ('mediaDevices' in navigator) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      // Implementation...
    } catch (error) {
      // Fallback to file input
      return captureViaFileInput();
    }
  }
}

// Geolocation
function useGeolocation() {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => setLocation(position.coords),
        (error) => setError(error.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);
  
  return { location, error };
}

// Vibration feedback
function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);
  
  return vibrate;
}
```

## Performance Monitoring

```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals(metric: Metric) {
  // Send to analytics
  analytics.track('web-vitals', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
}

getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);

// Custom performance marks
performance.mark('app-interactive');
performance.measure('app-boot-time', 'navigation-start', 'app-interactive');

// Resource timing
const resources = performance.getEntriesByType('resource');
const slowResources = resources.filter(r => r.duration > 1000);
```