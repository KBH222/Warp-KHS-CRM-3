import { useState, useEffect } from 'react';

interface Tool {
  id: string;
  name: string;
  checked: boolean;
  custom?: boolean;
}

interface CategoryTools {
  [category: string]: Tool[];
}

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

const KHSInfo = () => {
  const [activeTab, setActiveTab] = useState('Tools List');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tools, setTools] = useState<CategoryTools>({});
  const [isLocked, setIsLocked] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dragOverToolId, setDragOverToolId] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  const tabs = ['Tools List', 'SOP', 'Office Docs', 'Specs'];
  const demoCategories = ['Kitchen', 'Bathroom', 'Flooring', 'Framing', 'Drywall'];
  const installCategories = ['Cabinets', 'Drywall', 'Flooring', 'Framing', 'Decking', 'Painting'];

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('khs-tools-data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setTools(parsed.tools || {});
      setSelectedCategories(parsed.selectedCategories || []);
      setIsLocked(parsed.isLocked || false);
      setShowDemo(parsed.showDemo || false);
      setShowInstall(parsed.showInstall || false);
    } else {
      // Initialize with predefined tools
      setTools(predefinedTools);
    }
  }, []);

  // Clear invalid categories when Demo/Install changes
  useEffect(() => {
    if (!showDemo && !showInstall) {
      setSelectedCategories([]);
    } else {
      // Remove categories that are no longer available
      const availableCategories = [
        ...(showDemo ? demoCategories : []),
        ...(showInstall ? installCategories : [])
      ];
      setSelectedCategories(prev => prev.filter(cat => availableCategories.includes(cat)));
    }
  }, [showDemo, showInstall, demoCategories, installCategories]);

  // Save data whenever it changes
  useEffect(() => {
    const dataToSave = {
      tools,
      selectedCategories,
      isLocked,
      showDemo,
      showInstall,
    };
    localStorage.setItem('khs-tools-data', JSON.stringify(dataToSave));
  }, [tools, selectedCategories, isLocked, showDemo, showInstall]);

  const handleCategoryToggle = (category: string) => {
    if (isLocked) {
return;
}
    
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleToolCheck = (category: string, toolId: string) => {
    setTools(prev => ({
      ...prev,
      [category]: prev[category].map(tool =>
        tool.id === toolId ? { ...tool, checked: !tool.checked } : tool,
      ),
    }));
  };

  const handleAddTool = (category: string) => {
    if (!newToolName.trim() || isLocked) {
return;
}

    const newTool: Tool = {
      id: `custom-${Date.now()}`,
      name: newToolName.trim(),
      checked: false,
      custom: true,
    };

    setTools(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newTool],
    }));

    setNewToolName('');
  };

  const handleDeleteTool = (category: string, toolId: string) => {
    if (isLocked) {
return;
}

    setTools(prev => ({
      ...prev,
      [category]: prev[category].filter(tool => tool.id !== toolId),
    }));
  };

  const handleClearCategory = (category: string) => {
    setTools(prev => ({
      ...prev,
      [category]: prev[category].map(tool => ({ ...tool, checked: false })),
    }));
    // Also clear any selections for this category
    setSelectedTools(prev => {
      const newSet = new Set(prev);
      tools[category]?.forEach(tool => {
        newSet.delete(tool.id);
      });
      return newSet;
    });
  };

  const renderToolsList = () => {
    return (
      <div style={{ padding: '20px' }}>
        {/* Category Selection */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
            }}>
              <input
                type="checkbox"
                checked={showDemo}
                onChange={(e) => setShowDemo(e.target.checked)}
                disabled={isLocked}
                style={{
                  marginRight: '8px',
                  width: '18px',
                  height: '18px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Demo</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
            }}>
              <input
                type="checkbox"
                checked={showInstall}
                onChange={(e) => setShowInstall(e.target.checked)}
                disabled={isLocked}
                style={{
                  marginRight: '8px',
                  width: '18px',
                  height: '18px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Install</span>
            </label>
          </div>

          {/* Demo Categories */}
          {showDemo && (
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
                {demoCategories.map(category => (
                  <label
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      backgroundColor: selectedCategories.includes(category) ? '#FDE68A' : 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FCD34D',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      disabled={isLocked}
                      style={{
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#78350F' }}>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Install Categories */}
          {showInstall && (
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
                {installCategories.map(category => (
                  <label
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      backgroundColor: selectedCategories.includes(category) ? '#BFDBFE' : 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #93C5FD',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      disabled={isLocked}
                      style={{
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#1E3A8A' }}>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lock/Unlock Button */}
        {console.log('Button render check - showDemo:', showDemo, 'showInstall:', showInstall, 'isLocked:', isLocked)}
        {(showDemo || showInstall) && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => {
                console.log('Button clicked. Current isLocked:', isLocked, 'Setting to:', !isLocked);
                setIsLocked(!isLocked);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: isLocked ? '#10B981' : '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {`${isLocked ? 'Edit' : 'Lock'} (isLocked: ${isLocked})`}
            </button>
          </div>
        )}

        {/* Selected Categories Tools */}
        {!showDemo && !showInstall ? null : selectedCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6B7280',
            fontSize: '18px',
          }}>
            Select categories above to view tool lists
          </div>
        ) : selectedCategories.length > 0 ? (
          selectedCategories.map(category => (
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
                  {category}
                </h4>
                <button
                  type="button"
                  onClick={() => handleClearCategory(category)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  Clear
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                {tools[category]?.map((tool, index) => (
                  <div
                    key={tool.id}
                    draggable={!isLocked}
                    onDragStart={(e) => {
                      if (isLocked) return;
                      setDraggedToolId(tool.id);
                      setDraggedCategory(category);
                      e.dataTransfer.effectAllowed = 'move';
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                      setDraggedToolId(null);
                      setDraggedCategory(null);
                      setDragOverToolId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedToolId && tool.id !== draggedToolId && draggedCategory === category) {
                        setDragOverToolId(tool.id);
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverToolId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedToolId && tool.id !== draggedToolId && draggedCategory === category) {
                        const categoryTools = [...(tools[category] || [])];
                        const draggedIndex = categoryTools.findIndex(t => t.id === draggedToolId);
                        const dropIndex = categoryTools.findIndex(t => t.id === tool.id);
                        
                        if (draggedIndex !== -1 && dropIndex !== -1) {
                          const [draggedTool] = categoryTools.splice(draggedIndex, 1);
                          categoryTools.splice(dropIndex, 0, draggedTool);
                          
                          setTools(prev => ({
                            ...prev,
                            [category]: categoryTools
                          }));
                        }
                      }
                      setDragOverToolId(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      backgroundColor: tool.checked ? '#F9FAFB' : 'white',
                      borderBottom: '1px solid #E5E7EB',
                      cursor: !isLocked && draggedToolId === tool.id ? 'grabbing' : 'move',
                      transition: 'all 0.2s',
                      transform: dragOverToolId === tool.id ? 'translateY(1px)' : 'none',
                      boxShadow: dragOverToolId === tool.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      opacity: draggedToolId === tool.id ? 0.5 : 1,
                      minHeight: '32px',
                    }}
                  >
                    {/* Drag Handle */}
                    {!isLocked && (
                      <div
                        style={{
                          padding: '2px',
                          cursor: 'grab',
                          color: '#9CA3AF',
                          fontSize: '14px',
                          lineHeight: 1,
                          marginRight: '6px',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#6B7280'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                      >
                        ≡
                      </div>
                    )}
                    <input
                      type="checkbox"
                      checked={tool.checked || selectedTools.has(tool.id)}
                      onChange={() => handleToolCheck(category, tool.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        marginRight: '8px',
                        cursor: 'pointer',
                        accentColor: '#3B82F6',
                        flexShrink: 0
                      }}
                    />
                    <span style={{
                      fontSize: '14px',
                      lineHeight: '20px',
                      textDecoration: tool.checked ? 'line-through' : 'none',
                      color: tool.checked ? '#9CA3AF' : '#111827',
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {tool.name}
                    </span>
                    {tool.custom && !isLocked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTool(category, tool.id)}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'transparent',
                          color: '#9CA3AF',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          lineHeight: '18px',
                          marginLeft: '8px',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF4444';
                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9CA3AF';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new tool */}
              {!isLocked && (
                <div style={{
                  backgroundColor: 'white',
                  borderBottom: '1px solid #E5E7EB',
                  padding: '12px',
                  marginTop: '8px'
                }}>
                  <input
                    type="text"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTool(category);
                      }
                    }}
                    placeholder="Add a tool..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                  />
                </div>
              )}
            </div>
          ))
        ) : null}
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
        padding: '16px 20px',
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

export default KHSInfo;