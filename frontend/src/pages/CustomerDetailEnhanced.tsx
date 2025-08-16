import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerStorage } from '../utils/localStorage';

const CustomerDetailEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Load customer data from localStorage
  const [customer, setCustomer] = useState(null);
  
  useEffect(() => {
    const customers = customerStorage.getAll();
    const foundCustomer = customers.find(c => c.id === id);
    if (foundCustomer) {
      setCustomer(foundCustomer);
    } else {
      // If customer not found, redirect to customers page
      navigate('/customers');
    }
  }, [id, navigate]);

  // For now, show empty jobs list - in a real app, this would load from a jobs service
  const [jobs] = useState([]);

  const handlePhoneClick = (e) => {
    e.stopPropagation();
    window.location.href = `tel:${customer.phone.replace(/\D/g, '')}`;
  };

  const handleEmailClick = (e) => {
    e.stopPropagation();
    window.location.href = `mailto:${customer.email}`;
  };

  const handleAddressClick = (e) => {
    e.stopPropagation();
    const encodedAddress = encodeURIComponent(customer.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#10B981';
      case 'In Progress': return '#3B82F6';
      case 'Quote': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!customer) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <p>Loading customer details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/customers')}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#E5E7EB',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '16.1px'
        }}
      >
        ← Back to Customers
      </button>

      {/* Customer Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '27.6px', fontWeight: 'bold' }}>
              {customer.name}
            </h1>
            {customer.reference && (
              <span style={{ 
                display: 'inline-block',
                fontSize: '13.8px', 
                backgroundColor: '#E5E7EB',
                color: '#374151',
                padding: '4px 8px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                {customer.reference}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleEmailClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '16.1px',
                  textAlign: 'left',
                  textDecoration: 'none'
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
                {customer.email}
              </button>
              <button
                onClick={handlePhoneClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '18.4px',
                  textAlign: 'left'
                }}
              >
                {customer.phone}
              </button>
              <button
                onClick={handleAddressClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '16.1px',
                  textAlign: 'left',
                  textDecoration: 'none'
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
            </div>
            {customer.notes && (
              <p style={{
                marginTop: '15px',
                fontSize: '16.1px',
                color: '#6B7280',
                fontStyle: 'italic',
                borderTop: '1px solid #E5E7EB',
                paddingTop: '15px'
              }}>
                {customer.notes}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate(`/customers/edit/${customer.id}`)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#E5E7EB',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16.1px'
              }}
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this customer?')) {
                  // Delete logic here
                  navigate('/customers');
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16.1px'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ fontSize: '23px', fontWeight: 'bold', margin: 0 }}>Jobs</h2>
          <button
            onClick={() => navigate(`/customers/${customer.id}/jobs/new`)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16.1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            + Add New Job
          </button>
        </div>

        {/* Jobs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.map(job => (
            <div
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '20.7px', 
                    fontWeight: '600' 
                  }}>
                    {job.title}
                  </h3>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16.1px', 
                    color: '#6B7280' 
                  }}>
                    {job.description}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    fontSize: '14.95px', 
                    color: '#6B7280' 
                  }}>
                    <span>Start: {formatDate(job.startDate)}</span>
                    {job.endDate && <span>End: {formatDate(job.endDate)}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: `${getStatusColor(job.status)}20`,
                    color: getStatusColor(job.status),
                    borderRadius: '12px',
                    fontSize: '13.8px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    {job.status}
                  </span>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '20.7px', 
                    fontWeight: 'bold',
                    color: '#111827'
                  }}>
                    ${job.totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            No jobs yet. Click "Add New Job" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailEnhanced;