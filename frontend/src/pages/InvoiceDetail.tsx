import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    // Load invoice from localStorage
    const savedInvoices = localStorage.getItem('khs_crm_invoices');
    if (savedInvoices) {
      const invoices = JSON.parse(savedInvoices);
      const foundInvoice = invoices.find(inv => inv.id === id);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      }
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Simple download as text - in a real app, you'd generate a PDF
    const content = `
INVOICE ${invoice.invoiceNumber}

Bill To:
${invoice.customer}

Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

Line Items:
${invoice.lineItems.map(item => 
  `${item.description} - Qty: ${item.quantity} x $${item.rate} = $${item.amount.toFixed(2)}`
).join('\n')}

Subtotal: $${invoice.subtotal.toFixed(2)}
Tax (8%): $${invoice.tax.toFixed(2)}
Total: $${invoice.total.toFixed(2)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  if (!invoice) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <p style={{ textAlign: 'center', color: '#6B7280' }}>Loading invoice...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        '@media print': { display: 'none' }
      }}>
        <button
          onClick={() => navigate('/invoices')}
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
          ← Back to Invoices
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePrint}
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
            🖨️ Print
          </button>
          <button
            onClick={handleDownload}
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
            ⬇️ Download
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Company Header */}
        <div style={{ marginBottom: '40px', borderBottom: '2px solid #E5E7EB', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '36.8px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            KHS CRM
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>
            123 Business Street<br />
            City, State 12345<br />
            Phone: (555) 123-4567<br />
            Email: info@khscrm.com
          </p>
        </div>

        {/* Invoice Info */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '40px'
        }}>
          <div>
            <h2 style={{ fontSize: '23px', fontWeight: '600', margin: '0 0 12px 0' }}>
              Bill To:
            </h2>
            <p style={{ color: '#374151', margin: 0 }}>
              {invoice.customer}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '27.6px', fontWeight: '600', margin: '0 0 12px 0' }}>
              INVOICE
            </h2>
            <p style={{ color: '#374151', margin: '0 0 4px 0' }}>
              <strong>Invoice #:</strong> {invoice.invoiceNumber}
            </p>
            <p style={{ color: '#374151', margin: '0 0 4px 0' }}>
              <strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}
            </p>
            <p style={{ color: '#374151', margin: '0 0 12px 0' }}>
              <strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
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
          </div>
        </div>

        {/* Line Items */}
        <table style={{ width: '100%', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ 
                padding: '12px 0', 
                textAlign: 'left', 
                fontSize: '16.1px', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Description
              </th>
              <th style={{ 
                padding: '12px 0', 
                textAlign: 'center', 
                fontSize: '16.1px', 
                fontWeight: '600',
                color: '#374151',
                width: '80px'
              }}>
                Qty
              </th>
              <th style={{ 
                padding: '12px 0', 
                textAlign: 'right', 
                fontSize: '16.1px', 
                fontWeight: '600',
                color: '#374151',
                width: '100px'
              }}>
                Rate
              </th>
              <th style={{ 
                padding: '12px 0', 
                textAlign: 'right', 
                fontSize: '16.1px', 
                fontWeight: '600',
                color: '#374151',
                width: '100px'
              }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '16px 0', fontSize: '16.1px', color: '#374151' }}>
                  {item.description}
                </td>
                <td style={{ padding: '16px 0', fontSize: '16.1px', color: '#374151', textAlign: 'center' }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '16px 0', fontSize: '16.1px', color: '#374151', textAlign: 'right' }}>
                  ${item.rate.toFixed(2)}
                </td>
                <td style={{ padding: '16px 0', fontSize: '16.1px', color: '#374151', textAlign: 'right', fontWeight: '500' }}>
                  ${item.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginBottom: '40px'
        }}>
          <div style={{ width: '300px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <span style={{ fontSize: '16.1px', color: '#6B7280' }}>Subtotal:</span>
              <span style={{ fontSize: '16.1px', fontWeight: '500' }}>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '2px solid #E5E7EB'
            }}>
              <span style={{ fontSize: '16.1px', color: '#6B7280' }}>Tax (8%):</span>
              <span style={{ fontSize: '16.1px', fontWeight: '500' }}>${invoice.tax.toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '12px 0'
            }}>
              <span style={{ fontSize: '20.7px', fontWeight: '600' }}>Total:</span>
              <span style={{ fontSize: '20.7px', fontWeight: '600', color: '#3B82F6' }}>
                ${invoice.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ 
            backgroundColor: '#F9FAFB',
            padding: '20px',
            borderRadius: '6px',
            marginBottom: '40px'
          }}>
            <h3 style={{ fontSize: '16.1px', fontWeight: '600', margin: '0 0 8px 0' }}>
              Notes
            </h3>
            <p style={{ fontSize: '16.1px', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          paddingTop: '40px',
          borderTop: '1px solid #E5E7EB',
          color: '#6B7280',
          fontSize: '13.8px'
        }}>
          <p style={{ margin: '0 0 4px 0' }}>
            Thank you for your business!
          </p>
          <p style={{ margin: 0 }}>
            Please make payment by the due date. Late payments may incur additional charges.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;