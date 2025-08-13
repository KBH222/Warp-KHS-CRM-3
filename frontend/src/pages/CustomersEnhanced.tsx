import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerStorage } from '../utils/localStorage';

const CustomersEnhanced = () => {
  const navigate = useNavigate();
  
  // Load customers from localStorage
  const [customers, setCustomers] = useState(() => {
    const savedCustomers = customerStorage.getAll();
    return savedCustomers || [];
  });

  // Save customers to localStorage whenever they change
  useEffect(() => {
    customerStorage.save(customers);
  }, [customers]);

  // Auto-sync every 15 minutes and handle cross-tab synchronization
  useEffect(() => {
    // Function to sync data
    const syncData = () => {
      setIsSyncing(true);
      const savedCustomers = customerStorage.getAll();
      const savedJobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
      
      // Update state with latest data from localStorage
      if (savedCustomers) {
        setCustomers(savedCustomers);
      }
      
      const now = new Date();
      setLastSyncTime(now);
      setIsSyncing(false);
      console.log(`Auto-sync completed at ${now.toLocaleTimeString()}`);
    };

    // Auto-sync every 15 minutes
    const autoSync = () => {
      setIsSyncing(true);
      
      // Save current data with timestamp
      customerStorage.save(customers);
      localStorage.setItem('khs-crm-last-sync', new Date().toISOString());
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      syncData();
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'khs-crm-customers' || e.key === 'khs-crm-jobs' || e.key === 'khs-crm-last-sync') {
        console.log(`Storage change detected from another tab at ${new Date().toLocaleTimeString()}`);
        syncData();
      }
    };

    // Set up 15-minute interval (900000 ms)
    const syncInterval = setInterval(autoSync, 900000);
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Sync immediately on mount
    syncData();

    // Cleanup
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, reference, recent
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedCustomerForJob, setSelectedCustomerForJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sort customers
  const sortedCustomers = [...customers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'reference':
        // Define reference order: HOD first, then Yelp, then Cust
        const refOrder: Record<string, number> = { 'HOD': 1, 'Yelp': 2, 'Cust': 3 };
        const aOrder = refOrder[a.reference] || 4; // No reference goes last
        const bOrder = refOrder[b.reference] || 4;
        return aOrder - bOrder;
      case 'recent':
        return b.id.localeCompare(a.id); // Newer IDs are larger
      default:
        return 0;
    }
  });

  // Filter customers
  const filteredCustomers = sortedCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.notes && customer.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get jobs for each customer
  const getCustomerJobs = (customerId: string) => {
    const jobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
    return jobs.filter((job: any) => job.customerId === customerId);
  };

  const handleAddCustomer = (newCustomer: any) => {
    const customer = {
      id: Date.now().toString(),
      ...newCustomer,
      totalJobs: 0,
      totalSpent: 0
    };
    setCustomers([customer, ...customers]);
  };

  const handleEditCustomer = (updatedCustomer: any) => {
    setCustomers(customers.map(c => 
      c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
    ));
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handlePhoneClick = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const handleAddressClick = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleEmailClick = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  const handleAddJob = (customer: any) => {
    setSelectedCustomerForJob(customer);
    setShowAddJobModal(true);
  };

  const handleSaveJob = (jobData: any) => {
    const jobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
    
    if (jobData.id) {
      // Update existing job
      const updatedJobs = jobs.map((job: any) => 
        job.id === jobData.id ? { ...job, ...jobData } : job
      );
      localStorage.setItem('khs-crm-jobs', JSON.stringify(updatedJobs));
    } else {
      // Create new job
      const newJob = {
        id: Date.now().toString(),
        customerId: selectedCustomerForJob.id,
        customer: selectedCustomerForJob.name,
        address: selectedCustomerForJob.address,
        assignedTo: [],
        status: 'QUOTED',
        totalCost: 0,
        ...jobData
      };
      jobs.push(newJob);
      localStorage.setItem('khs-crm-jobs', JSON.stringify(jobs));
    }
    
    setShowAddJobModal(false);
    setSelectedCustomerForJob(null);
    setEditingJob(null);
  };

  const handleDeleteJob = (jobId: string) => {
    const jobs = JSON.parse(localStorage.getItem('khs-crm-jobs') || '[]');
    const updatedJobs = jobs.filter((job: any) => job.id !== jobId);
    localStorage.setItem('khs-crm-jobs', JSON.stringify(updatedJobs));
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ 
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '100px'
      }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Customers</h1>
            {lastSyncTime && (
              <p style={{ 
                fontSize: '12px', 
                color: '#6B7280', 
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {isSyncing && (
                  <span style={{ 
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid #3B82F6',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {isSyncing ? 'Syncing...' : `Last sync: ${lastSyncTime.toLocaleTimeString()}`}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                // Manual sync
                const autoSync = () => {
                  setIsSyncing(true);
                  
                  // Save current data with timestamp
                  customerStorage.save(customers);
                  localStorage.setItem('khs-crm-last-sync', new Date().toISOString());
                  
                  // Trigger storage event for other tabs
                  window.dispatchEvent(new Event('storage'));
                  
                  // Reload data
                  setTimeout(() => {
                    const savedCustomers = customerStorage.getAll();
                    if (savedCustomers) {
                      setCustomers(savedCustomers);
                    }
                    setLastSyncTime(new Date());
                    setIsSyncing(false);
                  }, 500);
                };
                autoSync();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              disabled={isSyncing}
            >
              🔄 Sync Now
            </button>
            <button
              onClick={() => {
                setEditingCustomer(null);
                setShowModal(true);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Sort Buttons */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSortBy('name')}
            style={{
              padding: '6px 12px',
              backgroundColor: sortBy === 'name' ? '#3B82F6' : '#E5E7EB',
              color: sortBy === 'name' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Name
          </button>
          <button
            onClick={() => setSortBy('reference')}
            style={{
              padding: '6px 12px',
              backgroundColor: sortBy === 'reference' ? '#3B82F6' : '#E5E7EB',
              color: sortBy === 'reference' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reference
          </button>
          <button
            onClick={() => setSortBy('recent')}
            style={{
              padding: '6px 12px',
              backgroundColor: sortBy === 'recent' ? '#3B82F6' : '#E5E7EB',
              color: sortBy === 'recent' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recent
          </button>
        </div>

        {/* Customer Cards */}
        {filteredCustomers.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            {searchTerm ? 'No customers found matching your search.' : 'No customers yet. Add your first customer to get started.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  border: '1px solid #E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{customer.name}</h3>
                      {customer.reference && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: customer.reference === 'HOD' ? '#10B981' : 
                                         customer.reference === 'Yelp' ? '#F59E0B' : '#3B82F6',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          {customer.reference}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleEmailClick(customer.email, e)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        padding: '4px 0',
                        font: 'inherit',
                        fontSize: '12px',
                        display: 'block',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#3B82F6';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#666';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {customer.email}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <button
                        onClick={(e) => handlePhoneClick(customer.phone, e)}
                        title="Call customer"
                        style={{ 
                          background: 'none',
                          border: '1px solid #3B82F6',
                          color: '#3B82F6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        📞 Call
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `sms:${customer.phone.replace(/\D/g, '')}`;
                        }}
                        title="Text customer"
                        style={{ 
                          background: 'none',
                          border: '1px solid #3B82F6',
                          color: '#3B82F6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        💬 Text
                      </button>
                      <span style={{ fontSize: '12px', color: '#666' }}>{customer.phone}</span>
                    </div>
                    <button
                      onClick={(e) => handleAddressClick(customer.address, e)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        padding: '4px 0',
                        font: 'inherit',
                        fontSize: '11px',
                        display: 'block',
                        lineHeight: '1.3',
                        textAlign: 'left',
                        marginBottom: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#3B82F6';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6B7280';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {customer.address}
                    </button>
                    {customer.notes && (
                      <p style={{ 
                        fontSize: '11px', 
                        color: '#9CA3AF',
                        fontStyle: 'italic',
                        margin: '0',
                        lineHeight: '1.3',
                        paddingTop: '4px'
                      }}>
                        {customer.notes}
                      </p>
                    )}
                    
                    {/* Jobs List */}
                    {(() => {
                      const customerJobs = getCustomerJobs(customer.id);
                      if (customerJobs.length > 0) {
                        return (
                          <div style={{ 
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid #E5E7EB'
                          }}>
                            <p style={{ 
                              fontSize: '12px', 
                              fontWeight: '600',
                              color: '#374151',
                              marginBottom: '8px'
                            }}>
                              Jobs ({customerJobs.length}):
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {customerJobs.map((job: any) => (
                                <button
                                  key={job.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomerForJob(customer);
                                    setEditingJob(job);
                                    setShowAddJobModal(true);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '4px',
                                    padding: '6px 8px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    color: '#374151',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                                    e.currentTarget.style.borderColor = '#3B82F6';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                  }}
                                >
                                  <div style={{ fontWeight: '500' }}>{job.title}</div>
                                  {job.startDate && (
                                    <div style={{ color: '#6B7280', fontSize: '10px' }}>
                                      {new Date(job.startDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustomer(customer);
                        setShowModal(true);
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        backgroundColor: '#E5E7EB',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer.id);
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddJob(customer);
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>+</span> Add Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
          onSave={editingCustomer ? handleEditCustomer : handleAddCustomer}
        />
      )}

      {/* Add Job Modal */}
      {showAddJobModal && selectedCustomerForJob && (
        <AddJobModal
          customer={selectedCustomerForJob}
          existingJob={editingJob}
          onClose={() => {
            setShowAddJobModal(false);
            setSelectedCustomerForJob(null);
            setEditingJob(null);
          }}
          onSave={handleSaveJob}
          onDelete={handleDeleteJob}
        />
      )}
    </div>
    </>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    reference: customer?.reference || '',
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    street: '',
    city: '',
    state: '',
    zip: '',
    notes: customer?.notes || ''
  });

  // Parse address if editing
  useEffect(() => {
    if (customer?.address) {
      // Simple address parsing - in a real app, you'd use a proper address parser
      const parts = customer.address.split(', ');
      if (parts.length >= 3) {
        const [street, city, stateZip] = parts;
        const stateZipParts = stateZip.split(' ');
        setFormData(prev => ({
          ...prev,
          street,
          city,
          state: stateZipParts[0] || '',
          zip: stateZipParts[1] || ''
        }));
      }
    }
  }, [customer]);

  // Mock address database for auto-completion
  const addressDatabase: Record<string, { city: string; state: string; zip: string }> = {
    '123 main st': { city: 'Springfield', state: 'IL', zip: '62701' },
    '456 oak ave': { city: 'Springfield', state: 'IL', zip: '62702' },
    '789 elm street': { city: 'Springfield', state: 'IL', zip: '62703' },
    '321 maple drive': { city: 'Springfield', state: 'IL', zip: '62704' },
    '654 pine road': { city: 'Chicago', state: 'IL', zip: '60601' },
    '987 cedar lane': { city: 'Chicago', state: 'IL', zip: '60602' },
    '111 walnut way': { city: 'Bloomington', state: 'IL', zip: '61701' },
    '222 birch boulevard': { city: 'Champaign', state: 'IL', zip: '61820' },
    '350 ward ave': { city: 'Honolulu', state: 'HI', zip: '96814' },
    '1717 ala wai blvd': { city: 'Honolulu', state: 'HI', zip: '96815' },
  };

  // Zip code database for auto-population
  const zipCodeDatabase: Record<string, { city: string; state: string }> = {
    '62701': { city: 'Springfield', state: 'IL' },
    '62702': { city: 'Springfield', state: 'IL' },
    '62703': { city: 'Springfield', state: 'IL' },
    '62704': { city: 'Springfield', state: 'IL' },
    '60601': { city: 'Chicago', state: 'IL' },
    '60602': { city: 'Chicago', state: 'IL' },
    '61701': { city: 'Bloomington', state: 'IL' },
    '61820': { city: 'Champaign', state: 'IL' },
    '96814': { city: 'Honolulu', state: 'HI' },
    '96815': { city: 'Honolulu', state: 'HI' },
    '10001': { city: 'New York', state: 'NY' },
    '90210': { city: 'Beverly Hills', state: 'CA' },
    '94105': { city: 'San Francisco', state: 'CA' },
    '98101': { city: 'Seattle', state: 'WA' },
    '33139': { city: 'Miami Beach', state: 'FL' },
    '02134': { city: 'Boston', state: 'MA' },
    '78701': { city: 'Austin', state: 'TX' },
    '85001': { city: 'Phoenix', state: 'AZ' },
    '80202': { city: 'Denver', state: 'CO' },
    '30303': { city: 'Atlanta', state: 'GA' }
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.length <= 14) {
      setFormData({ ...formData, phone: formatted });
    }
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, street: value });
    
    const normalizedStreet = value.toLowerCase().trim();
    const addressInfo = addressDatabase[normalizedStreet];
    
    if (addressInfo) {
      setFormData(prev => ({
        ...prev,
        street: value,
        city: addressInfo.city,
        state: addressInfo.state,
        zip: addressInfo.zip
      }));
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, zip: value });
    
    if (value.length === 5) {
      const zipInfo = zipCodeDatabase[value];
      if (zipInfo) {
        setFormData(prev => ({
          ...prev,
          zip: value,
          city: zipInfo.city,
          state: zipInfo.state
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const address = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}`;
    onSave({
      id: customer?.id,
      reference: formData.reference,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address,
      notes: formData.notes
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Reference
            </label>
            <select
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select reference...</option>
              <option value="HOD">HOD</option>
              <option value="Yelp">Yelp</option>
              <option value="Cust">Customer Referral</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              required
              placeholder="(555) 123-4567"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Street Address *
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={handleStreetChange}
              required
              placeholder="123 Main St"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                State *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                maxLength={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '16px',
                  textTransform: 'uppercase'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                ZIP *
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={handleZipChange}
                required
                maxLength={5}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '16px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#E5E7EB',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Job Modal Component
const AddJobModal = ({ customer, onClose, onSave, existingJob = null, onDelete = null }: any) => {
  const [activeTab, setActiveTab] = useState('description');
  const [jobData, setJobData] = useState({
    title: existingJob?.title || '',
    description: existingJob?.description || '',
    photos: existingJob?.photos || [],
    plans: existingJob?.plans || [],
    notes: existingJob?.notes || '',
    comments: existingJob?.comments || []
  });

  const tabs = [
    { id: 'description', label: 'Job Description', icon: '📋' },
    { id: 'photos', label: 'Photos', icon: '📸' },
    { id: 'plans', label: 'Drawings/Plans', icon: '📐' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'comments', label: 'Comments', icon: '💬' }
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJobData(prev => ({
          ...prev,
          photos: [...prev.photos, {
            id: Date.now() + Math.random(),
            url: event.target?.result as string,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJobData(prev => ({
          ...prev,
          plans: [...prev.plans, {
            id: Date.now() + Math.random(),
            url: event.target?.result as string,
            name: file.name,
            type: file.type
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddComment = (text: string) => {
    if (text.trim()) {
      setJobData(prev => ({
        ...prev,
        comments: [...prev.comments, {
          id: Date.now(),
          text,
          timestamp: new Date().toISOString(),
          author: 'Current User'
        }]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingJob) {
      onSave({ ...existingJob, ...jobData });
    } else {
      onSave(jobData);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '900px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                {existingJob ? 'Edit Job' : 'Add Job'} for {customer.name}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '14px' }}>
                {customer.address}
              </p>
            </div>
            {existingJob && onDelete && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this job?')) {
                      onDelete(existingJob.id);
                      onClose();
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Delete Job
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          overflowX: 'auto'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {/* Job Description Tab */}
            {activeTab === 'description' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Job Title *
                  </label>
                  <select
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '16px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select job type...</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Flooring">Flooring</option>
                    <option value="Various Repairs">Various Repairs</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    rows={6}
                    placeholder="Describe the work to be done..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    + Upload Photos
                  </label>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {jobData.photos.map(photo => (
                    <div key={photo.id} style={{
                      position: 'relative',
                      paddingBottom: '100%',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={photo.url}
                        alt={photo.name}
                        onDoubleClick={() => window.open(photo.url, '_blank')}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        title="Double-click to open"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setJobData(prev => ({
                            ...prev,
                            photos: prev.photos.filter(p => p.id !== photo.id)
                          }));
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    multiple
                    onChange={handlePlanUpload}
                    style={{ display: 'none' }}
                    id="plan-upload"
                  />
                  <label
                    htmlFor="plan-upload"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    + Upload Documents
                  </label>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {jobData.plans.map(plan => (
                    <div 
                      key={plan.id} 
                      onDoubleClick={() => window.open(plan.url, '_blank')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                        cursor: 'pointer'
                      }}
                      title="Double-click to open"
                    >
                      <span style={{ fontSize: '24px', marginRight: '12px' }}>
                        {plan.type.includes('pdf') ? '📄' : '🖼️'}
                      </span>
                      <span style={{ flex: 1, fontSize: '14px' }}>{plan.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobData(prev => ({
                            ...prev,
                            plans: prev.plans.filter(p => p.id !== plan.id)
                          }));
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#DC2626',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Job Notes
                </label>
                <textarea
                  value={jobData.notes}
                  onChange={(e) => setJobData({ ...jobData, notes: e.target.value })}
                  rows={10}
                  placeholder="Add any notes about this job..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      id="new-comment"
                      placeholder="Add a comment..."
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleAddComment(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('new-comment') as HTMLInputElement;
                        handleAddComment(input.value);
                        input.value = '';
                      }}
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
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {jobData.comments.map(comment => (
                    <div key={comment.id} style={{
                      padding: '12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>{comment.author}</span>
                        <span style={{ color: '#6B7280', fontSize: '12px' }}>
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px' }}>{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            padding: '20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: '12px'
          }}>
            <button
              type="submit"
              disabled={!jobData.title}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: jobData.title ? '#3B82F6' : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: jobData.title ? 'pointer' : 'not-allowed'
              }}
            >
              {existingJob ? 'Update Job' : 'Create Job'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#E5E7EB',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomersEnhanced;