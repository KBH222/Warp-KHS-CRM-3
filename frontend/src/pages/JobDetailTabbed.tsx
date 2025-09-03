import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const JobDetailTabbed = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('description');

  // Add CSS animations and hide any Add button
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes checkmark {
        0% {
          stroke-dasharray: 0 100;
        }
        100% {
          stroke-dasharray: 100 0;
        }
      }
      
      /* NUCLEAR OPTION: Hide ANY button with Add text in Tasks tab */
      button:has-text("Add") {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Force remove any Add button when Tasks tab is active
  useEffect(() => {
    if (activeTab === 'tasks') {
      const removeAddButtons = () => {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
          if (btn.textContent && btn.textContent.trim() === 'Add') {
            console.warn('FOUND ADD BUTTON - REMOVING:', btn);
            btn.style.display = 'none';
            btn.remove();
          }
        });
      };
      
      // Run immediately
      removeAddButtons();
      
      // Run again after a delay in case of dynamic rendering
      setTimeout(removeAddButtons, 100);
      setTimeout(removeAddButtons, 500);
      
      // Watch for new buttons being added
      const observer = new MutationObserver(removeAddButtons);
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => observer.disconnect();
    }
  }, [activeTab]);

  // Load job data from localStorage
  const [job, setJob] = useState(null);
  
  useEffect(() => {
    const jobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
    const foundJob = jobs.find(j => j.id === id);
    if (foundJob) {
      // Set default values if missing
      setJob({
        ...foundJob,
        pictures: foundJob.pictures || [],
        plans: foundJob.plans || [],
        tasks: foundJob.tasks || [],
        specialNotes: foundJob.specialNotes || ''
      });
    } else {
      navigate('/jobs');
    }
  }, [id, navigate]);
  
  // Initialize state when job loads
  useEffect(() => {
    if (job) {
      setTasks(job.tasks || []);
      setNotes(job.specialNotes || '');
      // Load materials from localStorage
      const savedMaterials = localStorage.getItem(`job_materials_${job.id}`);
      if (savedMaterials) {
        setMaterials(JSON.parse(savedMaterials));
      }
      // Load extra work items
      const savedExtraWork = localStorage.getItem(`job_extraWork_${job.id}`);
      if (savedExtraWork) {
        setExtraWorkItems(JSON.parse(savedExtraWork));
      } else {
        setExtraWorkItems(job.extraWork || []);
      }
    }
  }, [job]);

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Task management state
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const taskInputRef = useRef(null);
  const longPressTimer = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  
  // Materials state
  const [materials, setMaterials] = useState([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    quantity: '',
    unit: 'pieces',
    store: 'Home Depot',
    price: ''
  });

  const workers = ['KBH', 'ISA', 'TYL'];

  // Extra Work state
  const [extraWorkItems, setExtraWorkItems] = useState([]);
  const [showAddExtraWork, setShowAddExtraWork] = useState(false);
  const [newExtraWork, setNewExtraWork] = useState({
    description: '',
    cost: '',
    status: 'pending',
    dateAdded: new Date().toISOString()
  });

  // Save materials to localStorage whenever they change
  useEffect(() => {
    if (job?.id) {
      localStorage.setItem(`job_materials_${job.id}`, JSON.stringify(materials));
    }
  }, [materials, job]);

  // Save extra work items to localStorage whenever they change
  useEffect(() => {
    if (job?.id) {
      localStorage.setItem(`job_extraWork_${job.id}`, JSON.stringify(extraWorkItems));
    }
  }, [extraWorkItems, job]);

  const tabs = [
    { id: 'description', label: 'Job Description' },
    { id: 'pictures', label: `Pictures (${job?.pictures?.length || 0})` },
    { id: 'plans', label: 'Plans/Drawings' },
    { id: 'tasks', label: `Tasks (${tasks.filter(t => !t.completed).length}/${tasks.length})` },
    { id: 'materials', label: 'Materials' },
    { id: 'notes', label: 'Special Notes' },
    { id: 'extraWork', label: 'Extra Work' }
  ];

  const handleTaskToggle = (taskId, e) => {
    e?.stopPropagation();
    if (selectedTasks.size > 0) {
      // If we're in selection mode, toggle selection instead
      const newSelected = new Set(selectedTasks);
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId);
      } else {
        newSelected.add(taskId);
      }
      setSelectedTasks(newSelected);
    } else {
      // Normal toggle behavior
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      const newTaskItem = {
        id: Date.now(),
        text: newTask,
        completed: false,
        assignedTo: newTaskAssignee || null,
        order: tasks.length
      };
      setTasks([...tasks, newTaskItem]);
      setNewTask('');
      // Keep focus in input for continuous entry
      taskInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask(e);
    }
  };

  const handleAssignTask = (taskId, worker) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, assignedTo: worker } : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    // Remove from selected if it was selected
    const newSelected = new Set(selectedTasks);
    newSelected.delete(taskId);
    setSelectedTasks(newSelected);
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const handleBulkComplete = () => {
    setTasks(tasks.map(task => 
      selectedTasks.has(task.id) ? { ...task, completed: true } : task
    ));
    setSelectedTasks(new Set());
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedTasks.size} selected tasks?`)) {
      setTasks(tasks.filter(task => !selectedTasks.has(task.id)));
      setSelectedTasks(new Set());
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, task, index) => {
    setDraggedTask({ task, index });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '';
    setDraggedTask(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedTask && draggedTask.index !== dropIndex) {
      const newTasks = [...tasks];
      const [removed] = newTasks.splice(draggedTask.index, 1);
      newTasks.splice(dropIndex, 0, removed);
      setTasks(newTasks);
    }
    setDraggedTask(null);
    setDragOverIndex(null);
  };

  // Touch handlers for mobile drag
  const handleTouchStart = (e, task, index) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setDraggedTask({ task, index });
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // Cancel long press if moved too much
    if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isLongPress && draggedTask) {
      e.preventDefault();
      // Find element under touch point
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const taskElement = element?.closest('[data-task-index]');
      if (taskElement) {
        const index = parseInt(taskElement.getAttribute('data-task-index'));
        setDragOverIndex(index);
      }
    }
  };

  const handleTouchEnd = (e) => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;

    if (isLongPress && draggedTask && dragOverIndex !== null && draggedTask.index !== dragOverIndex) {
      const newTasks = [...tasks];
      const [removed] = newTasks.splice(draggedTask.index, 1);
      newTasks.splice(dragOverIndex, 0, removed);
      setTasks(newTasks);
    }

    setIsLongPress(false);
    setDraggedTask(null);
    setDragOverIndex(null);
  };

  // Material handling functions
  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (newMaterial.name && newMaterial.quantity && newMaterial.price) {
      const quantity = parseFloat(newMaterial.quantity);
      const price = parseFloat(newMaterial.price);
      const total = quantity * price;
      
      setMaterials([...materials, {
        id: Date.now(),
        name: newMaterial.name,
        quantity: quantity,
        unit: newMaterial.unit,
        store: newMaterial.store,
        price: price,
        total: total
      }]);
      
      setNewMaterial({
        name: '',
        quantity: '',
        unit: 'pieces',
        store: 'Home Depot',
        price: ''
      });
      setShowAddMaterial(false);
    }
  };

  const handleDeleteMaterial = (materialId) => {
    setMaterials(materials.filter(material => material.id !== materialId));
  };

  const getTotalMaterialsCost = () => {
    return materials.reduce((sum, material) => sum + material.total, 0);
  };

  // Extra Work handling functions
  const handleAddExtraWork = (e) => {
    e.preventDefault();
    if (newExtraWork.description && newExtraWork.cost) {
      const cost = parseFloat(newExtraWork.cost);
      
      setExtraWorkItems([...extraWorkItems, {
        id: Date.now(),
        description: newExtraWork.description,
        cost: cost,
        status: newExtraWork.status,
        dateAdded: new Date().toISOString(),
        approved: false
      }]);
      
      setNewExtraWork({
        description: '',
        cost: '',
        status: 'pending',
        dateAdded: new Date().toISOString()
      });
      setShowAddExtraWork(false);
    }
  };

  const handleDeleteExtraWork = (itemId) => {
    setExtraWorkItems(extraWorkItems.filter(item => item.id !== itemId));
  };

  const handleApproveExtraWork = (itemId) => {
    setExtraWorkItems(extraWorkItems.map(item =>
      item.id === itemId ? { ...item, approved: !item.approved, status: item.approved ? 'pending' : 'approved' } : item
    ));
  };

  const getTotalExtraWorkCost = () => {
    return extraWorkItems.reduce((sum, item) => sum + item.cost, 0);
  };

  const getApprovedExtraWorkCost = () => {
    return extraWorkItems.filter(item => item.approved).reduce((sum, item) => sum + item.cost, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#10B981';
      case 'In Progress': return '#3B82F6';
      case 'Quote': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (!job) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <p>Loading job details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/customers/${job.customerId}`)}
          style={{
            marginBottom: '15px',
            padding: '8px 16px',
            backgroundColor: '#E5E7EB',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16.1px'
          }}
        >
          ← Back to {job.customerName}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '27.6px', fontWeight: 'bold' }}>
              {job.title}
            </h1>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: `${getStatusColor(job.status)}20`,
              color: getStatusColor(job.status),
              borderRadius: '12px',
              fontSize: '16.1px',
              fontWeight: '500'
            }}>
              {job.status}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '27.6px', fontWeight: 'bold' }}>
              ${job.totalCost.toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: '16.1px', color: '#6B7280' }}>
              Started: {new Date(job.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #E5E7EB',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16.1px',
                fontWeight: '500',
                color: tab.id === 'tasks' ? '#EF4444' : (activeTab === tab.id ? '#3B82F6' : '#6B7280'),
                borderBottom: activeTab === tab.id ? (tab.id === 'tasks' ? '2px solid #EF4444' : '2px solid #3B82F6') : '2px solid transparent',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {/* Job Description Tab */}
        {activeTab === 'description' && (
          <div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20.7px', fontWeight: '600' }}>Scope of Work</h2>
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              fontSize: '16.1px',
              lineHeight: '1.6',
              color: '#374151'
            }}>
              {job.description}
            </pre>
          </div>
        )}

        {/* Pictures Tab */}
        {activeTab === 'pictures' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20.7px', fontWeight: '600' }}>Project Photos</h2>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px'
                }}
              >
                + Add Photo
              </button>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {job.pictures.map(pic => (
                <div key={pic.id} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '100%',
                    height: '150px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280',
                    fontSize: '13.8px'
                  }}>
                    [Photo]
                  </div>
                  <p style={{ margin: 0, fontSize: '13.8px', color: '#6B7280' }}>{pic.caption}</p>
                </div>
              ))}
            </div>
            {job.pictures.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6B7280' }}>
                No photos yet. Click "Add Photo" to upload.
              </p>
            )}
          </div>
        )}

        {/* Plans/Drawings Tab */}
        {activeTab === 'plans' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20.7px', fontWeight: '600' }}>Plans & Drawings</h2>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px'
                }}
              >
                + Add Document
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {job.plans.map(plan => (
                <div 
                  key={plan.id}
                  style={{
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '23px' }}>
                    {plan.type === 'pdf' ? '📄' : '🖼️'}
                  </span>
                  <span style={{ fontSize: '16.1px' }}>{plan.name}</span>
                </div>
              ))}
            </div>
            {job.plans.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6B7280' }}>
                No plans uploaded yet.
              </p>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div style={{ position: 'relative', minHeight: '400px' }}>
            <div style={{background: 'red', color: 'white', fontSize: '40px', padding: '20px', textAlign: 'center'}}>
              !!! TESTING RAILWAY DEPLOYMENT - VERSION 4 !!!
            </div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20.7px', fontWeight: '600' }}>Task List (RED TAB v3)</h2>
            
            {/* Bulk Actions Toolbar */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              marginBottom: '16px',
              transform: selectedTasks.size > 0 ? 'translateY(0)' : 'translateY(-100%)',
              opacity: selectedTasks.size > 0 ? 1 : 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: selectedTasks.size > 0 ? 'auto' : 'none'
            }}>
              <div style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '16.1px', fontWeight: '500' }}>
                    {selectedTasks.size} selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14.95px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                  >
                    {selectedTasks.size === tasks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleBulkComplete}
                    style={{
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14.95px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                  >
                    Complete
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    style={{
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14.95px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              marginBottom: '80px' // Space for fixed input
            }}>
              {tasks.map((task, index) => (
                <div 
                  key={task.id}
                  data-task-index={index}
                  draggable={!isLongPress}
                  onDragStart={(e) => handleDragStart(e, task, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onTouchStart={(e) => handleTouchStart(e, task, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: selectedTasks.has(task.id) ? '#EBF5FF' : (task.completed ? '#F3F4F6' : 'white'),
                    border: `2px solid ${dragOverIndex === index ? '#3B82F6' : (selectedTasks.has(task.id) ? '#3B82F6' : '#E5E7EB')}`,
                    borderRadius: '8px',
                    cursor: 'move',
                    transition: 'all 0.2s ease',
                    transform: draggedTask?.task.id === task.id && isLongPress ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: draggedTask?.task.id === task.id && isLongPress ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                    opacity: draggedTask?.task.id === task.id && !isLongPress ? 0.5 : 1,
                    animation: task.id === tasks[tasks.length - 1]?.id && tasks.length > 0 ? 'slideIn 0.3s ease-out' : 'none'
                  }}
                >
                  {/* Drag Handle */}
                  <div style={{
                    color: '#9CA3AF',
                    cursor: 'grab',
                    fontSize: '20px',
                    opacity: 0.5,
                    transition: 'opacity 0.2s',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                  >
                    ≡
                  </div>

                  {/* Enhanced Checkbox */}
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '44px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id) || task.completed}
                      onChange={(e) => handleTaskToggle(task.id, e)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '44px',
                        height: '44px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      height: '24px',
                      width: '24px',
                      backgroundColor: (selectedTasks.has(task.id) || task.completed) ? '#3B82F6' : 'white',
                      border: `2px solid ${(selectedTasks.has(task.id) || task.completed) ? '#3B82F6' : '#D1D5DB'}`,
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#3B82F6'
                      }
                    }}>
                      {(selectedTasks.has(task.id) || task.completed) && (
                        <svg 
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: '2px',
                            width: '16px',
                            height: '16px',
                            animation: 'checkmark 0.2s ease-out'
                          }}
                          fill="none" 
                          stroke="white" 
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  </label>

                  {/* Task Text */}
                  <span style={{
                    flex: '1 1 auto',
                    fontSize: '16.1px',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? '#9CA3AF' : '#374151',
                    minWidth: '150px',
                    userSelect: 'none'
                  }}>
                    {task.text}
                  </span>

                  {/* Assignee */}
                  <select
                    value={task.assignedTo || ''}
                    onChange={(e) => handleAssignTask(task.id, e.target.value || null)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      fontSize: '13.8px',
                      backgroundColor: task.assignedTo ? '#E0E7FF' : 'white',
                      color: task.assignedTo ? '#3730A3' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {workers.map(worker => (
                      <option key={worker} value={worker}>{worker}</option>
                    ))}
                  </select>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '20px',
                      opacity: 0.6,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FEE2E2';
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.opacity = '0.6';
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {tasks.length === 0 && (
              <p style={{ 
                textAlign: 'center', 
                color: '#6B7280',
                padding: '40px 20px',
                fontSize: '16.1px'
              }}>
                No tasks yet. Type below and press Enter to add tasks.
              </p>
            )}

            {/* Fixed Input at Bottom */}
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTop: '1px solid #E5E7EB',
              padding: '16px',
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 20
            }}>
              <form onSubmit={handleAddTask} style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    ref={taskInputRef}
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a task..."
                    style={{
                      flex: '1',
                      padding: '12px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16.1px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                  />
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16.1px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                  >
                    <option value="">Unassigned</option>
                    {workers.map(worker => (
                      <option key={worker} value={worker}>{worker}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20.7px', fontWeight: '600' }}>
                Materials List
              </h2>
              <button
                onClick={() => setShowAddMaterial(!showAddMaterial)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px'
                }}
              >
                + Add Material
              </button>
            </div>

            {/* Add Material Form */}
            {showAddMaterial && (
              <form onSubmit={handleAddMaterial} style={{
                backgroundColor: '#F9FAFB',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13.8px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                      Material Name
                    </label>
                    <input
                      type="text"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="e.g., 2x4 Lumber"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        fontSize: '16.1px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13.8px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        fontSize: '16.1px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13.8px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                      Unit
                    </label>
                    <select
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        fontSize: '16.1px'
                      }}
                    >
                      <option value="pieces">pieces</option>
                      <option value="sheets">sheets</option>
                      <option value="linear ft">linear ft</option>
                      <option value="sq ft">sq ft</option>
                      <option value="gallons">gallons</option>
                      <option value="bags">bags</option>
                      <option value="boxes">boxes</option>
                      <option value="rolls">rolls</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13.8px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                      Store
                    </label>
                    <select
                      value={newMaterial.store}
                      onChange={(e) => setNewMaterial({ ...newMaterial, store: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        fontSize: '16.1px'
                      }}
                    >
                      <option value="Home Depot">Home Depot</option>
                      <option value="Lowes">Lowes</option>
                      <option value="Menards">Menards</option>
                      <option value="Local Hardware">Local Hardware</option>
                      <option value="Online">Online</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13.8px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                      Price per Unit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMaterial.price}
                      onChange={(e) => setNewMaterial({ ...newMaterial, price: e.target.value })}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        fontSize: '16.1px'
                      }}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16.1px'
                    }}
                  >
                    Add Material
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMaterial(false);
                      setNewMaterial({
                        name: '',
                        quantity: '',
                        unit: 'pieces',
                        store: 'Home Depot',
                        price: ''
                      });
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#E5E7EB',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16.1px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Materials Table */}
            {materials.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#374151' }}>
                        Material
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', color: '#374151' }}>
                        Quantity
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', color: '#374151' }}>
                        Unit
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', color: '#374151' }}>
                        Store
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13.8px', fontWeight: '600', color: '#374151' }}>
                        Price/Unit
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13.8px', fontWeight: '600', color: '#374151' }}>
                        Total
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', color: '#374151' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => (
                      <tr key={material.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px', fontSize: '16.1px', color: '#111827' }}>
                          {material.name}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '16.1px', color: '#374151' }}>
                          {material.quantity}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '16.1px', color: '#374151' }}>
                          {material.unit}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '16.1px' }}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: material.store === 'Home Depot' ? '#FEF3C7' : material.store === 'Lowes' ? '#DBEAFE' : '#E5E7EB',
                            color: material.store === 'Home Depot' ? '#92400E' : material.store === 'Lowes' ? '#1E3A8A' : '#374151',
                            borderRadius: '4px',
                            fontSize: '13.8px',
                            fontWeight: '500'
                          }}>
                            {material.store}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '16.1px', color: '#374151' }}>
                          ${material.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '16.1px', fontWeight: '600', color: '#111827' }}>
                          ${material.total.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13.8px'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '18.4px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        Total Materials Cost:
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '18.4px',
                        fontWeight: '700',
                        color: '#059669'
                      }}>
                        ${getTotalMaterialsCost().toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                color: '#6B7280'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '18.4px' }}>No materials added yet</p>
                <p style={{ margin: 0, fontSize: '16.1px' }}>Click "Add Material" to start tracking materials for this job</p>
              </div>
            )}

            {/* Store Summary */}
            {materials.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '18.4px', fontWeight: '600', marginBottom: '12px' }}>Store Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {Object.entries(materials.reduce((acc, material) => {
                    if (!acc[material.store]) {
                      acc[material.store] = { count: 0, total: 0 };
                    }
                    acc[material.store].count += 1;
                    acc[material.store].total += material.total;
                    return acc;
                  }, {})).map(([store, data]) => (
                    <div key={store} style={{
                      padding: '12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ fontSize: '16.1px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {store}
                      </div>
                      <div style={{ fontSize: '13.8px', color: '#6B7280' }}>
                        {data.count} item{data.count !== 1 ? 's' : ''} • ${data.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Special Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20.7px', fontWeight: '600' }}>Special Notes</h2>
              <button
                onClick={() => {
                  if (editingNotes) {
                    // Save notes logic here
                  }
                  setEditingNotes(!editingNotes);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: editingNotes ? '#10B981' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px'
                }}
              >
                {editingNotes ? 'Save' : 'Edit'}
              </button>
            </div>
            {editingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '16.1px',
                  resize: 'vertical'
                }}
              />
            ) : (
              <p style={{ 
                margin: 0,
                fontSize: '16.1px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {notes || 'No special notes for this job.'}
              </p>
            )}
          </div>
        )}

        {/* Extra Work Tab */}
        {activeTab === 'extraWork' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20.7px', fontWeight: '600' }}>
                Extra Work Items
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '18.4px', 
                  color: '#6B7280' 
                }}>
                  Total: ${getTotalExtraWorkCost().toLocaleString()} 
                  {getApprovedExtraWorkCost() > 0 && ` (Approved: $${getApprovedExtraWorkCost().toLocaleString()})`}
                </span>
              </h2>
              <button
                onClick={() => setShowAddExtraWork(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px'
                }}
              >
                + Add Extra Work
              </button>
            </div>

            {/* Add Extra Work Form */}
            {showAddExtraWork && (
              <form onSubmit={handleAddExtraWork} style={{
                backgroundColor: '#F9FAFB',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '16.1px', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    value={newExtraWork.description}
                    onChange={(e) => setNewExtraWork({ ...newExtraWork, description: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '8px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '16.1px',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the extra work needed..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '16.1px', fontWeight: '500' }}>
                      Cost
                    </label>
                    <input
                      type="number"
                      value={newExtraWork.cost}
                      onChange={(e) => setNewExtraWork({ ...newExtraWork, cost: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '16.1px'
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '16.1px', fontWeight: '500' }}>
                      Status
                    </label>
                    <select
                      value={newExtraWork.status}
                      onChange={(e) => setNewExtraWork({ ...newExtraWork, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '16.1px'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16.1px'
                    }}
                  >
                    Add Extra Work
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddExtraWork(false);
                      setNewExtraWork({
                        description: '',
                        cost: '',
                        status: 'pending',
                        dateAdded: new Date().toISOString()
                      });
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#E5E7EB',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16.1px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Extra Work Items List */}
            {extraWorkItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '16.1px', marginTop: '40px' }}>
                No extra work items yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {extraWorkItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: item.approved ? '#F0FDF4' : 'white',
                      border: item.approved ? '1px solid #86EFAC' : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          fontSize: '16.1px', 
                          fontWeight: '500',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {item.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14.95px', color: '#6B7280' }}>
                          <span>Added: {new Date(item.dateAdded).toLocaleDateString()}</span>
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: item.status === 'approved' ? '#D1FAE5' : 
                                           item.status === 'completed' ? '#DBEAFE' :
                                           item.status === 'rejected' ? '#FEE2E2' : '#F3F4F6',
                            color: item.status === 'approved' ? '#065F46' : 
                                   item.status === 'completed' ? '#1E40AF' :
                                   item.status === 'rejected' ? '#991B1B' : '#374151',
                            borderRadius: '12px',
                            fontSize: '13.8px'
                          }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '20.7px', 
                          fontWeight: '600',
                          color: item.approved ? '#059669' : '#111827'
                        }}>
                          ${item.cost.toLocaleString()}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApproveExtraWork(item.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: item.approved ? '#FEE2E2' : '#D1FAE5',
                              color: item.approved ? '#991B1B' : '#065F46',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14.95px'
                            }}
                          >
                            {item.approved ? 'Unapprove' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDeleteExtraWork(item.id)}
                            style={{
                              padding: '6px',
                              backgroundColor: '#FEE2E2',
                              color: '#991B1B',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailTabbed;