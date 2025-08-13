import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Reports from '../pages/Reports';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

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
    workers: ['KBH', 'John']
  },
  {
    id: '2',
    title: 'Bathroom Renovation',
    customerName: 'Jane Smith',
    customerId: 'cust2',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'in-progress',
    price: 3000,
    workers: ['KBH']
  },
  {
    id: '3',
    title: 'Deck Installation',
    customerName: 'John Doe',
    customerId: 'cust1',
    startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    endDate: new Date(Date.now() - 86400000).toISOString(),
    status: 'pending',
    price: 2000,
    workers: ['John']
  }
];

const mockCustomers = [
  { id: 'cust1', name: 'John Doe' },
  { id: 'cust2', name: 'Jane Smith' }
];

describe('Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'khs_crm_calendar_jobs') {
        return JSON.stringify(mockJobs);
      }
      if (key === 'khs_crm_customers') {
        return JSON.stringify(mockCustomers);
      }
      return null;
    });
  });

  const renderReports = () => {
    return render(
      <BrowserRouter>
        <Reports />
      </BrowserRouter>
    );
  };

  it('renders reports page with header', () => {
    renderReports();
    
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    expect(screen.getByText('Track your business performance and insights')).toBeInTheDocument();
  });

  it('shows time range selector with default month view', () => {
    renderReports();
    
    const timeRangeSelect = screen.getByDisplayValue('This Month');
    expect(timeRangeSelect).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    renderReports();
    
    expect(screen.getByText('Total Jobs')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Active Customers')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
  });

  it('calculates correct totals', () => {
    renderReports();
    
    // Total jobs should be 3
    const totalJobsCard = screen.getByText('Total Jobs').closest('div');
    expect(totalJobsCard).toHaveTextContent('3');
    
    // Total revenue should be $10,000 (5000 + 3000 + 2000)
    const revenueCard = screen.getByText('Total Revenue').closest('div');
    expect(revenueCard).toHaveTextContent('$10,000');
  });

  it('shows job status breakdown', () => {
    renderReports();
    
    expect(screen.getByText('Job Status Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays jobs by worker', () => {
    renderReports();
    
    expect(screen.getByText('Jobs by Worker')).toBeInTheDocument();
    expect(screen.getByText('KBH')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('shows top customers', () => {
    renderReports();
    
    expect(screen.getByText('Top Customers')).toBeInTheDocument();
    // John Doe should appear with 2 jobs
    const johnDoe = screen.getByText('John Doe');
    expect(johnDoe).toBeInTheDocument();
    expect(johnDoe.closest('div')).toHaveTextContent('2 jobs');
  });

  it('changes date range when time range is changed', () => {
    renderReports();
    
    const timeRangeSelect = screen.getByDisplayValue('This Month');
    
    // Change to week view
    fireEvent.change(timeRangeSelect, { target: { value: 'week' } });
    expect(timeRangeSelect).toHaveValue('week');
    
    // Change to custom range
    fireEvent.change(timeRangeSelect, { target: { value: 'custom' } });
    
    // Should show date inputs - check by type attribute
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
  });

  it('filters jobs by date range', () => {
    renderReports();
    
    // Verify initial state shows 3 jobs
    let totalJobsCard = screen.getByText('Total Jobs').closest('div');
    expect(totalJobsCard).toHaveTextContent('3');
    
    // Change to year range to ensure all jobs are included
    const timeRangeSelect = screen.getByDisplayValue('This Month');
    fireEvent.change(timeRangeSelect, { target: { value: 'year' } });
    
    // Should still show 3 jobs
    totalJobsCard = screen.getByText('Total Jobs').closest('div');
    expect(totalJobsCard).toHaveTextContent('3');
  });

  it('shows empty state when no data', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderReports();
    
    expect(screen.getByText('No worker data available')).toBeInTheDocument();
    expect(screen.getByText('No customer data available')).toBeInTheDocument();
  });
});