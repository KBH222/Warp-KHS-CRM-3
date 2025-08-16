import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calendarJobStorage, customerStorage } from '../utils/localStorage';
import { ScrollablePageContainer } from '../components/ScrollablePageContainer';

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('all'); // all, draft, sent, paid, overdue
  const [selectedJob, setSelectedJob] = useState(null);
  const [invoiceData, setInvoiceData] = useState({
    jobId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
    lineItems: [],
    subtotal: 0,
    tax: 0,
    taxRate: 0.08, // 8% default
    total: 0,
    notes: '',
    status: 'draft',
    paidDate: null
  });

  useEffect(() => {
    // Load data from localStorage
    const savedInvoices = localStorage.getItem('khs_crm_invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
    setJobs(calendarJobStorage.getAll());
    setCustomers(customerStorage.getAll());
  }, []);

  useEffect(() => {
    // Generate invoice number
    if (!invoiceData.invoiceNumber) {
      const nextNumber = invoices.length + 1001;
      setInvoiceData(prev => ({ ...prev, invoiceNumber: `INV-${nextNumber}` }));
    }
  }, [invoices.length]);

  const saveInvoices = (updatedInvoices) => {
    localStorage.setItem('khs_crm_invoices', JSON.stringify(updatedInvoices));
    setInvoices(updatedInvoices);
  };

  const handleJobSelect = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setInvoiceData(prev => ({
        ...prev,
        jobId,
        lineItems: [{
          id: Date.now(),
          description: job.title,
          quantity: 1,
          rate: job.price || 0,
          amount: job.price || 0
        }]
      }));
      calculateTotals([{
        id: Date.now(),
        description: job.title,
        quantity: 1,
        rate: job.price || 0,
        amount: job.price || 0
      }]);
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...invoiceData.lineItems];
    updatedItems[index][field] = value;
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setInvoiceData(prev => ({ ...prev, lineItems: updatedItems }));
    calculateTotals(updatedItems);
  };

  const addLineItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    const updatedItems = [...invoiceData.lineItems, newItem];
    setInvoiceData(prev => ({ ...prev, lineItems: updatedItems }));
  };

  const removeLineItem = (index) => {
    const updatedItems = invoiceData.lineItems.filter((_, i) => i !== index);
    setInvoiceData(prev => ({ ...prev, lineItems: updatedItems }));
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * invoiceData.taxRate;
    const total = subtotal + tax;
    
    setInvoiceData(prev => ({ ...prev, subtotal, tax, total }));
  };

  const handleCreateInvoice = () => {
    const newInvoice = {
      ...invoiceData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      customer: selectedJob ? jobs.find(j => j.id === selectedJob.id)?.customerName : '',
      customerId: selectedJob ? jobs.find(j => j.id === selectedJob.id)?.customerId : ''
    };
    
    const updatedInvoices = [...invoices, newInvoice];
    saveInvoices(updatedInvoices);
    setShowNewInvoiceModal(false);
    resetForm();
  };

  const resetForm = () => {
    setInvoiceData({
      jobId: '',
      invoiceNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lineItems: [],
      subtotal: 0,
      tax: 0,
      taxRate: 0.08,
      total: 0,
      notes: '',
      status: 'draft',
      paidDate: null
    });
    setSelectedJob(null);
  };

  const updateInvoiceStatus = (invoiceId, newStatus) => {
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date().toISOString() : inv.paidDate
        };
      }
      return inv;
    });
    saveInvoices(updatedInvoices);
  };

  const deleteInvoice = (invoiceId) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
      saveInvoices(updatedInvoices);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'overdue') {
      return invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date();
    }
    return invoice.status === filter;
  });

  const getStatusColor = (status, dueDate) => {
    if (status === 'paid') return '#10B981';
    if (status === 'sent' && new Date(dueDate) < new Date()) return '#EF4444';
    if (status === 'sent') return '#3B82F6';
    return '#6B7280';
  };

  const getStatusText = (status, dueDate) => {
    if (status === 'paid') return 'Paid';
    if (status === 'sent' && new Date(dueDate) < new Date()) return 'Overdue';
    if (status === 'sent') return 'Sent';
    return 'Draft';
  };

  return (
    <ScrollablePageContainer>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <div>
            <h1 style={{ fontSize: '27.6px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              Invoices
            </h1>
            <p style={{ color: '#6B7280', margin: 0 }}>
              Manage invoices and payment tracking
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewInvoiceModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16.1px',
            fontWeight: '500'
          }}
        >
          + New Invoice
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {['all', 'draft', 'sent', 'paid', 'overdue'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === status ? '#3B82F6' : '#E5E7EB',
              color: filter === status ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16.1px',
              textTransform: 'capitalize'
            }}
          >
            {status === 'all' ? 'All Invoices' : status}
            {status !== 'all' && ` (${invoices.filter(inv => 
              status === 'overdue' 
                ? inv.status !== 'paid' && new Date(inv.dueDate) < new Date()
                : inv.status === status
            ).length})`}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {filteredInvoices.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9CA3AF'
          }}>
            <div style={{ fontSize: '55.2px', marginBottom: '16px' }}>📄</div>
            <p style={{ fontSize: '18.4px', margin: '0 0 8px 0' }}>
              No invoices found
            </p>
            <p style={{ fontSize: '16.1px', margin: 0 }}>
              Create your first invoice to get started
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Invoice #
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Customer
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Amount
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Issue Date
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Due Date
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                <tr key={invoice.id} style={{ borderBottom: index < filteredInvoices.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                  <td style={{ padding: '16px', fontSize: '16.1px', fontWeight: '500' }}>
                    {invoice.invoiceNumber}
                  </td>
                  <td style={{ padding: '16px', fontSize: '16.1px', color: '#374151' }}>
                    {invoice.customer}
                  </td>
                  <td style={{ padding: '16px', fontSize: '16.1px', fontWeight: '600' }}>
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '16.1px', color: '#6B7280' }}>
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', fontSize: '16.1px', color: '#6B7280' }}>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13.8px',
                      fontWeight: '500',
                      backgroundColor: `${getStatusColor(invoice.status, invoice.dueDate)}20`,
                      color: getStatusColor(invoice.status, invoice.dueDate)
                    }}>
                      {getStatusText(invoice.status, invoice.dueDate)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13.8px'
                          }}
                        >
                          Send
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13.8px'
                          }}
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#E5E7EB',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13.8px'
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        style={{
                          padding: '6px 12px',
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
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
            padding: '24px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '23px', fontWeight: '600', marginBottom: '20px' }}>
              Create New Invoice
            </h2>

            {/* Job Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '16.1px', fontWeight: '500', marginBottom: '8px' }}>
                Select Job
              </label>
              <select
                value={invoiceData.jobId}
                onChange={(e) => handleJobSelect(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '16.1px'
                }}
              >
                <option value="">Select a job...</option>
                {jobs.filter(job => job.status === 'completed').map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.customerName} (${job.price || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '16.1px', fontWeight: '500', marginBottom: '8px' }}>
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '16.1px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '16.1px', fontWeight: '500', marginBottom: '8px' }}>
                  Issue Date
                </label>
                <input
                  type="date"
                  value={invoiceData.issueDate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, issueDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '16.1px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '16.1px', fontWeight: '500', marginBottom: '8px' }}>
                Due Date
              </label>
              <input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '16.1px'
                }}
              />
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '16.1px', fontWeight: '500', marginBottom: '8px' }}>
                Line Items
              </label>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', width: '100px' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', width: '120px' }}>Rate</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontSize: '13.8px', fontWeight: '600', width: '120px' }}>Amount</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.lineItems.map((item, index) => (
                    <tr key={item.id}>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            fontSize: '16.1px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            fontSize: '16.1px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleLineItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            fontSize: '16.1px',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '16.1px', fontWeight: '500' }}>
                        ${item.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button
                          onClick={() => removeLineItem(index)}
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
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addLineItem}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16.1px'
                }}
              >
                + Add Line Item
              </button>
            </div>

            {/* Totals */}
            <div style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '16.1px', color: '#6B7280' }}>Subtotal:</span>
                <span style={{ fontSize: '16.1px', fontWeight: '500' }}>${invoiceData.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '16.1px', color: '#6B7280' }}>Tax (8%):</span>
                <span style={{ fontSize: '16.1px', fontWeight: '500' }}>${invoiceData.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}>
                <span style={{ fontSize: '18.4px', fontWeight: '600' }}>Total:</span>
                <span style={{ fontSize: '18.4px', fontWeight: '600' }}>${invoiceData.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '16.1px', fontWeight: '500', marginBottom: '8px' }}>
                Notes
              </label>
              <textarea
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or payment terms..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '16.1px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNewInvoiceModal(false);
                  resetForm();
                }}
                style={{
                  padding: '10px 20px',
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
              <button
                onClick={handleCreateInvoice}
                disabled={invoiceData.lineItems.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: invoiceData.lineItems.length === 0 ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: invoiceData.lineItems.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '16.1px',
                  fontWeight: '500'
                }}
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ScrollablePageContainer>
  );
};

export default Invoices;