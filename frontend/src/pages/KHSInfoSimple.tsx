import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Tool {
  id: string;
  name: string;
  checked: boolean;
  custom?: boolean;
}

interface CategoryTools {
  [category: string]: Tool[];
}

interface ToolsData {
  tools: CategoryTools;
  selectedDemoCategories: string[];
  selectedInstallCategories: string[];
  lockedCategories: string[];
  showDemo: boolean;
  showInstall: boolean;
  lastUpdated: number;
}

const STORAGE_KEY = 'khs-tools-sync-data-v4';
const SYNC_INTERVAL = 2000; // Check for updates every 2 seconds

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
  const [toolsData, setToolsData] = useState<ToolsData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old data format
        if (parsed.selectedCategories && !parsed.selectedDemoCategories) {
          return {
            ...parsed,
            selectedDemoCategories: [],
            selectedInstallCategories: [],
            selectedCategories: undefined
          };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse stored data:', e);
      }
    }
    return {
      tools: predefinedTools,
      selectedDemoCategories: [],
      selectedInstallCategories: [],
      lockedCategories: [],
      showDemo: false,
      showInstall: false,
      lastUpdated: Date.now()
    };
  });
  const [newToolName, setNewToolName] = useState('');
  const [lastCheckedTime, setLastCheckedTime] = useState(Date.now());
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editingToolName, setEditingToolName] = useState('');

  const tabs = ['Tools List', 'SOP', 'Office Docs', 'Specs'];
  const demoCategories = ['Kitchen', 'Bathroom', 'Flooring', 'Framing', 'Drywall'];
  const installCategories = ['Cabinets', 'Drywall', 'Flooring', 'Framing', 'Decking', 'Painting'];

  // Save data whenever it changes
  useEffect(() => {
    const dataToSave = {
      ...toolsData,
      lastUpdated: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [toolsData]);

  // Poll for updates from other users
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Only update if data is newer than what we have
          if (parsed.lastUpdated > lastCheckedTime) {
            setToolsData(parsed);
            setLastCheckedTime(parsed.lastUpdated);
          }
        } catch (e) {
          console.error('Failed to parse stored data during sync:', e);
        }
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [lastCheckedTime]);

  const updateToolsData = (updates: Partial<ToolsData>) => {
    setToolsData(prev => ({ ...prev, ...updates }));
  };

  const handleCategoryToggle = (category: string, section: 'demo' | 'install') => {
    
    if (section === 'demo') {
      const selectedDemoCategories = toolsData.selectedDemoCategories.includes(category)
        ? toolsData.selectedDemoCategories.filter(c => c !== category)
        : [...toolsData.selectedDemoCategories, category];
      
      updateToolsData({ selectedDemoCategories });
    } else {
      const selectedInstallCategories = toolsData.selectedInstallCategories.includes(category)
        ? toolsData.selectedInstallCategories.filter(c => c !== category)
        : [...toolsData.selectedInstallCategories, category];
      
      updateToolsData({ selectedInstallCategories });
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
    if (!toolsData.showDemo) {
      updateToolsData({ selectedDemoCategories: [] });
    } else {
      const validDemoCategories = toolsData.selectedDemoCategories.filter(cat => 
        demoCategories.includes(cat)
      );
      if (validDemoCategories.length !== toolsData.selectedDemoCategories.length) {
        updateToolsData({ selectedDemoCategories: validDemoCategories });
      }
    }
    
    if (!toolsData.showInstall) {
      updateToolsData({ selectedInstallCategories: [] });
    } else {
      const validInstallCategories = toolsData.selectedInstallCategories.filter(cat => 
        installCategories.includes(cat)
      );
      if (validInstallCategories.length !== toolsData.selectedInstallCategories.length) {
        updateToolsData({ selectedInstallCategories: validInstallCategories });
      }
    }
  }, [toolsData.showDemo, toolsData.showInstall]);

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
                checked={toolsData.showDemo}
                onChange={(e) => updateToolsData({ showDemo: e.target.checked })}
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
                checked={toolsData.showInstall}
                onChange={(e) => updateToolsData({ showInstall: e.target.checked })}
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
          {toolsData.showDemo && (
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
                      backgroundColor: toolsData.selectedDemoCategories.includes(category) ? '#FDE68A' : 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #FCD34D',
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={toolsData.selectedDemoCategories.includes(category)}
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
          {toolsData.showInstall && (
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
                      backgroundColor: toolsData.selectedInstallCategories.includes(category) ? '#BFDBFE' : 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #93C5FD',
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={toolsData.selectedInstallCategories.includes(category)}
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
        {!toolsData.showDemo && !toolsData.showInstall ? null : 
         toolsData.selectedDemoCategories.length === 0 && toolsData.selectedInstallCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6B7280',
            fontSize: '18px',
          }}>
            Select categories above to view tool lists
          </div>
        ) : (
          [...toolsData.selectedDemoCategories, ...toolsData.selectedInstallCategories].map(category => (
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
                    backgroundColor: isCategoryLocked(category) ? '#EF4444' : '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  Lock/Edit
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
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
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
            borderRadius: '6px',
            marginTop: '-4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={{ fontSize: '27.6px', fontWeight: 'bold', margin: 0 }}>KHS Info</h1>
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

export default KHSInfoSimple;