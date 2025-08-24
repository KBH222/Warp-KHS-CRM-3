import { useState, useEffect } from 'react';
import { toolsAPI, ToolSettings, ToolItem } from '../services/api/tools.api';

interface ToolsByList {
  [listName: string]: ToolItem[];
}

const KHSInfoSync = () => {
  const [activeTab, setActiveTab] = useState('Tools List');
  const [settings, setSettings] = useState<ToolSettings | null>(null);
  const [toolItems, setToolItems] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newToolName, setNewToolName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const tabs = ['Tools List', 'SOP', 'Office Docs', 'Specs'];

  // Load data on mount
  useEffect(() => {
    loadData();
    // Set up polling for real-time sync
    const interval = setInterval(loadData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, itemsData] = await Promise.all([
        toolsAPI.getSettings(),
        toolsAPI.getItems()
      ]);
      setSettings(settingsData);
      setToolItems(itemsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<ToolSettings>) => {
    if (!settings || savingSettings) return;
    
    setSavingSettings(true);
    try {
      const newSettings = { ...settings, ...updates };
      const updatedSettings = await toolsAPI.updateSettings(newSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error updating settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (!settings || settings.isLocked) return;
    
    const selectedCategories = settings.selectedCategories.includes(category)
      ? settings.selectedCategories.filter(c => c !== category)
      : [...settings.selectedCategories, category];
    
    updateSettings({ selectedCategories });
  };

  const handleToolCheck = async (item: ToolItem) => {
    try {
      await toolsAPI.updateItem(item.id, !item.isChecked);
      // Update local state
      setToolItems(prev => prev.map(t => 
        t.id === item.id ? { ...t, isChecked: !t.isChecked } : t
      ));
    } catch (err) {
      setError('Failed to update item');
      console.error('Error updating item:', err);
    }
  };

  const handleAddTool = async (listName: string) => {
    if (!newToolName.trim() || !settings || settings.isLocked) return;
    
    // Find the list ID for this list name
    const listItem = toolItems.find(item => item.list.name === listName);
    if (!listItem) return;
    
    try {
      const newItem = await toolsAPI.createItem(listItem.list.id, newToolName.trim());
      setToolItems(prev => [...prev, newItem]);
      setNewToolName('');
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    }
  };

  const handleDeleteTool = async (item: ToolItem) => {
    if (!settings || settings.isLocked) return;
    
    try {
      await toolsAPI.deleteItem(item.id);
      setToolItems(prev => prev.filter(t => t.id !== item.id));
    } catch (err) {
      setError('Failed to delete item');
      console.error('Error deleting item:', err);
    }
  };

  const handleClearCategory = async (listName: string) => {
    const listItem = toolItems.find(item => item.list.name === listName);
    if (!listItem) return;
    
    try {
      await toolsAPI.clearList(listItem.list.id);
      // Update local state
      setToolItems(prev => prev.map(item => 
        item.list.name === listName ? { ...item, isChecked: false } : item
      ));
    } catch (err) {
      setError('Failed to clear list');
      console.error('Error clearing list:', err);
    }
  };

  // Group tools by list name and filter by selected categories
  const getToolsByList = (): ToolsByList => {
    if (!settings) return {};
    
    const toolsByList: ToolsByList = {};
    
    toolItems.forEach(item => {
      const listName = item.list.name;
      const categoryName = item.list.category.name;
      
      // Check if this category is visible
      const isDemo = categoryName === 'Demo' && settings.showDemo;
      const isInstall = categoryName === 'Install' && settings.showInstall;
      
      if ((isDemo || isInstall) && settings.selectedCategories.includes(listName)) {
        if (!toolsByList[listName]) {
          toolsByList[listName] = [];
        }
        toolsByList[listName].push(item);
      }
    });
    
    return toolsByList;
  };

  const getDemoLists = () => {
    const uniqueLists = new Set<string>();
    toolItems.forEach(item => {
      if (item.list.category.name === 'Demo') {
        uniqueLists.add(item.list.name);
      }
    });
    return Array.from(uniqueLists).sort();
  };

  const getInstallLists = () => {
    const uniqueLists = new Set<string>();
    toolItems.forEach(item => {
      if (item.list.category.name === 'Install') {
        uniqueLists.add(item.list.name);
      }
    });
    return Array.from(uniqueLists).sort();
  };

  const renderToolsList = () => {
    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#6B7280' }}>Loading...</div>
        </div>
      );
    }

    if (!settings) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#DC2626' }}>Failed to load settings</div>
        </div>
      );
    }

    const toolsByList = getToolsByList();
    const demoLists = getDemoLists();
    const installLists = getInstallLists();

    return (
      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Category Selection */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: settings.isLocked ? 'not-allowed' : 'pointer',
              opacity: settings.isLocked ? 0.6 : 1,
            }}>
              <input
                type="checkbox"
                checked={settings.showDemo}
                onChange={(e) => updateSettings({ showDemo: e.target.checked })}
                disabled={settings.isLocked || savingSettings}
                style={{
                  marginRight: '8px',
                  width: '18px',
                  height: '18px',
                  cursor: settings.isLocked ? 'not-allowed' : 'pointer',
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Demo</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: settings.isLocked ? 'not-allowed' : 'pointer',
              opacity: settings.isLocked ? 0.6 : 1,
            }}>
              <input
                type="checkbox"
                checked={settings.showInstall}
                onChange={(e) => updateSettings({ showInstall: e.target.checked })}
                disabled={settings.isLocked || savingSettings}
                style={{
                  marginRight: '8px',
                  width: '18px',
                  height: '18px',
                  cursor: settings.isLocked ? 'not-allowed' : 'pointer',
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Install</span>
            </label>
          </div>

          {/* Demo Categories */}
          {settings.showDemo && demoLists.length > 0 && (
            <div style={{
              backgroundColor: '#FEF3C7',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#92400E', marginBottom: '12px' }}>
                Demo
              </h4>
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '8px',
                WebkitOverflowScrolling: 'touch',
              }}>
                {demoLists.map(listName => (
                  <label
                    key={listName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: settings.isLocked ? 'not-allowed' : 'pointer',
                      opacity: settings.isLocked ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      backgroundColor: settings.selectedCategories.includes(listName) ? '#FDE68A' : 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FCD34D',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.selectedCategories.includes(listName)}
                      onChange={() => handleCategoryToggle(listName)}
                      disabled={settings.isLocked || savingSettings}
                      style={{
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        cursor: settings.isLocked ? 'not-allowed' : 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#78350F' }}>{listName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Install Categories */}
          {settings.showInstall && installLists.length > 0 && (
            <div style={{
              backgroundColor: '#DBEAFE',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1E40AF', marginBottom: '12px' }}>
                Install
              </h4>
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '8px',
                WebkitOverflowScrolling: 'touch',
              }}>
                {installLists.map(listName => (
                  <label
                    key={listName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: settings.isLocked ? 'not-allowed' : 'pointer',
                      opacity: settings.isLocked ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      backgroundColor: settings.selectedCategories.includes(listName) ? '#BFDBFE' : 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #93C5FD',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.selectedCategories.includes(listName)}
                      onChange={() => handleCategoryToggle(listName)}
                      disabled={settings.isLocked || savingSettings}
                      style={{
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        cursor: settings.isLocked ? 'not-allowed' : 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#1E3A8A' }}>{listName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lock/Unlock Button */}
        {(settings.showDemo || settings.showInstall) && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => updateSettings({ isLocked: !settings.isLocked })}
              disabled={savingSettings}
              style={{
                padding: '8px 16px',
                backgroundColor: settings.isLocked ? '#10B981' : '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: savingSettings ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: savingSettings ? 0.6 : 1,
              }}
            >
              {settings.isLocked ? '🔒 Unlock List' : '🔓 Lock List'}
            </button>
          </div>
        )}

        {/* Selected Categories Tools */}
        {!settings.showDemo && !settings.showInstall ? null : Object.keys(toolsByList).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6B7280',
            fontSize: '18px',
          }}>
            Select categories above to view tool lists
          </div>
        ) : (
          Object.entries(toolsByList).map(([listName, items]) => (
            <div key={listName} style={{ marginBottom: '32px' }}>
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
                  {listName}
                </h4>
                <button
                  onClick={() => handleClearCategory(listName)}
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
                {items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #F3F4F6',
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
                        checked={item.isChecked}
                        onChange={() => handleToolCheck(item)}
                        style={{
                          marginRight: '12px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{
                        fontSize: '18px',
                        color: '#374151',
                        textDecoration: item.isChecked ? 'line-through' : 'none',
                        opacity: item.isChecked ? 0.6 : 1,
                      }}>
                        {item.name}
                      </span>
                    </label>
                    {/* Only show delete for custom items (those without notes field used as marker) */}
                    {item.notes === 'custom' && !settings.isLocked && (
                      <button
                        onClick={() => handleDeleteTool(item)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new tool */}
              {!settings.isLocked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTool(listName);
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
                    onClick={() => handleAddTool(listName)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
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
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 20px'
      }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>
          KHS Info
        </h1>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 20px',
        display: 'flex',
        gap: '24px',
        overflowX: 'auto',
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
      <div style={{ backgroundColor: 'white', minHeight: 'calc(100% - 120px)' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default KHSInfoSync;