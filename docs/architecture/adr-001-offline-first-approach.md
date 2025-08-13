# ADR-001: Offline-First Architecture

## Status
Accepted

## Context
Construction workers frequently operate in environments with poor or no internet connectivity (job sites, basements, rural areas). The current paper-based system works offline by default, so any digital solution must match this capability or risk rejection.

## Decision
We will implement an offline-first Progressive Web App (PWA) architecture using:
- Service Workers for request interception and caching
- IndexedDB for local data storage
- Optimistic UI updates with background synchronization
- Conflict resolution favoring owner changes

## Consequences

### Positive
- App remains fully functional without internet
- Instant response times for all read operations
- No data loss when working offline
- Smooth user experience matches paper reliability
- Reduced server load due to local caching

### Negative
- Increased frontend complexity
- Larger initial download size
- Complex conflict resolution logic needed
- Testing offline scenarios is challenging
- Storage limitations on some devices

## Implementation Details

### Data Storage Strategy
```typescript
// All data stored in IndexedDB with this structure:
interface OfflineData {
  customers: Customer[];
  jobs: Job[];
  materials: Material[];
  syncQueue: SyncOperation[];
  metadata: {
    lastSync: Date;
    schemaVersion: number;
  };
}
```

### Sync Queue Operations
```typescript
interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'job' | 'material';
  entityId?: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}
```

### Conflict Resolution Rules
1. **Last Write Wins**: Based on server timestamp
2. **Role Priority**: Owner changes override worker changes
3. **Merge Strategy**: For lists (materials), union of changes
4. **User Notification**: Conflicts shown to user for manual resolution

### Cache Strategies
- **Static Assets**: Cache-first (fonts, images, CSS)
- **API Data**: Network-first with cache fallback
- **App Shell**: Precached during install
- **Dynamic Content**: Stale-while-revalidate

## Alternatives Considered

1. **Online-Only**: Rejected due to connectivity requirements
2. **Native Apps**: Rejected due to deployment friction
3. **Hybrid Approach**: Rejected as it creates two code paths
4. **Local Storage Only**: Rejected due to 5MB limitation

## References
- [Google PWA Offline Cookbook](https://web.dev/offline-cookbook/)
- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)