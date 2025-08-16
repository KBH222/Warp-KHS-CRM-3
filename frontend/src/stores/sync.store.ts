import { create } from 'zustand';
// Inline type definitions
interface SyncError {
  id: string;
  message: string;
  code: string;
  timestamp: string;
  operation?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  errors: SyncError[];
  pendingOperations: number;

  // Actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: Date) => void;
  addError: (error: SyncError) => void;
  clearErrors: () => void;
  setPendingOperations: (count: number) => void;
}

export const syncStore = create<SyncState>((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncTime: null,
  errors: [],
  pendingOperations: 0,

  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  addError: (error) => set((state) => ({ errors: [...state.errors, error] })),
  clearErrors: () => set({ errors: [] }),
  setPendingOperations: (count) => set({ pendingOperations: count }),
}));

// Helper hooks
export const useSyncStatus = () => {
  const { isOnline, isSyncing, lastSyncTime, pendingOperations } = syncStore();
  return { isOnline, isSyncing, lastSyncTime, pendingOperations };
};

export const useSyncErrors = () => {
  const errors = syncStore((state) => state.errors);
  return errors;
};