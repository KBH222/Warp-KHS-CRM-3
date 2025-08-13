import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const JobDetailTabbed = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('description');

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

  const handleTaskToggle = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        completed: false,
        assignedTo: newTaskAssignee || null
      }]);
      setNewTask('');
      setNewTaskAssignee('');
    }
  };

  const handleAssignTask = (taskId, worker) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, assignedTo: worker } : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
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
            fontSize: '14px'
          }}
        >
          ← Back to {job.customerName}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
              {job.title}
            </h1>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: `${getStatusColor(job.status)}20`,
              color: getStatusColor(job.status),
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {job.status}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
              ${job.totalCost.toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
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
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
                borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
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
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Scope of Work</h2>
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              fontSize: '14px',
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Project Photos</h2>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
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
                    fontSize: '12px'
                  }}>
                    [Photo]
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>{pic.caption}</p>
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Plans & Drawings</h2>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
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
                  <span style={{ fontSize: '20px' }}>
                    {plan.type === 'pdf' ? '📄' : '🖼️'}
                  </span>
                  <span style={{ fontSize: '14px' }}>{plan.name}</span>
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
          <div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Task List</h2>
            
            {/* Add Task Form */}
            <form onSubmit={handleAddTask} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  style={{
                    flex: '1 1 200px',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Unassigned</option>
                  {workers.map(worker => (
                    <option key={worker} value={worker}>{worker}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Add
                </button>
              </div>
            </form>

            {/* Task List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.map(task => (
                <div 
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: task.completed ? '#F3F4F6' : 'transparent',
                    borderRadius: '6px',
                    flexWrap: 'wrap'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleTaskToggle(task.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{
                    flex: '1 1 auto',
                    fontSize: '14px',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? '#9CA3AF' : '#374151',
                    minWidth: '150px'
                  }}>
                    {task.text}
                  </span>
                  <select
                    value={task.assignedTo || ''}
                    onChange={(e) => handleAssignTask(task.id, e.target.value || null)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: task.assignedTo ? '#E0E7FF' : 'white',
                      color: task.assignedTo ? '#3730A3' : '#6B7280',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {workers.map(worker => (
                      <option key={worker} value={worker}>{worker}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            {tasks.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6B7280' }}>
                No tasks yet. Add one above.
              </p>
            )}
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
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
                  fontSize: '14px'
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
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
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
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
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
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
                        fontSize: '14px'
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
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
                        fontSize: '14px'
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
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
                        fontSize: '14px'
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
                      fontSize: '14px'
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
                      fontSize: '14px'
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
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        Material
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        Quantity
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        Unit
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        Store
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        Price/Unit
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        Total
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => (
                      <tr key={material.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                          {material.name}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#374151' }}>
                          {material.quantity}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#374151' }}>
                          {material.unit}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: material.store === 'Home Depot' ? '#FEF3C7' : material.store === 'Lowes' ? '#DBEAFE' : '#E5E7EB',
                            color: material.store === 'Home Depot' ? '#92400E' : material.store === 'Lowes' ? '#1E3A8A' : '#374151',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {material.store}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#374151' }}>
                          ${material.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
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
                              fontSize: '12px'
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
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        Total Materials Cost:
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '16px',
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
                <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No materials added yet</p>
                <p style={{ margin: 0, fontSize: '14px' }}>Click "Add Material" to start tracking materials for this job</p>
              </div>
            )}

            {/* Store Summary */}
            {materials.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Store Summary</h3>
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
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {store}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Special Notes</h2>
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
                  fontSize: '14px'
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
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            ) : (
              <p style={{ 
                margin: 0,
                fontSize: '14px',
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Extra Work Items
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '16px', 
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
                  fontSize: '14px'
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
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
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
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the extra work needed..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
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
                        fontSize: '14px'
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
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
                        fontSize: '14px'
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
                      fontSize: '14px'
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
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Extra Work Items List */}
            {extraWorkItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '14px', marginTop: '40px' }}>
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
                          fontSize: '14px', 
                          fontWeight: '500',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {item.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6B7280' }}>
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
                            fontSize: '12px'
                          }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '18px', 
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
                              fontSize: '13px'
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