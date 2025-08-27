import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { khsToolsSyncApi } from '../services/api/khsToolsSync.api';

interface Tool {
  id: string;
  name: string;
  checked: boolean;
  custom?: boolean;
}

interface CategoryTools {
  [category: string]: Tool[];
}

// Synced data - shared across devices
interface ToolsData {
  tools: CategoryTools;
  lockedCategories: string[];
  lastUpdated: number;
}

// Local view preferences - per device
interface ViewPreferences {
  selectedDemoCategories: string[];
  selectedInstallCategories: string[];
  showDemo: boolean;
  showInstall: boolean;
}

const STORAGE_KEY = 'khs-tools-sync-data-v5'; // Incremented for data structure change
const VIEW_PREFS_KEY = 'khs-tools-view-prefs'; // Local view preferences
const SYNC_INTERVAL = 10000; // Check for updates every 10 seconds
const DB_SYNC_INTERVAL = 5000; // Sync with database every 5 seconds (reduced for testing)
const DEBOUNCE_DELAY = 1000; // Debounce user interactions for 1 second

// Helper to safely save to localStorage with quota handling
const safeLocalStorageSet = (key: string, value: string, debugLog: (msg: string, data?: any) => void): boolean => {
  try {
    // First try to save normally
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      debugLog(`[STORAGE] Quota exceeded for ${key}, attempting cleanup...`);
      
      // Clear old versions of the same key pattern
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && (
          storageKey.startsWith('khs-tools-sync-data-') && storageKey !== key ||
          storageKey === 'khs-sync-queue' ||
          storageKey === 'khs-tools-db-version'
        )) {
          keysToRemove.push(storageKey);
        }
      }
      
      // Remove old data
      keysToRemove.forEach(k => {
        debugLog(`[STORAGE] Removing old key: ${k}`);
        localStorage.removeItem(k);
      });
      
      // Try again with cleaned storage
      try {
        localStorage.setItem(key, value);
        debugLog('[STORAGE] Successfully saved after cleanup');
        return true;
      } catch (retryError) {
        debugLog('[STORAGE] Still failed after cleanup, storing minimal data');
        
        // If still failing, store minimal data
        if (key === STORAGE_KEY) {
          const parsed = JSON.parse(value);
          const minimal = {
            tools: parsed.tools || {},
            lockedCategories: parsed.lockedCategories || [],
            lastUpdated: parsed.lastUpdated
          };
          
          // Remove any custom tools to save space
          Object.keys(minimal.tools).forEach(category => {
            minimal.tools[category] = minimal.tools[category].filter((tool: any) => !tool.custom);
          });
          
          try {
            localStorage.setItem(key, JSON.stringify(minimal));
            debugLog('[STORAGE] Saved minimal data successfully');
            return true;
          } catch (finalError) {
            debugLog('[STORAGE] Failed to save even minimal data', finalError);
            return false;
          }
        }
      }
    }
    
    debugLog('[STORAGE] Error saving to localStorage', e);
    return false;
  }
};

const predefinedTools: CategoryTools = {
  'Kitchen': [
    { id: 'k1', name: 'Sledgehammer (20lb)', checked: false },
    { id: 'k2', name: 'Crowbar (36")', checked: false },
    { id: 'k3', name: 'Reciprocating saw', checked: false },
    { id: 'k4', name: 'Utility knife', checked: false },
    { id: 'k5', name: 'Safety glasses', checked: false },
    { id: 'k6', name: 'Work gloves', checked: false },
    { id: 'k7', name: 'Dust masks', checked: false },
    { id: 'k8', name: 'Drop cloths', checked: false },
    { id: 'k9', name: 'Trash bags (heavy duty)', checked: false },
    { id: 'k10', name: 'Shop vacuum', checked: false },
    { id: 'k11', name: 'Extension cords', checked: false },
    { id: 'k12', name: 'Work lights', checked: false },
  ],
  'Bathroom': [
    { id: 'b1', name: 'Sledgehammer (10lb)', checked: false },
    { id: 'b2', name: 'Pry bar', checked: false },
    { id: 'b3', name: 'Pipe wrench', checked: false },
    { id: 'b4', name: 'Adjustable wrench', checked: false },
    { id: 'b5', name: 'Safety glasses', checked: false },
    { id: 'b6', name: 'Work gloves', checked: false },
    { id: 'b7', name: 'Dust masks', checked: false },
    { id: 'b8', name: 'Plastic sheeting', checked: false },
    { id: 'b9', name: 'Trash bags', checked: false },
    { id: 'b10', name: 'Bucket', checked: false },
    { id: 'b11', name: 'Utility knife', checked: false },
    { id: 'b12', name: 'Screwdriver set', checked: false },
  ],
  'Flooring': [
    { id: 'f1', name: 'Flooring nailer', checked: false },
    { id: 'f2', name: 'Miter saw', checked: false },
    { id: 'f3', name: 'Jigsaw', checked: false },
    { id: 'f4', name: 'Tape measure', checked: false },
    { id: 'f5', name: 'Chalk line', checked: false },
    { id: 'f6', name: 'Knee pads', checked: false },
    { id: 'f7', name: 'Tapping block', checked: false },
    { id: 'f8', name: 'Pull bar', checked: false },
    { id: 'f9', name: 'Spacers', checked: false },
    { id: 'f10', name: 'Moisture meter', checked: false },
    { id: 'f11', name: 'Level', checked: false },
    { id: 'f12', name: 'Underlayment', checked: false },
  ],
  'Framing': [
    { id: 'fr1', name: 'Framing hammer', checked: false },
    { id: 'fr2', name: 'Circular saw', checked: false },
    { id: 'fr3', name: 'Speed square', checked: false },
    { id: 'fr4', name: 'Level (4ft)', checked: false },
    { id: 'fr5', name: 'Tape measure (25ft)', checked: false },
    { id: 'fr6', name: 'Chalk line', checked: false },
    { id: 'fr7', name: 'Nail gun', checked: false },
    { id: 'fr8', name: 'Sawhorses', checked: false },
    { id: 'fr9', name: 'String line', checked: false },
    { id: 'fr10', name: 'Safety glasses', checked: false },
    { id: 'fr11', name: 'Tool belt', checked: false },
    { id: 'fr12', name: 'Extension cords', checked: false },
  ],
  'Drywall': [
    { id: 'dw1', name: 'Drywall lift', checked: false },
    { id: 'dw2', name: 'Screw gun', checked: false },
    { id: 'dw3', name: 'Drywall saw', checked: false },
    { id: 'dw4', name: 'T-square (4ft)', checked: false },
    { id: 'dw5', name: 'Utility knife', checked: false },
    { id: 'dw6', name: 'Tape measure', checked: false },
    { id: 'dw7', name: 'Mud pan', checked: false },
    { id: 'dw8', name: 'Taping knives (6", 10", 12")', checked: false },
    { id: 'dw9', name: 'Corner tool', checked: false },
    { id: 'dw10', name: 'Sanding pole', checked: false },
    { id: 'dw11', name: 'Dust masks', checked: false },
    { id: 'dw12', name: 'Work lights', checked: false },
  ],
  'Cabinets': [
    { id: 'c1', name: 'Drill/Driver set', checked: false },
    { id: 'c2', name: 'Level (4ft)', checked: false },
    { id: 'c3', name: 'Stud finder', checked: false },
    { id: 'c4', name: 'Tape measure', checked: false },
    { id: 'c5', name: 'Cabinet jacks', checked: false },
    { id: 'c6', name: 'Clamps', checked: false },
    { id: 'c7', name: 'Hole saw kit', checked: false },
    { id: 'c8', name: 'Jigsaw', checked: false },
    { id: 'c9', name: 'Cabinet hardware jig', checked: false },
    { id: 'c10', name: 'Shims', checked: false },
    { id: 'c11', name: 'Safety glasses', checked: false },
    { id: 'c12', name: 'Touch-up markers', checked: false },
  ],
  'Decking': [
    { id: 'dk1', name: 'Circular saw', checked: false },
    { id: 'dk2', name: 'Miter saw', checked: false },
    { id: 'dk3', name: 'Drill/Driver set', checked: false },
    { id: 'dk4', name: 'Level (4ft)', checked: false },
    { id: 'dk5', name: 'Tape measure (25ft)', checked: false },
    { id: 'dk6', name: 'Chalk line', checked: false },
    { id: 'dk7', name: 'Speed square', checked: false },
    { id: 'dk8', name: 'Post hole digger', checked: false },
    { id: 'dk9', name: 'String line', checked: false },
    { id: 'dk10', name: 'Deck board spacers', checked: false },
    { id: 'dk11', name: 'Work gloves', checked: false },
    { id: 'dk12', name: 'Hidden fastener tool', checked: false },
  ],
  'Painting': [
    { id: 'p1', name: 'Drop cloths', checked: false },
    { id: 'p2', name: 'Painters tape', checked: false },
    { id: 'p3', name: 'Brushes (various sizes)', checked: false },
    { id: 'p4', name: 'Rollers and covers', checked: false },
    { id: 'p5', name: 'Paint trays', checked: false },
    { id: 'p6', name: 'Extension pole', checked: false },
    { id: 'p7', name: 'Putty knife', checked: false },
    { id: 'p8', name: 'Sandpaper', checked: false },
    { id: 'p9', name: 'Primer', checked: false },
    { id: 'p10', name: 'Ladder', checked: false },
    { id: 'p11', name: 'Paint can opener', checked: false },
    { id: 'p12', name: 'Rags', checked: false },
  ],
};

const KHSInfoSimple = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Tools List');
  
  // Synced data - shared across devices
  const [toolsData, setToolsData] = useState<ToolsData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure lockedCategories exists
        if (!parsed.lockedCategories) {
          return {
            tools: parsed.tools || predefinedTools,
            lockedCategories: Object.keys(predefinedTools),
            lastUpdated: Date.now()
          };
        }
        return {
          tools: parsed.tools || predefinedTools,
          lockedCategories: parsed.lockedCategories || Object.keys(predefinedTools),
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      } catch (e) {
        console.error('Failed to parse stored data:', e);
      }
    }
    return {
      tools: predefinedTools,
      lockedCategories: Object.keys(predefinedTools), // All categories locked by default
      lastUpdated: Date.now()
    };
  });
  
  // Local view preferences - per device
  const [viewPrefs, setViewPrefs] = useState<ViewPreferences>(() => {
    const stored = localStorage.getItem(VIEW_PREFS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse view preferences:', e);
      }
    }
    return {
      selectedDemoCategories: [],
      selectedInstallCategories: [],
      showDemo: false,
      showInstall: false
    };
  });
  const [newToolName, setNewToolName] = useState('');
  const [lastCheckedTime, setLastCheckedTime] = useState(Date.now());
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editingToolName, setEditingToolName] = useState('');
  const [dbVersion, setDbVersion] = useState(() => {
    // Initialize from cached data if available
    const cached = localStorage.getItem('khs-tools-sync-cache');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        return data.version || 1;
      } catch {
        return 1;
      }
    }
    return 1;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const previousToolsDataRef = useRef<string>('');
  const isUserChangeRef = useRef(false);
  const isSyncingFromDatabase = useRef(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedDataRef = useRef<string>(''); // Track last saved state

  const tabs = ['Tools List', 'SOP', 'Office Docs', 'Specs'];
  const demoCategories = ['Kitchen', 'Bathroom', 'Flooring', 'Framing', 'Drywall'];
  const installCategories = ['Cabinets', 'Drywall', 'Flooring', 'Framing', 'Decking', 'Painting'];
  
  // Debug logger for mobile
  const debugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
    console.log(logEntry);
    setDebugLogs(prev => [...prev.slice(-19), logEntry]); // Keep last 20 logs
  };

  // Save synced data whenever it changes
  useEffect(() => {
    const dataToSave = {
      ...toolsData,
      lastUpdated: Date.now()
    };
    const saved = safeLocalStorageSet(STORAGE_KEY, JSON.stringify(dataToSave), debugLog);
    if (!saved) {
      debugLog('[STORAGE] Failed to save tools data to localStorage');
    }
  }, [toolsData]);
  
  // Save view preferences whenever they change
  useEffect(() => {
    const saved = safeLocalStorageSet(VIEW_PREFS_KEY, JSON.stringify(viewPrefs), debugLog);
    if (!saved) {
      debugLog('[STORAGE] Failed to save view preferences to localStorage');
    }
  }, [viewPrefs]);

  // Poll for updates from other users
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Only update if data is newer than what we have
          if (parsed.lastUpdated > lastCheckedTime) {
            // Ensure we only set valid ToolsData fields
            setToolsData({
              tools: parsed.tools || {},
              lockedCategories: parsed.lockedCategories || [],
              lastUpdated: parsed.lastUpdated || Date.now()
            });
            setLastCheckedTime(parsed.lastUpdated);
          }
        } catch (e) {
          console.error('Failed to parse stored data during sync:', e);
        }
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [lastCheckedTime]);

  // Sync with database
  const syncWithDatabase = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      debugLog('Starting database sync...', {
        apiUrl: import.meta.env.VITE_API_URL || 'relative',
        currentVersion: dbVersion
      });
      
      // Check auth token
      const token = localStorage.getItem('khs-crm-token') || 
                   localStorage.getItem('auth-token') ||
                   localStorage.getItem('token');
      debugLog('Auth token check', token ? 'Found' : 'NOT FOUND');
      
      // Get latest from database
      const dbData = await khsToolsSyncApi.get();
      debugLog('Fetched data', { 
        version: dbData.version, 
        currentVersion: dbVersion,
        versionDiff: dbData.version - dbVersion 
      });
      
      // Check if database has newer data
      if (dbData.version > dbVersion) {
        debugLog('[SYNC-PULL] Database has newer data, updating local state', {
          serverVersion: dbData.version,
          localVersion: dbVersion,
          diff: dbData.version - dbVersion
        });
        // Set flag to prevent triggering push
        isSyncingFromDatabase.current = true;
        // Update local state with database data (only tools and locked categories)
        setToolsData({
          tools: dbData.tools || {},
          lockedCategories: dbData.lockedCategories || [],
          lastUpdated: new Date(dbData.lastUpdated).getTime()
        });
        setDbVersion(dbData.version);
        setLastCheckedTime(Date.now());
        debugLog('[SYNC-PULL] Local state updated successfully');
        // Reset flag after state update
        setTimeout(() => {
          isSyncingFromDatabase.current = false;
          debugLog('[SYNC-PULL] Re-enabled push detection');
        }, 100);
      } else {
        debugLog('[SYNC-PULL] No update needed', {
          serverVersion: dbData.version,
          localVersion: dbVersion,
          isEqual: dbData.version === dbVersion
        });
      }
    } catch (error: any) {
      console.error('[KHSToolsSync] Sync failed:', error);
      console.error('[KHSToolsSync] Error details:', {
        message: error.message,
        status: error.response?.status,
        stack: error.stack
      });
      // On mobile, network errors might be more common
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        console.log('[KHSToolsSync] Network error detected - this is common on mobile');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Push local changes to database
  const pushToDatabase = async (forcePush = false) => {
    debugLog(`[PUSH] pushToDatabase called (forcePush=${forcePush}, isPushing=${isPushing})`);
    
    if (isPushing) {
      debugLog('[PUSH] Skipping - already pushing');
      return;
    }
    
    try {
      setIsPushing(true);
      debugLog(forcePush ? '[PUSH] Force pushing to database...' : '[PUSH] Auto-pushing changes...');
      
      // First fetch latest version to ensure we're up to date
      const currentDbData = await khsToolsSyncApi.get();
      const currentVersion = currentDbData.version;
      debugLog('Current DB version before push', currentVersion);
      
      // If force push and local version is higher, use local version
      const pushVersion = forcePush && dbVersion > currentVersion ? dbVersion : currentVersion;
      
      const payload = {
        tools: toolsData.tools,
        lockedCategories: toolsData.lockedCategories,
        version: pushVersion
      };
      debugLog('Push payload version', payload.version);
      
      const response = await khsToolsSyncApi.update(payload);
      
      setDbVersion(response.version);
      debugLog('Push successful, new version', response.version);
    } catch (error: any) {
      if (error.response?.status === 409) {
        debugLog('Version conflict, fetching latest');
        // Version conflict - fetch latest and retry
        await syncWithDatabase();
      } else {
        debugLog('Push failed', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          code: error.code,
          apiUrl: import.meta.env.VITE_API_URL || 'relative'
        });
      }
    } finally {
      setIsPushing(false);
    }
  };

  // Initial database sync
  useEffect(() => {
    // Initialize saved data reference
    const initialDataString = JSON.stringify({
      tools: toolsData.tools,
      lockedCategories: toolsData.lockedCategories
    });
    savedDataRef.current = initialDataString;
    previousToolsDataRef.current = initialDataString;
    
    // Check if running on mobile and log environment details
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    debugLog('Environment', {
      isMobile,
      platform: navigator.platform,
      online: navigator.onLine,
      hostname: window.location.hostname
    });
    
    // Test localStorage access on mobile
    if (isMobile) {
      try {
        const testKey = 'khs-mobile-test';
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        console.log('[KHSToolsSync] Mobile localStorage test:', value === 'test' ? 'PASSED' : 'FAILED');
      } catch (error) {
        console.error('[KHSToolsSync] Mobile localStorage test failed:', error);
      }
    }
    
    // Test direct API connectivity
    const apiUrl = import.meta.env.VITE_API_URL || '';
    debugLog('API URL', apiUrl || 'Using relative path');
    
    // Simple connectivity test
    fetch(`${apiUrl}/api/health`)
      .then(res => {
        debugLog('Health check', `${res.status} ${res.ok ? 'OK' : 'Failed'}`);
      })
      .catch(err => {
        debugLog('Health check failed', err.message);
      });
    
    syncWithDatabase();
  }, []);

  // Periodic database sync
  useEffect(() => {
    debugLog(`[SYNC-INTERVAL] Setting up ${DB_SYNC_INTERVAL}ms interval`);
    const interval = setInterval(() => {
      debugLog('[SYNC-INTERVAL] Timer fired - checking for updates');
      syncWithDatabase();
    }, DB_SYNC_INTERVAL);
    return () => {
      debugLog('[SYNC-INTERVAL] Cleanup - clearing interval');
      clearInterval(interval);
    };
  }, []); // Remove dbVersion dependency - we don't want to reset the interval when version changes

  // Track unsaved changes when toolsData changes
  useEffect(() => {
    debugLog('[CHANGE-TRACKING] useEffect triggered', {
      lastUpdated: toolsData.lastUpdated,
      isSyncingFromDatabase: isSyncingFromDatabase.current
    });
    
    // Create a string representation of the current data for comparison
    const currentDataString = JSON.stringify({
      tools: toolsData.tools,
      lockedCategories: toolsData.lockedCategories
    });
    
    // Skip if data hasn't actually changed
    if (currentDataString === previousToolsDataRef.current) {
      debugLog('[CHANGE-TRACKING] Skipping - data unchanged (string comparison)');
      return;
    }
    
    debugLog('[CHANGE-TRACKING] Data changed detected', {
      previousLength: previousToolsDataRef.current.length,
      currentLength: currentDataString.length
    });
    
    // Update previous data reference
    previousToolsDataRef.current = currentDataString;
    
    // Skip initial render
    if (toolsData.lastUpdated === 0) {
      debugLog('[CHANGE-TRACKING] Skipping - initial render (lastUpdated=0)');
      savedDataRef.current = currentDataString; // Initialize saved state
      return;
    }
    
    // Skip if this is a sync from database
    if (isSyncingFromDatabase.current) {
      debugLog('[CHANGE-TRACKING] Skipping - sync from database in progress');
      savedDataRef.current = currentDataString; // Update saved state
      setHasUnsavedChanges(false);
      return;
    }
    
    // Check if we have unsaved changes
    const hasChanges = currentDataString !== savedDataRef.current;
    setHasUnsavedChanges(hasChanges);
    
    debugLog('[CHANGE-TRACKING] Unsaved changes:', hasChanges ? 'YES' : 'NO');
    
    // Clear any pending auto-sync timeout since we're now manual
    if (syncTimeoutRef.current) {
      debugLog('[CHANGE-TRACKING] Clearing auto-sync timeout');
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, [toolsData]);

  const updateToolsData = (updates: Partial<ToolsData>) => {
    debugLog('[UPDATE] updateToolsData called', {
      updates: Object.keys(updates),
      hasTools: 'tools' in updates,
      hasLockedCategories: 'lockedCategories' in updates
    });
    setToolsData(prev => {
      const newData = { 
        ...prev, 
        ...updates,
        lastUpdated: Date.now() 
      };
      debugLog('[UPDATE] New state will be', {
        lastUpdated: newData.lastUpdated,
        hasToolChanges: 'tools' in updates,
        hasLockedCategories: 'lockedCategories' in updates
      });
      return newData;
    });
  };
  
  // Manual save function
  const saveChanges = async () => {
    if (!hasUnsavedChanges || isPushing) return;
    
    debugLog('[SAVE] Manual save initiated');
    await pushToDatabase();
    
    // Update saved state after successful push
    const currentDataString = JSON.stringify({
      tools: toolsData.tools,
      lockedCategories: toolsData.lockedCategories
    });
    savedDataRef.current = currentDataString;
    setHasUnsavedChanges(false);
    debugLog('[SAVE] Changes saved successfully');
  };

  const handleCategoryToggle = (category: string, section: 'demo' | 'install') => {
    if (section === 'demo') {
      const selectedDemoCategories = viewPrefs.selectedDemoCategories.includes(category)
        ? viewPrefs.selectedDemoCategories.filter(c => c !== category)
        : [...viewPrefs.selectedDemoCategories, category];
      
      setViewPrefs(prev => ({ ...prev, selectedDemoCategories }));
    } else {
      const selectedInstallCategories = viewPrefs.selectedInstallCategories.includes(category)
        ? viewPrefs.selectedInstallCategories.filter(c => c !== category)
        : [...viewPrefs.selectedInstallCategories, category];
      
      setViewPrefs(prev => ({ ...prev, selectedInstallCategories }));
    }
  };

  const handleToolCheck = (category: string, toolId: string) => {
    const newTools = { ...toolsData.tools };
    newTools[category] = newTools[category].map(tool =>
      tool.id === toolId ? { ...tool, checked: !tool.checked } : tool
    );
    updateToolsData({ tools: newTools });
  };

  const handleAddTool = (category: string) => {
    if (!newToolName.trim() || isCategoryLocked(category)) return;

    const newTool: Tool = {
      id: `custom-${Date.now()}`,
      name: newToolName.trim(),
      checked: false,
      custom: true
    };

    const newTools = { ...toolsData.tools };
    newTools[category] = [...(newTools[category] || []), newTool];
    updateToolsData({ tools: newTools });

    setNewToolName('');
  };

  const handleDeleteTool = (category: string, toolId: string) => {
    if (isCategoryLocked(category)) return;

    const newTools = { ...toolsData.tools };
    newTools[category] = newTools[category].filter(tool => tool.id !== toolId);
    updateToolsData({ tools: newTools });
  };

  const handleClearCategory = (category: string) => {
    const newTools = { ...toolsData.tools };
    newTools[category] = newTools[category].map(tool => ({ ...tool, checked: false }));
    updateToolsData({ tools: newTools });
  };

  const handleEditTool = (category: string, toolId: string, newName: string) => {
    const newTools = { ...toolsData.tools };
    newTools[category] = newTools[category].map(tool =>
      tool.id === toolId ? { ...tool, name: newName } : tool
    );
    updateToolsData({ tools: newTools });
    setEditingToolId(null);
    setEditingToolName('');
  };

  const toggleCategoryLock = (category: string) => {
    const lockedCategories = toolsData.lockedCategories.includes(category)
      ? toolsData.lockedCategories.filter(c => c !== category)
      : [...toolsData.lockedCategories, category];
    updateToolsData({ lockedCategories });
  };

  const isCategoryLocked = (category: string) => {
    return toolsData.lockedCategories.includes(category);
  };

  // Clear invalid categories when Demo/Install changes
  useEffect(() => {
    if (!viewPrefs.showDemo) {
      setViewPrefs(prev => ({ ...prev, selectedDemoCategories: [] }));
    } else {
      const validDemoCategories = viewPrefs.selectedDemoCategories.filter(cat => 
        demoCategories.includes(cat)
      );
      if (validDemoCategories.length !== viewPrefs.selectedDemoCategories.length) {
        setViewPrefs(prev => ({ ...prev, selectedDemoCategories: validDemoCategories }));
      }
    }
    
    if (!viewPrefs.showInstall) {
      setViewPrefs(prev => ({ ...prev, selectedInstallCategories: [] }));
    } else {
      const validInstallCategories = viewPrefs.selectedInstallCategories.filter(cat => 
        installCategories.includes(cat)
      );
      if (validInstallCategories.length !== viewPrefs.selectedInstallCategories.length) {
        setViewPrefs(prev => ({ ...prev, selectedInstallCategories: validInstallCategories }));
      }
    }
  }, [viewPrefs.showDemo, viewPrefs.showInstall]);

  const renderToolsList = () => {
    return (
      <div style={{ padding: '16px' }}>
        {/* Category Selection */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={viewPrefs.showDemo}
                onChange={(e) => setViewPrefs(prev => ({ ...prev, showDemo: e.target.checked }))}
                style={{
                  marginRight: '8px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Demo</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={viewPrefs.showInstall}
                onChange={(e) => setViewPrefs(prev => ({ ...prev, showInstall: e.target.checked }))}
                style={{
                  marginRight: '8px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Install</span>
            </label>
          </div>

          {/* Demo Categories */}
          {viewPrefs.showDemo && (
            <div style={{
              backgroundColor: '#FEF3C7',
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#92400E', margin: 0, minWidth: '45px' }}>
                Demo:
              </h4>
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
              }}>
                {demoCategories.map(category => (
                  <label
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      backgroundColor: viewPrefs.selectedDemoCategories.includes(category) ? '#FDE68A' : 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #FCD34D',
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={viewPrefs.selectedDemoCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category, 'demo')}
                      style={{
                        marginRight: '6px',
                        width: '14px',
                        height: '14px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#78350F' }}>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Install Categories */}
          {viewPrefs.showInstall && (
            <div style={{
              backgroundColor: '#DBEAFE',
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1E40AF', margin: 0, minWidth: '45px' }}>
                Install:
              </h4>
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
              }}>
                {installCategories.map(category => (
                  <label
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      backgroundColor: viewPrefs.selectedInstallCategories.includes(category) ? '#BFDBFE' : 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #93C5FD',
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={viewPrefs.selectedInstallCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category, 'install')}
                      style={{
                        marginRight: '6px',
                        width: '14px',
                        height: '14px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#1E3A8A' }}>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* Selected Categories Tools */}
        {!viewPrefs.showDemo && !viewPrefs.showInstall ? null : 
         viewPrefs.selectedDemoCategories.length === 0 && viewPrefs.selectedInstallCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6B7280',
            fontSize: '18px',
          }}>
            Select categories above to view tool lists
          </div>
        ) : (
          [...viewPrefs.selectedDemoCategories, ...viewPrefs.selectedInstallCategories].map(category => (
            <div key={category} style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #E5E7EB',
              }}>
                <h4 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                }}>
                  {category} {!isCategoryLocked(category) && <span style={{ fontSize: '14px', color: '#10B981' }}>(Edit Mode)</span>}
                </h4>
                <button
                  onClick={() => handleClearCategory(category)}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#FB923C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F97316';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FB923C';
                  }}
                >
                  Clear
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                {toolsData.tools[category]?.map(tool => (
                  <div
                    key={tool.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #F3F4F6',
                      position: 'relative',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        flex: 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={tool.checked}
                        onChange={() => handleToolCheck(category, tool.id)}
                        style={{
                          marginRight: '12px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                        }}
                      />
                      {editingToolId === tool.id ? (
                        <input
                          type="text"
                          value={editingToolName}
                          onChange={(e) => setEditingToolName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTool(category, tool.id, editingToolName);
                            }
                          }}
                          onBlur={() => handleEditTool(category, tool.id, editingToolName)}
                          style={{
                            fontSize: '18px',
                            color: '#374151',
                            border: '1px solid #3B82F6',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            backgroundColor: 'white',
                          }}
                          autoFocus
                        />
                      ) : (
                        <span 
                          style={{
                            fontSize: '18px',
                            color: '#374151',
                            textDecoration: tool.checked ? 'line-through' : 'none',
                            opacity: tool.checked ? 0.6 : 1,
                            cursor: !isCategoryLocked(category) ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (!isCategoryLocked(category)) {
                              setEditingToolId(tool.id);
                              setEditingToolName(tool.name);
                            }
                          }}
                        >
                          {tool.name}
                        </span>
                      )}
                    </label>
                    {!isCategoryLocked(category) && (
                      <button
                        onClick={() => handleDeleteTool(category, tool.id)}
                        style={{
                          position: 'absolute',
                          left: '300px',
                          padding: '4px 6px',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          minWidth: '35px',
                        }}
                      >
                        Del
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new tool and Lock/Edit button */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', position: 'relative' }}>
                {!isCategoryLocked(category) ? (
                  <>
                    <input
                      type="text"
                      value={newToolName}
                      onChange={(e) => setNewToolName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTool(category);
                        }
                      }}
                      placeholder="Add new tool..."
                      style={{
                        width: '200px',
                        padding: '6px 10px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '16px',
                      }}
                    />
                    <button
                      onClick={() => handleAddTool(category)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        marginLeft: '8px',
                      }}
                    >
                      Add
                    </button>
                  </>
                ) : (
                  <div style={{ width: '200px' }}></div>
                )}
                <button
                  onClick={() => toggleCategoryLock(category)}
                  style={{
                    position: 'absolute',
                    left: '300px',
                    padding: '6px 12px',
                    backgroundColor: isCategoryLocked(category) ? '#10B981' : '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  {isCategoryLocked(category) ? 'Edit' : 'Lock'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Tools List':
        return renderToolsList();
      case 'SOP':
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: '18px' }}>Standard Operating Procedures - Coming Soon</p>
          </div>
        );
      case 'Office Docs':
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: '18px' }}>Office Documents - Coming Soon</p>
          </div>
        );
      case 'Specs':
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: '18px' }}>Specifications - Coming Soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div style={{ 
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '100px' // Extra padding for iOS scrolling
      }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#6B7280',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 style={{ fontSize: '27.6px', fontWeight: 'bold', margin: 0 }}>
              KHS Info
            </h1>
            {hasUnsavedChanges && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '12px',
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                Unsaved
              </span>
            )}
            {isSyncing && (
              <span style={{
                marginLeft: '12px',
                fontSize: '14px',
                color: '#3B82F6',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></span>
                Syncing...
              </span>
            )}
            <div style={{
              marginLeft: 'auto',
              fontSize: '12px',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>Version: {dbVersion}</span>
              {hasUnsavedChanges && (
                <button
                  onClick={() => saveChanges()}
                  disabled={isPushing}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: isPushing ? '#9CA3AF' : '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isPushing ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isPushing ? (
                    <>
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '2px solid #fff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  debugLog('Manual sync triggered');
                  syncWithDatabase();
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sync Now
              </button>
              <button
                onClick={() => setDebugLogs(debugLogs.length > 0 ? [] : ['Debug console opened'])}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Debug
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 20px',
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          borderRadius: '8px 8px 0 0',
          marginTop: '16px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 0',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === tab ? '#3B82F6' : '#6B7280',
                fontSize: '18px',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ backgroundColor: 'white', minHeight: '500px', borderRadius: '0 0 8px 8px' }}>
          {renderTabContent()}
        </div>
      </div>
      
      {/* Debug Console for Mobile */}
      {debugLogs.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '200px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: '#00ff00',
          padding: '10px',
          fontSize: '10px',
          fontFamily: 'monospace',
          overflowY: 'auto',
          zIndex: 9999,
          borderTop: '2px solid #00ff00'
        }}>
          <div style={{ marginBottom: '5px', color: '#ffff00', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
            <span>Debug Console (tap to close) | DB Version: {dbVersion} | Syncing: {isSyncing ? 'YES' : 'NO'} | Queue: {khsToolsSyncApi.getSyncQueueSize()}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              {dbVersion > 19 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    debugLog('Force push initiated');
                    pushToDatabase(true);
                  }}
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Force Push v{dbVersion}
                </button>
              )}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  debugLog('Force pull initiated - overriding local data');
                  const apiUrl = import.meta.env.VITE_API_URL || '';
                  debugLog('API URL:', apiUrl || 'relative path');
                  
                  try {
                    const serverData = await khsToolsSyncApi.refresh();
                    // Force update local state with server data
                    isSyncingFromDatabase.current = true;
                    setToolsData({
                      tools: serverData.tools || {},
                      lockedCategories: serverData.lockedCategories || [],
                      lastUpdated: new Date(serverData.lastUpdated).getTime()
                    });
                    setDbVersion(serverData.version);
                    debugLog('Force pull complete, new version:', serverData.version);
                    setTimeout(() => {
                      isSyncingFromDatabase.current = false;
                    }, 100);
                  } catch (error: any) {
                    debugLog('Force pull FAILED - Full error details:');
                    debugLog('Error type:', error.name || 'Unknown');
                    debugLog('Error message:', error.message || 'No message');
                    debugLog('Error code:', error.code || 'No code');
                    
                    if (error.response) {
                      debugLog('Response status:', error.response.status);
                      debugLog('Response data:', JSON.stringify(error.response.data));
                      debugLog('Response headers:', JSON.stringify(error.response.headers));
                    } else if (error.request) {
                      debugLog('Request made but no response received');
                      debugLog('Request URL:', error.config?.url || 'Unknown');
                      debugLog('Request method:', error.config?.method || 'Unknown');
                      debugLog('Is network error:', error.message.includes('Network') ? 'YES' : 'NO');
                    } else {
                      debugLog('Error setting up request:', error.message);
                    }
                    
                    debugLog('Full error object:', JSON.stringify(error, null, 2));
                  }
                }}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Force Pull
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Clear all sync data and localStorage? This will reset everything.')) {
                    debugLog('Clearing all sync data');
                    khsToolsSyncApi.clearAllSyncData();
                    khsToolsSyncApi.clearSyncQueue();
                    // Clear other localStorage items
                    localStorage.removeItem('khs-tools-sync-data-v4');
                    localStorage.removeItem('khs-tools-db-version');
                    debugLog('All sync data cleared - please refresh the page');
                  }
                }}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Clear Storage
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  debugLog('Optimizing storage...');
                  
                  // Clean and optimize tools data
                  const optimized = {
                    tools: {} as any,
                    lockedCategories: toolsData.lockedCategories,
                    lastUpdated: toolsData.lastUpdated
                  };
                  
                  // Remove duplicates and clean up tools
                  Object.entries(toolsData.tools).forEach(([category, tools]) => {
                    const uniqueTools = new Map();
                    (tools as Tool[]).forEach(tool => {
                      if (!uniqueTools.has(tool.id)) {
                        uniqueTools.set(tool.id, {
                          id: tool.id,
                          name: tool.name,
                          checked: tool.checked,
                          ...(tool.custom ? { custom: true } : {})
                        });
                      }
                    });
                    optimized.tools[category] = Array.from(uniqueTools.values());
                  });
                  
                  // Update state with optimized data
                  setToolsData(optimized);
                  
                  // Clear old localStorage versions
                  const keysToRemove: string[] = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('khs-tools-sync-data-') && key !== STORAGE_KEY) {
                      keysToRemove.push(key);
                    }
                  }
                  
                  keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                    debugLog(`Removed old key: ${key}`);
                  });
                  
                  debugLog('Storage optimized');
                }}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Optimize
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  debugLog('Clearing sync queue only');
                  khsToolsSyncApi.clearSyncQueue();
                  debugLog('Sync queue cleared');
                }}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Clear Queue
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  debugLog('=== API TEST STARTING ===');
                  
                  const apiUrl = import.meta.env.VITE_API_URL || '';
                  const fullUrl = apiUrl ? `${apiUrl}/api/health` : '/api/health';
                  const token = localStorage.getItem('khs-crm-token');
                  
                  debugLog('Test URL:', fullUrl);
                  debugLog('Base API URL:', apiUrl || 'relative');
                  debugLog('Auth token:', token ? `Bearer ${token.substring(0, 10)}...` : 'NO TOKEN');
                  debugLog('Current origin:', window.location.origin);
                  debugLog('User agent:', navigator.userAgent);
                  
                  try {
                    debugLog('Making fetch request...');
                    const startTime = Date.now();
                    
                    const response = await fetch(fullUrl, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      // Don't use credentials for cross-origin requests
                      credentials: apiUrl ? 'omit' : 'same-origin'
                    });
                    
                    const duration = Date.now() - startTime;
                    debugLog(`Response received in ${duration}ms`);
                    debugLog('Response status:', response.status);
                    debugLog('Response ok:', response.ok ? 'YES' : 'NO');
                    debugLog('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
                    
                    const data = await response.json();
                    debugLog('Response data:', JSON.stringify(data, null, 2));
                    
                    if (response.ok) {
                      debugLog('=== API TEST SUCCESS ===');
                    } else {
                      debugLog('=== API TEST FAILED (bad status) ===');
                    }
                  } catch (error: any) {
                    debugLog('=== API TEST FAILED WITH ERROR ===');
                    debugLog('Error name:', error.name);
                    debugLog('Error message:', error.message);
                    debugLog('Error stack:', error.stack);
                    
                    // Check for specific error types
                    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                      debugLog('NETWORK ERROR - Cannot reach server');
                      debugLog('Possible causes:');
                      debugLog('- CORS blocking request');
                      debugLog('- Server unreachable');
                      debugLog('- HTTPS/HTTP mismatch');
                      debugLog('- Network connectivity issue');
                    }
                    
                    // Try to determine if it's CORS
                    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                      debugLog('CORS ERROR DETECTED');
                    }
                    
                    debugLog('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                  }
                }}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#ec4899',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Test API
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // Calculate storage usage
                  let totalSize = 0;
                  let itemCount = 0;
                  const storageInfo: string[] = [];
                  
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                      const value = localStorage.getItem(key) || '';
                      const size = new Blob([key + value]).size;
                      totalSize += size;
                      itemCount++;
                      
                      if (key.includes('khs') || key.includes('tools')) {
                        storageInfo.push(`${key}: ${(size / 1024).toFixed(1)}KB`);
                      }
                    }
                  }
                  
                  debugLog('=== STORAGE INFO ===');
                  debugLog(`Total localStorage usage: ${(totalSize / 1024).toFixed(1)}KB`);
                  debugLog(`Number of items: ${itemCount}`);
                  debugLog('KHS-related items:');
                  storageInfo.forEach(info => debugLog(info));
                  
                  // Check specific data sizes
                  const toolsData = localStorage.getItem(STORAGE_KEY);
                  if (toolsData) {
                    debugLog(`Tools data size: ${(new Blob([toolsData]).size / 1024).toFixed(1)}KB`);
                    const parsed = JSON.parse(toolsData);
                    debugLog(`Number of categories: ${Object.keys(parsed.tools || {}).length}`);
                    let totalTools = 0;
                    Object.values(parsed.tools || {}).forEach((tools: any) => {
                      totalTools += tools.length;
                    });
                    debugLog(`Total tools: ${totalTools}`);
                  }
                  
                  debugLog('=== END STORAGE INFO ===');
                }}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#9333ea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Storage Info
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  
                  // Prepare debug log export
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                  const deviceType = isMobile ? 'Mobile' : 'Desktop';
                  const apiUrl = import.meta.env.VITE_API_URL || 'relative';
                  const exportTime = new Date().toLocaleString();
                  const logEntries = debugLogs.slice(-100); // Last 100 entries
                  
                  const logText = `===== Debug Log Export =====
Device: ${deviceType}
URL: ${window.location.href}
API: ${apiUrl}
Version: ${dbVersion}
Time: ${exportTime}
User Agent: ${navigator.userAgent}
===== Log Entries (${logEntries.length}) =====
${logEntries.join('\n')}
=========================`;
                  
                  // Try modern clipboard API first
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                      await navigator.clipboard.writeText(logText);
                      debugLog('Debug log copied to clipboard!');
                      
                      // Show temporary success message
                      const originalText = (e.target as HTMLButtonElement).textContent;
                      (e.target as HTMLButtonElement).textContent = 'Copied!';
                      setTimeout(() => {
                        (e.target as HTMLButtonElement).textContent = originalText || 'Copy Log';
                      }, 1500);
                    } catch (err) {
                      debugLog('Clipboard API failed, using fallback');
                      // Fallback method below
                    }
                  }
                  
                  // Fallback for older browsers or if clipboard API fails
                  if (!navigator.clipboard || !(await navigator.clipboard.writeText(logText).then(() => true).catch(() => false))) {
                    // Create textarea element
                    const textArea = document.createElement('textarea');
                    textArea.value = logText;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                      const successful = document.execCommand('copy');
                      if (successful) {
                        debugLog('Debug log copied using fallback method');
                        const originalText = (e.target as HTMLButtonElement).textContent;
                        (e.target as HTMLButtonElement).textContent = 'Copied!';
                        setTimeout(() => {
                          (e.target as HTMLButtonElement).textContent = originalText || 'Copy Log';
                        }, 1500);
                      } else {
                        // Last resort - show in alert for manual copy
                        debugLog('Copy failed - showing in prompt');
                        prompt('Copy the debug log below:', logText);
                      }
                    } catch (err) {
                      debugLog('All copy methods failed');
                      prompt('Copy the debug log below:', logText);
                    } finally {
                      document.body.removeChild(textArea);
                    }
                  }
                }}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Copy Log
              </button>
            </div>
          </div>
          <div onClick={() => setDebugLogs([])}>
            {debugLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default KHSInfoSimple;