import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Invoices from '../pages/Invoices';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock data
const mockJobs = [
  {
    id: '1',
    title: 'Kitchen Remodel',
    customerName: 'John Doe',
    customerId: 'cust1',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'completed',
    price: 5000,
    workers: ['KBH']
  },
  {
    id: '2',
    title: 'Bathroom Renovation',
    customerName: 'Jane Smith',
    customerId: 'cust2',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'completed',
    price: 3000,
    workers: ['KBH']
  }
];

const mockInvoices = [
  {
    id: '1001',
    invoiceNumber: 'INV-1001',
    customer: 'John Doe',
    customerId: 'cust1',
    jobId: '1',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
    subtotal: 5000,
    tax: 400,
    total: 5400,
    lineItems: [
      { id: 1, description: 'Kitchen Remodel', quantity: 1, rate: 5000, amount: 5000 }
    ]
  },
  {
    id: '1002',
    invoiceNumber: 'INV-1002',
    customer: 'Jane Smith',
    customerId: 'cust2',
    jobId: '2',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
    status: 'sent',
    subtotal: 3000,
    tax: 240,
    total: 3240,
    lineItems: [
      { id: 2, description: 'Bathroom Renovation', quantity: 1, rate: 3000, amount: 3000 }
    ]
  }
];

describe('Invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'khs_crm_calendar_jobs') {
        return JSON.stringify(mockJobs);
      }
      if (key === 'khs_crm_invoices') {
        return JSON.stringify(mockInvoices);
      }
      return null;
    });
  });

  const renderInvoices = () => {
    return render(
      <BrowserRouter>
        <Invoices />
      </BrowserRouter>
    );
  };

  it('renders invoices page with header', () => {
    renderInvoices();
    
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('Manage invoices and payment tracking')).toBeInTheDocument();
  });

  it('displays new invoice button', () => {
    renderInvoices();
    
    const newInvoiceBtn = screen.getByText('+ New Invoice');
    expect(newInvoiceBtn).toBeInTheDocument();
  });

  it('shows filter buttons', () => {
    renderInvoices();
    
    expect(screen.getByText('All Invoices')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /draft.*0/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sent.*2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paid.*0/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /overdue.*1/i })).toBeInTheDocument();
  });

  it('displays invoice list', () => {
    renderInvoices();
    
    expect(screen.getByText('INV-1001')).toBeInTheDocument();
    expect(screen.getByText('INV-1002')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows correct invoice amounts', () => {
    renderInvoices();
    
    expect(screen.getByText('$5400.00')).toBeInTheDocument();
    expect(screen.getByText('$3240.00')).toBeInTheDocument();
  });

  it('displays overdue status correctly', () => {
    renderInvoices();
    
    // INV-1002 should be overdue
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('opens new invoice modal when button clicked', async () => {
    renderInvoices();
    
    const newInvoiceBtn = screen.getByText('+ New Invoice');
    fireEvent.click(newInvoiceBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });
  });

  it('filters invoices when filter buttons clicked', () => {
    renderInvoices();
    
    // Click overdue filter
    const overdueBtn = screen.getByRole('button', { name: /overdue.*1/i });
    fireEvent.click(overdueBtn);
    
    // Should only show INV-1002
    expect(screen.getByText('INV-1002')).toBeInTheDocument();
    expect(screen.queryByText('INV-1001')).not.toBeInTheDocument();
  });

  it('navigates to invoice detail when view clicked', () => {
    renderInvoices();
    
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/1001');
  });

  it('updates invoice status when send clicked', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'khs_crm_calendar_jobs') {
        return JSON.stringify(mockJobs);
      }
      if (key === 'khs_crm_invoices') {
        return JSON.stringify([
          { ...mockInvoices[0], status: 'draft' }
        ]);
      }
      return null;
    });
    
    renderInvoices();
    
    const sendBtn = screen.getByText('Send');
    fireEvent.click(sendBtn);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'khs_crm_invoices',
      expect.stringContaining('"status":"sent"')
    );
  });

  it('shows empty state when no invoices', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'khs_crm_invoices') {
        return JSON.stringify([]);
      }
      return JSON.stringify(mockJobs);
    });
    
    renderInvoices();
    
    expect(screen.getByText('No invoices found')).toBeInTheDocument();
    expect(screen.getByText('Create your first invoice to get started')).toBeInTheDocument();
  });

  it('deletes invoice when delete button clicked', () => {
    window.confirm = vi.fn(() => true);
    renderInvoices();
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this invoice?');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});