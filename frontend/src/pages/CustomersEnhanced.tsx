import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi, jobsApi, authApi } from '../services/api';
import { toast } from 'react-toastify';
import { customerStorage } from '../services/localStorageService';
import { ScrollablePageContainer } from '../components/ScrollablePageContainer';
import { compressImage } from '../utils/imageCompression';

const CustomersEnhanced = () => {
  console.log('[CustomersEnhanced] Component rendering...');
  const navigate = useNavigate();
  
  // Add CSS to hide scrollbars on tabs container
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .tabs-container::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // State
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  console.log('[CustomersEnhanced] State initialized');

  // Load customers from API
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customersApi.getAll();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      // Will fall back to localStorage in the API
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login and load data on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Always try to auto-login to ensure fresh token
        await authApi.autoLogin();
        await loadCustomers();
      } catch (error) {
        console.error('[CustomersPage] Init error:', error);
        // Still try to load customers - might work with cached data
        await loadCustomers();
      }
    };
    init();
  }, []);

  // Auto-sync every 15 minutes and handle cross-tab synchronization
  useEffect(() => {
    // Function to sync data
    const syncData = () => {
      const savedCustomers = customerStorage.load();
      
      // Update state with latest data from localStorage
      if (savedCustomers) {
        setCustomers(savedCustomers);
      }
      
      // Auto-sync completed
    };

    // Auto-sync every 15 minutes
    const autoSync = async () => {
      console.log('[CustomersPage] Running auto-sync...');
      
      // Save current data with timestamp
      customerStorage.save(customers);
      localStorage.setItem('khs-crm-last-sync', new Date().toISOString());
      
      // Trigger actual sync with backend
      try {
        await customersApi.sync();
        console.log('[CustomersPage] Sync completed');
        // Reload data after sync
        await loadCustomers();
      } catch (error) {
        console.error('[CustomersPage] Sync failed:', error);
      }
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      syncData();
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'khs-crm-customers' || e.key === 'khs-crm-jobs' || e.key === 'khs-crm-last-sync') {
        // Storage change detected from another tab
        syncData();
      }
    };

    // Set up 15-minute interval (900000 ms)
    const syncInterval = setInterval(autoSync, 900000);
    
    // Sync when coming online
    const handleOnline = () => {
      console.log('[CustomersPage] Device came online, syncing...');
      autoSync();
    };
    
    // Listen for online event
    window.addEventListener('online', handleOnline);
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Sync immediately on mount
    syncData();

    // Cleanup
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, reference, recent
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedCustomerForJob, setSelectedCustomerForJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);

  // Sort customers
  // Helper function to get jobs for a customer
  const getCustomerJobs = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.jobs || [];
  };

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



  const handleAddCustomer = async (newCustomer: any) => {
    try {
      // Don't pass any temp ID - let backend generate the ID
      const customerData = { ...newCustomer };
      delete customerData.id; // Remove any temp ID if present
      
      console.log('[Customer] Creating customer:', customerData);
      const customer = await customersApi.create(customerData);
      console.log('[Customer] Created with ID:', customer.id);
      
      // Validate that we got a real ID back
      if (!customer.id || customer.id.includes('temp')) {
        console.error('[Customer] WARNING: Received temp ID from server:', customer.id);
        toast.warning('Customer created but may need to refresh for proper ID');
      }
      
      // Use the server response with REAL ID
      setCustomers([customer, ...customers]);
      toast.success('Customer added successfully');
      setShowModal(false);
      
      return customer; // Return customer with real ID
    } catch (err) {
      console.error('[Customer] Failed to create:', err);
      toast.error('Failed to add customer');
      throw err;
    }
  };

  const handleEditCustomer = async (updatedCustomer: any) => {
    try {
      const customer = await customersApi.update(editingCustomer.id, updatedCustomer);
      setCustomers(customers.map(c => 
        c.id === customer.id ? customer : c
      ));
      toast.success('Customer updated successfully');
      setEditingCustomer(null);
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersApi.delete(id);
        setCustomers(customers.filter(c => c.id !== id));
        toast.success('Customer deleted successfully');
      } catch (err) {
        toast.error('Failed to delete customer');
      }
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

  const handleSaveJob = async (jobData: any) => {
    try {
      console.log('handleSaveJob called with:', jobData);
      console.log('editingJob:', editingJob);
      console.log('selectedCustomerForJob:', selectedCustomerForJob);
      
      // Validate customer ID first
      const customerId = jobData.customerId || selectedCustomerForJob?.id;
      
      // Check for invalid customer ID (temp IDs)
      if (!customerId || customerId.toString().includes('temp')) {
        console.error('[Job Save] Invalid customer ID:', customerId);
        toast.error('Cannot save job - customer not properly saved. Please refresh and try again.');
        
        // If we have a temp customer, try to sync first
        if (customerId && customerId.includes('temp')) {
          toast.info('Syncing customer data... Please wait and try again.');
          await customersApi.sync();
        }
        return;
      }
      
      console.log('[Job Save] Using validated customer ID:', customerId);
      
      // Check if we're updating or creating
      if (editingJob && editingJob.id) {
        // Update existing job
        const updateData = {
          title: jobData.title,
          description: jobData.description || '',
          status: jobData.status,
          priority: jobData.priority,
          startDate: jobData.startDate,
          endDate: jobData.endDate,
          completedDate: jobData.completedDate,
          notes: jobData.notes || '',
          customerId: jobData.customerId || editingJob.customerId,
          photos: jobData.photos || [],
          plans: jobData.plans || []
        };
        
        console.log('Updating job ID:', editingJob.id);
        console.log('Update payload:', updateData);
        
        try {
          const updatedJob = await jobsApi.update(editingJob.id, updateData);
          console.log('Update successful:', updatedJob);
          
          // Update local state
          setCustomers(prevCustomers => {
            return prevCustomers.map(customer => {
              if (customer.id === updatedJob.customerId) {
                const updatedJobs = customer.jobs ? [...customer.jobs] : [];
                const index = updatedJobs.findIndex(j => j.id === updatedJob.id);
                if (index !== -1) {
                  updatedJobs[index] = updatedJob;
                }
                return { ...customer, jobs: updatedJobs };
              }
              return customer;
            });
          });
          toast.success('Job updated successfully');
        } catch (apiError: any) {
          console.error('API Error details:', {
            message: apiError.message,
            response: apiError.response,
            data: apiError.response?.data,
            status: apiError.response?.status
          });
          throw apiError;
        }
      } else if (jobData.id) {
        // Legacy path - update using jobData.id
        console.warn('Using legacy update path with jobData.id:', jobData.id);
        const updateData = {
          title: jobData.title,
          description: jobData.description || '',
          status: jobData.status,
          priority: jobData.priority,
          startDate: jobData.startDate,
          endDate: jobData.endDate,
          completedDate: jobData.completedDate,
          notes: jobData.notes || '',
          customerId: jobData.customerId,
          photos: jobData.photos || [],
          plans: jobData.plans || []
        };
        
        const updatedJob = await jobsApi.update(jobData.id, updateData);
        
        // Update local state - update the customer's jobs array
        setCustomers(prevCustomers => {
          return prevCustomers.map(customer => {
            if (customer.id === updatedJob.customerId) {
              const updatedJobs = customer.jobs ? [...customer.jobs] : [];
              const jobIndex = updatedJobs.findIndex(j => j.id === updatedJob.id);
              if (jobIndex !== -1) {
                updatedJobs[jobIndex] = updatedJob;
              }
              return { ...customer, jobs: updatedJobs };
            }
            return customer;
          });
        });
        toast.success('Job updated successfully');
      } else {
        // Create new job
        console.log('Creating new job');
        console.log('selectedCustomerForJob:', selectedCustomerForJob);
        console.log('jobData.customerId:', jobData.customerId);
        
        // Ensure we have a valid customer ID (not temp)
        const customerId = jobData.customerId || selectedCustomerForJob?.id;
        if (!customerId) {
          throw new Error('No customer selected for this job');
        }
        
        // Check for temp customer ID
        if (customerId.toString().includes('temp')) {
          console.error('[Job Save] Cannot create job with temp customer ID:', customerId);
          throw new Error('Customer not properly saved - please refresh and try again');
        }
        
        const createPayload = {
          title: jobData.title,
          description: jobData.description || '',
          customerId: customerId,
          status: jobData.status || 'QUOTED',
          priority: jobData.priority || 'medium',
          startDate: jobData.startDate,
          endDate: jobData.endDate,
          notes: jobData.notes || '',
          photos: jobData.photos || [],
          plans: jobData.plans || []
        };
        console.log('Create payload:', JSON.stringify(createPayload, null, 2));
        const newJob = await jobsApi.create(createPayload);
        console.log('New job created:', newJob);
        
        // Update local state - add the new job to the customer's jobs array
        setCustomers(prevCustomers => {
          return prevCustomers.map(customer => {
            if (customer.id === customerId) {
              const updatedJobs = customer.jobs ? [...customer.jobs, newJob] : [newJob];
              return { ...customer, jobs: updatedJobs };
            }
            return customer;
          });
        });
        
        toast.success('Job created successfully');
      }
    } catch (err: any) {
      console.error('Failed to save job - Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      
      // Show more specific error message
      let errorMessage = 'Failed to save job';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.details) {
        errorMessage = err.response.data.details;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    }
    
    setShowAddJobModal(false);
    setSelectedCustomerForJob(null);
    setEditingJob(null);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await jobsApi.delete(jobId);
      // Update local state - remove the job from the customer's jobs array
      setCustomers(prevCustomers => {
        return prevCustomers.map(customer => {
          if (customer.jobs && customer.jobs.some(j => j.id === jobId)) {
            const updatedJobs = customer.jobs.filter(j => j.id !== jobId);
            return { ...customer, jobs: updatedJobs };
          }
          return customer;
        });
      });
      toast.success('Job deleted successfully');
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  return (
    <>
      <ScrollablePageContainer>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Fixed Header */}
        <div className="bg-white pb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
            <h1 style={{ fontSize: '27.6px', fontWeight: 'bold', margin: 0 }}>Customers</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
                  fontSize: '16.1px',
                  fontWeight: '500'
                }}
              >
                + Add Customer
              </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
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
              fontSize: '18.4px'
            }}
          />
        </div>

        {/* Sort Buttons */}
        <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSortBy('name')}
            style={{
              padding: '6px 12px',
              backgroundColor: sortBy === 'name' ? '#3B82F6' : '#E5E7EB',
              color: sortBy === 'name' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16.1px'
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
              fontSize: '16.1px'
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
              fontSize: '16.1px'
            }}
          >
            Recent
          </button>
        </div>
        </div>
        </div>

        {/* Customer List Container */}
        <div style={{ paddingBottom: '20px' }}>
        {/* Customer Cards */}
        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            color: '#6B7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading customers...</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
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
                      <h3 style={{ margin: 0, fontSize: '18.4px', fontWeight: '600' }}>{customer.name}</h3>
                      {customer.reference && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: customer.reference === 'HOD' ? '#10B981' : 
                                         customer.reference === 'Yelp' ? '#F59E0B' : '#3B82F6',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11.5px',
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
                        fontSize: '13.8px',
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
                          fontSize: '13.8px',
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
                          fontSize: '13.8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        💬 Text
                      </button>
                      <span style={{ fontSize: '13.8px', color: '#666' }}>{customer.phone}</span>
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
                        fontSize: '12.65px',
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
                        fontSize: '12.65px', 
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
                              fontSize: '13.8px', 
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
                                    console.log('Setting editingJob to:', job);
                                    console.log('Job object structure:', {
                                      id: job.id,
                                      title: job.title,
                                      customerId: job.customerId,
                                      allFields: Object.keys(job)
                                    });
                                    console.log('=== OPENING JOB MODAL ===');
                                    console.log('Customer being set:', customer);
                                    console.log('Job being edited:', job);
                                    setSelectedCustomerForJob(customer);
                                    setEditingJob(job);  // Make sure this has the full job object with ID
                                    setShowAddJobModal(true);
                                    console.log('Modal should now be open');
                                  }}
                                  style={{
                                    background: 'none',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '4px',
                                    padding: '6px 8px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '12.65px',
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
                                    <div style={{ color: '#6B7280', fontSize: '11.5px' }}>
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
                        fontSize: '13.8px',
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
                        fontSize: '13.8px',
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
                        fontSize: '13.8px',
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
                      <span style={{ fontSize: '16.1px' }}>+</span> Add Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
    </ScrollablePageContainer>

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
    {console.log('Modal render check:', { showAddJobModal, selectedCustomerForJob, editingJob })}
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
          onJobUpdate={(updatedJob) => {
            console.log('onJobUpdate called with:', updatedJob);
            // Update the editing job with latest data
            setEditingJob(updatedJob);
            // Also update in the customer jobs list
            setCustomers(prevCustomers => {
              return prevCustomers.map(customer => {
                if (customer.id === updatedJob.customerId) {
                  const updatedJobs = customer.jobs ? [...customer.jobs] : [];
                  const jobIndex = updatedJobs.findIndex(j => j.id === updatedJob.id);
                  if (jobIndex !== -1) {
                    // Update existing job
                    updatedJobs[jobIndex] = updatedJob;
                  } else {
                    // Add new job if it doesn't exist (created via photo upload)
                    updatedJobs.push(updatedJob);
                  }
                  return { ...customer, jobs: updatedJobs };
                }
                return customer;
              });
            });
          }}
        />
    )}
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
                fontSize: '18.4px',
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
                fontSize: '18.4px'
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
                fontSize: '18.4px'
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
                fontSize: '18.4px'
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
                fontSize: '18.4px'
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
                  fontSize: '18.4px'
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
                  fontSize: '18.4px',
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
                  fontSize: '18.4px'
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
                fontSize: '18.4px',
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
                fontSize: '18.4px',
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
                fontSize: '18.4px',
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
const AddJobModal = ({ customer, onClose, onSave, existingJob = null, onDelete = null, onJobUpdate = null }: any) => {
  // ADD THESE 5 LINES OF DEBUG CODE:
  console.log('=== JOB MODAL DEBUG ===');
  console.log('[Job Modal] Customer ID:', customer?.id);
  console.log('[Job Modal] Customer Name:', customer?.name);
  console.log('[Job Modal] Job Customer ID:', existingJob?.customerId);
  console.log('[Job Modal] IDs Match?', customer?.id === existingJob?.customerId);
  
  console.log('[AddJobModal] Initialized with customer:', customer);
  console.log('[AddJobModal] Existing job:', existingJob);
  
  const [activeTab, setActiveTab] = useState('description');
  const [currentJobId, setCurrentJobId] = useState(existingJob?.id || null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  const [jobData, setJobData] = useState({
    id: existingJob?.id || null,
    title: existingJob?.title || '',
    description: existingJob?.description || '',
    status: existingJob?.status || 'QUOTED',
    priority: existingJob?.priority || 'medium',
    startDate: existingJob?.startDate || null,
    endDate: existingJob?.endDate || null,
    completedDate: existingJob?.completedDate || null,
    customerId: existingJob?.customerId || customer?.id,
    photos: existingJob?.photos || [],
    plans: existingJob?.plans || [],
    notes: existingJob?.notes || '',
    comments: existingJob?.comments || []
  });
  
  console.log('[AddJobModal] Initial jobData:', jobData);

  // Update job data when existingJob changes (e.g., after save)
  useEffect(() => {
    if (existingJob) {
      console.log('Updating job data from existingJob:', existingJob);
      setJobData({
        id: existingJob.id,
        title: existingJob.title || '',
        description: existingJob.description || '',
        status: existingJob.status || 'QUOTED',
        priority: existingJob.priority || 'medium',
        startDate: existingJob.startDate || null,
        endDate: existingJob.endDate || null,
        completedDate: existingJob.completedDate || null,
        customerId: existingJob.customerId || customer?.id,
        photos: existingJob.photos || [],
        plans: existingJob.plans || [],
        notes: existingJob.notes || '',
        comments: existingJob.comments || []
      });
      setCurrentJobId(existingJob.id);
    }
  }, [existingJob, customer]);

  const tabs = [
    { id: 'description', label: 'Job Description', icon: '📋' },
    { id: 'photos', label: 'Photos', icon: '📸' },
    { id: 'plans', label: 'Drawings/Plans', icon: '📐' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'comments', label: 'Comments', icon: '💬' }
  ];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    console.log('[Photo Save] Step 1: Checking job status', { 
      hasId: !!currentJobId, 
      currentJobId, 
      jobDataId: jobData.id,
      title: jobData.title,
      existingJob: !!existingJob 
    });
    
    // Check if job has a title
    if (!jobData.title && !existingJob) {
      toast.error('Please enter a job title first');
      e.target.value = ''; // Reset file input
      return;
    }
    
    // Show loading toast
    const loadingToast = toast.info('Compressing photos...', { autoClose: false });
    
    try {
      // First, compress and add all photos to local state
      const newPhotos = [];
      for (const file of files) {
        // Compress image before adding
        const compressedUrl = await compressImage(file, 1920, 1080, 0.7);
        const newPhoto = {
          id: Date.now() + Math.random(),
          url: compressedUrl,
          name: file.name
        };
        newPhotos.push(newPhoto);
      }
      
      // Update local state with new photos
      setJobData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
      
      toast.dismiss(loadingToast);
      toast.success(`${files.length} photo(s) added successfully`);
      
      // Show saving indicator
      const savingToast = toast.info('Saving photos to database...', { autoClose: false });
      
      // Auto-save the job after adding photos
      try {
        console.log('[Photo Save] Step 2: About to save photos', {
          currentJobId,
          jobDataId: jobData.id,
          photoCount: jobData.photos.length + newPhotos.length,
          newPhotoCount: newPhotos.length
        });
        
        // Wait a bit to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Call handleSavePhotos with the updated photo data
        await handleSavePhotos();
        
        toast.dismiss(savingToast);
        toast.success('Photos saved to database successfully', { autoClose: 3000 });
        setUnsavedChanges(false);
        
      } catch (saveError: any) {
        toast.dismiss(savingToast);
        
        // Show specific error but don't remove photos from UI
        console.error('[Photo Save] Error:', saveError);
        console.error('[Photo Save] Error details:', {
          message: saveError.message,
          response: saveError.response,
          data: saveError.response?.data,
          stack: saveError.stack
        });
        
        // Mark as having unsaved changes
        setUnsavedChanges(true);
        
        // More detailed error message
        let errorMsg = 'Photos added to screen but NOT saved to database';
        if (saveError.response?.data?.error) {
          errorMsg += `: ${saveError.response.data.error}`;
        } else if (saveError.response?.data?.details) {
          errorMsg += `: ${saveError.response.data.details}`;
        } else if (saveError.message) {
          errorMsg += `: ${saveError.message}`;
        }
        
        toast.error(errorMsg, { autoClose: 10000 }); // Show error for 10 seconds
        
        // If it's a new job without ID, suggest saving the job first
        if (!currentJobId && !jobData.id) {
          toast.info('Tip: Save the job first by clicking "Create Job" button', { autoClose: 8000 });
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to process some photos');
      console.error('[Photo Save] Processing error:', error);
    }
  };

  const handlePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check if job has a title
    if (!jobData.title && !existingJob) {
      toast.error('Please enter a job title first');
      e.target.value = ''; // Reset file input
      return;
    }
    
    // Show loading toast
    const loadingToast = toast.info('Processing documents...', { autoClose: false });
    
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          // Compress image files
          const compressedUrl = await compressImage(file, 1920, 1080, 0.7);
          setJobData(prev => ({
            ...prev,
            plans: [...prev.plans, {
              id: Date.now() + Math.random(),
              url: compressedUrl,
              name: file.name,
              type: file.type
            }]
          }));
        } else {
          // For non-image files (PDFs, etc), read as-is
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
        }
      }
      
      toast.dismiss(loadingToast);
      toast.success(`${files.length} document(s) added successfully`);
      
      // Auto-save the job after adding documents (without closing modal)
      await handleSavePhotos();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to process some documents');
      console.error('Document upload error:', error);
    }
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

  // Save photos/plans without closing modal
  const handleSavePhotos = async () => {
    console.log('[Photo Save] Step 3: handleSavePhotos called', {
      currentJobId,
      jobDataId: jobData.id,
      hasPhotos: jobData.photos.length > 0,
      photoCount: jobData.photos.length,
      customerId: customer?.id,
      title: jobData.title
    });
    
    // Validate customer ID first
    const customerId = customer?.id || jobData.customerId;
    
    if (!customerId || customerId.toString().includes('temp')) {
      console.error('[Photo Save] Invalid customer ID:', customerId);
      toast.error('Cannot save photos - customer not saved properly. Please refresh the page.');
      
      // Show more helpful message for temp IDs
      if (customerId && customerId.includes('temp')) {
        toast.info('The customer needs to sync with the server first. Please refresh the page and try again.');
      }
      return;
    }
    
    console.log('[Photo Save] Customer ID validated:', customerId);
    
    try {
      if (currentJobId || jobData.id) {
        // Update existing job with new photos - need to send all fields
        const jobId = currentJobId || jobData.id;
        const updateData = {
          title: jobData.title,
          description: jobData.description || '',
          status: jobData.status,
          priority: jobData.priority,
          startDate: jobData.startDate,
          endDate: jobData.endDate,
          completedDate: jobData.completedDate,
          notes: jobData.notes || '',
          customerId: jobData.customerId || customer.id,
          photos: jobData.photos || [],
          plans: jobData.plans || []
        };
        
        console.log('[Photo Save] Step 4: Updating existing job', {
          jobId,
          photoCount: updateData.photos.length,
          firstPhoto: updateData.photos[0] ? { name: updateData.photos[0].name, hasUrl: !!updateData.photos[0].url } : null
        });
        
        const updatedJob = await jobsApi.update(jobId, updateData);
        
        console.log('[Photo Save] Step 5: Response from server', {
          jobId: updatedJob?.id,
          hasPhotos: !!updatedJob?.photos,
          photoCount: updatedJob?.photos?.length || 0,
          responsePhotos: updatedJob?.photos
        });
        
        if (!updatedJob || !updatedJob.id) {
          throw new Error('Server did not return a valid job object');
        }
        
        // Check if photos were actually saved (only if we expected photos)
        if (jobData.photos.length > 0 && (!updatedJob.photos || updatedJob.photos.length === 0)) {
          console.error('[Photo Save] ERROR: Photos not in response', {
            sentPhotos: jobData.photos.length,
            receivedPhotos: updatedJob.photos?.length || 0
          });
          throw new Error('Photos were not saved by the server - database migration may be needed');
        }
        
        console.log('[Photo Save] Step 6: Photos saved successfully', {
          savedPhotoCount: updatedJob.photos?.length || 0
        });
        
        // Update parent component with new job data
        if (onJobUpdate) {
          onJobUpdate(updatedJob);
        }
        
        // Update local job data with the response from server
        setJobData(prev => ({
          ...prev,
          id: updatedJob.id,
          photos: updatedJob.photos || [],
          plans: updatedJob.plans || []
        }));
        
        // Make sure currentJobId is set
        if (!currentJobId) {
          setCurrentJobId(updatedJob.id);
        }
        
        setUnsavedChanges(false);
      } else {
        // Create new job first - this only happens for NEW jobs
        console.log('[Photo Save] Step 4: Creating new job', {
          title: jobData.title,
          photoCount: jobData.photos.length,
          hasTitle: !!jobData.title
        });
        
        // Ensure we have a title before creating
        if (!jobData.title) {
          throw new Error('Job title is required before saving photos');
        }
        
        const createData = {
          title: jobData.title,
          description: jobData.description || '',
          customerId: customer.id,
          status: jobData.status || 'QUOTED',
          priority: jobData.priority || 'medium',
          startDate: jobData.startDate,
          endDate: jobData.endDate,
          notes: jobData.notes || '',
          photos: jobData.photos || [],
          plans: jobData.plans || []
        };
        
        const newJob = await jobsApi.create(createData);
        
        console.log('[Photo Save] Step 5: New job created', {
          jobId: newJob?.id,
          hasPhotos: !!newJob?.photos,
          photoCount: newJob?.photos?.length || 0
        });
        
        if (!newJob || !newJob.id) {
          throw new Error('Failed to create job - server did not return a valid job');
        }
        
        // Update local state with the new job ID immediately
        setCurrentJobId(newJob.id);
        setJobData(prev => ({
          ...prev,
          id: newJob.id,
          photos: newJob.photos || [],
          plans: newJob.plans || []
        }));
        
        console.log('[Photo Save] Step 6: State updated with new job', {
          currentJobId: newJob.id,
          jobDataId: newJob.id
        });
        
        // Update parent component with new job data
        if (onJobUpdate) {
          onJobUpdate(newJob);
        }
        
        setUnsavedChanges(false);
        
        // Show success message
        toast.success('Job created successfully with photos');
      }
    } catch (error) {
      console.error('[Photo Save] ERROR in handleSavePhotos:', error);
      throw error;
    }
  };

  // Safety check - ensure we have a customer
  if (!customer || !customer.id) {
    console.error('[AddJobModal] ERROR: No customer provided or customer has no ID');
    toast.error('Error: No customer selected');
    onClose();
    return null;
  }

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
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {existingJob ? 'Edit Job' : 'Add Job'} for {customer.name} (ID: {customer.id})
                {unsavedChanges && (
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#EF4444', 
                    fontWeight: 'normal',
                    backgroundColor: '#FEE2E2',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {currentJobId ? 'Unsaved changes' : 'Save job to persist photos'}
                  </span>
                )}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '16.1px' }}>
                {customer.address}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Upload Photos button - show when Photos tab is active */}
              {activeTab === 'photos' && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    id="photo-upload-header"
                  />
                  <label
                    htmlFor="photo-upload-header"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16.1px',
                      fontWeight: '500'
                    }}
                  >
                    Add Photos
                  </label>
                </>
              )}
              
              {/* Upload Documents button - show when Plans tab is active */}
              {activeTab === 'plans' && (
                <>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    multiple
                    onChange={handlePlanUpload}
                    style={{ display: 'none' }}
                    id="plan-upload-header"
                  />
                  <label
                    htmlFor="plan-upload-header"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16.1px',
                      fontWeight: '500'
                    }}
                  >
                    Add Documents
                  </label>
                </>
              )}
              
              {/* Cancel button */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16.1px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              {/* Delete Job button */}
              {existingJob && onDelete && (
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
                    fontSize: '16.1px',
                    fontWeight: '500'
                  }}
                >
                  Delete Job
                </button>
              )}
            </div>
          </div>
        </div>

        <div 
          className="tabs-container"
          style={{
          display: 'flex',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollbarWidth: 'none', // Hide scrollbar Firefox
          msOverflowStyle: 'none', // Hide scrollbar IE/Edge
          minHeight: '48px', // Ensure minimum height
          flexWrap: 'nowrap', // Prevent wrapping
          gap: '4px', // Add gap between tabs
          padding: '0 8px' // Add horizontal padding
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: window.innerWidth <= 640 ? '10px 12px' : '12px 20px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 640 ? '14.95px' : '16.1px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: window.innerWidth <= 640 ? '4px' : '8px',
                flexShrink: 0, // Prevent tabs from shrinking
                minWidth: 'fit-content' // Ensure minimum width
              }}
            >
              {window.innerWidth > 640 && <span>{tab.icon}</span>}
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
                      fontSize: '18.4px',
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
                      fontSize: '18.4px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div>
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
                        onClick={async () => {
                          setJobData(prev => ({
                            ...prev,
                            photos: prev.photos.filter(p => p.id !== photo.id)
                          }));
                          
                          // If it's an existing job, auto-save the removal
                          if (currentJobId) {
                            try {
                              const savingToast = toast.info('Removing photo...', { autoClose: false });
                              // Wait for state update
                              await new Promise(resolve => setTimeout(resolve, 100));
                              await handleSavePhotos();
                              toast.dismiss(savingToast);
                              toast.success('Photo removed');
                            } catch (error) {
                              toast.dismiss();
                              toast.error('Failed to remove photo from database');
                              setUnsavedChanges(true);
                            }
                          } else {
                            // For new jobs, just mark as unsaved
                            setUnsavedChanges(true);
                          }
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
                          fontSize: '13.8px'
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
                      <span style={{ fontSize: '27.6px', marginRight: '12px' }}>
                        {plan.type.includes('pdf') ? '📄' : '🖼️'}
                      </span>
                      <span style={{ flex: 1, fontSize: '16.1px' }}>{plan.name}</span>
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
                          fontSize: '16.1px'
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
                    fontSize: '18.4px',
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
                        fontSize: '16.1px'
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
                        fontSize: '16.1px'
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
                        <span style={{ fontWeight: '500', fontSize: '16.1px' }}>{comment.author}</span>
                        <span style={{ color: '#6B7280', fontSize: '13.8px' }}>
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '16.1px' }}>{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer with Save/Cancel buttons */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F9FAFB'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Delete button for existing jobs */}
              {existingJob && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this job?')) {
                      onDelete(existingJob.id);
                      onClose();
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#DC2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16.1px',
                    fontWeight: '500'
                  }}
                >
                  Delete Job
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              
              {/* Show Create/Update button only for Description tab OR if job doesn't exist yet */}
              {(activeTab === 'description' || !currentJobId) && (
                <button
                  type="submit"
                  disabled={!jobData.title}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: jobData.title ? '#3B82F6' : '#9CA3AF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: jobData.title ? 'pointer' : 'not-allowed',
                    fontSize: '16.1px',
                    fontWeight: '500'
                  }}
                >
                  {existingJob ? 'Update Job' : 'Create Job'}
                </button>
              )}
              
              {/* Show Save Changes button on other tabs if there are unsaved changes */}
              {activeTab !== 'description' && currentJobId && unsavedChanges && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const savingToast = toast.info('Saving changes...', { autoClose: false });
                      await handleSavePhotos();
                      toast.dismiss(savingToast);
                      toast.success('Changes saved successfully');
                    } catch (error) {
                      toast.dismiss();
                      toast.error('Failed to save changes');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16.1px',
                    fontWeight: '500'
                  }}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomersEnhanced;