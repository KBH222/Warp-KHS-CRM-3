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
  'Kitchen Demo': [
    { id: 'kd1', name: 'Sledgehammer (20lb)', checked: false },
    { id: 'kd2', name: 'Crowbar (36")', checked: false },
    { id: 'kd3', name: 'Reciprocating saw', checked: false },
    { id: 'kd4', name: 'Utility knife', checked: false },
    { id: 'kd5', name: 'Safety glasses', checked: false },
    { id: 'kd6', name: 'Work gloves', checked: false },
    { id: 'kd7', name: 'Dust masks', checked: false },
    { id: 'kd8', name: 'Drop cloths', checked: false },
    { id: 'kd9', name: 'Trash bags (heavy duty)', checked: false },
    { id: 'kd10', name: 'Shop vacuum', checked: false },
    { id: 'kd11', name: 'Extension cords', checked: false },
    { id: 'kd12', name: 'Work lights', checked: false },
  ],
  'Bathroom Demo': [
    { id: 'bd1', name: 'Sledgehammer (10lb)', checked: false },
    { id: 'bd2', name: 'Pry bar', checked: false },
    { id: 'bd3', name: 'Pipe wrench', checked: false },
    { id: 'bd4', name: 'Adjustable wrench', checked: false },
    { id: 'bd5', name: 'Safety glasses', checked: false },
    { id: 'bd6', name: 'Work gloves', checked: false },
    { id: 'bd7', name: 'Dust masks', checked: false },
    { id: 'bd8', name: 'Plastic sheeting', checked: false },
    { id: 'bd9', name: 'Trash bags', checked: false },
    { id: 'bd10', name: 'Bucket', checked: false },
    { id: 'bd11', name: 'Utility knife', checked: false },
    { id: 'bd12', name: 'Screwdriver set', checked: false },
  ],
  'Decks': [
    { id: 'd1', name: 'Circular saw', checked: false },
    { id: 'd2', name: 'Miter saw', checked: false },
    { id: 'd3', name: 'Drill/Driver set', checked: false },
    { id: 'd4', name: 'Level (4ft)', checked: false },
    { id: 'd5', name: 'Tape measure (25ft)', checked: false },
    { id: 'd6', name: 'Chalk line', checked: false },
    { id: 'd7', name: 'Speed square', checked: false },
    { id: 'd8', name: 'Post hole digger', checked: false },
    { id: 'd9', name: 'String line', checked: false },
    { id: 'd10', name: 'Safety glasses', checked: false },
    { id: 'd11', name: 'Work gloves', checked: false },
    { id: 'd12', name: 'Extension cords', checked: false },
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
};

const KHSInfo = () => {
  const [activeTab, setActiveTab] = useState('Tools List');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tools, setTools] = useState<CategoryTools>({});
  const [isLocked, setIsLocked] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const tabs = ['Tools List', 'SOP', 'Office Docs', 'Specs'];
  const categories = ['Kitchen Demo', 'Bathroom Demo', 'Decks', 'Flooring', 'Drywall'];

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('khs-tools-data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setTools(parsed.tools || {});
      setSelectedCategories(parsed.selectedCategories || []);
      setIsLocked(parsed.isLocked || false);
    } else {
      // Initialize with predefined tools
      setTools(predefinedTools);
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const dataToSave = {
      tools,
      selectedCategories,
      isLocked,
    };
    localStorage.setItem('khs-tools-data', JSON.stringify(dataToSave));
  }, [tools, selectedCategories, isLocked]);

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

  const renderToolsList = () => {
    return (
      <div style={{ padding: '20px' }}>
        {/* Category Selection */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Select Categories
            </h3>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              disabled={isLocked}
              style={{
                padding: '6px 12px',
                backgroundColor: isLocked ? '#E5E7EB' : '#3B82F6',
                color: isLocked ? '#9CA3AF' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {showCategoryDropdown ? 'Hide Categories' : 'Show Categories'}
            </button>
          </div>

          {showCategoryDropdown && (
            <div style={{
              backgroundColor: '#F9FAFB',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              {categories.map(category => (
                <label
                  key={category}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.6 : 1,
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
                  <span style={{ fontSize: '16px', color: '#374151' }}>{category}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Lock/Unlock Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setIsLocked(!isLocked)}
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
            {isLocked ? '🔒 Unlock List' : '🔓 Lock List'}
          </button>
        </div>

        {/* Selected Categories Tools */}
        {selectedCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6B7280',
            fontSize: '16px',
          }}>
            Select categories above to view tool lists
          </div>
        ) : (
          selectedCategories.map(category => (
            <div key={category} style={{ marginBottom: '32px' }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #E5E7EB',
              }}>
                {category}
              </h4>

              <div style={{ marginBottom: '16px' }}>
                {tools[category]?.map(tool => (
                  <div
                    key={tool.id}
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
                        checked={tool.checked}
                        onChange={() => handleToolCheck(category, tool.id)}
                        style={{
                          marginRight: '12px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{
                        fontSize: '16px',
                        color: '#374151',
                        textDecoration: tool.checked ? 'line-through' : 'none',
                        opacity: tool.checked ? 0.6 : 1,
                      }}>
                        {tool.name}
                      </span>
                    </label>
                    {tool.custom && !isLocked && (
                      <button
                        onClick={() => handleDeleteTool(category, tool.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
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
              {!isLocked && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
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
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={() => handleAddTool(category)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
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
            <p style={{ fontSize: '16px' }}>Standard Operating Procedures - Coming Soon</p>
          </div>
        );
      case 'Office Docs':
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: '16px' }}>Office Documents - Coming Soon</p>
          </div>
        );
      case 'Specs':
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: '16px' }}>Specifications - Coming Soon</p>
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
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
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
              fontSize: '16px',
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