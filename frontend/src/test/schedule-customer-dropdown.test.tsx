import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScheduleCalendar from '../pages/ScheduleCalendar';

describe('Schedule Calendar Customer Dropdown', () => {
  const renderCalendar = () => {
    return render(
      <BrowserRouter>
        <ScheduleCalendar />
      </BrowserRouter>
    );
  };

  it('shows customer dropdown when creating new job', async () => {
    renderCalendar();
    
    // Click the New Job button
    const newJobButton = screen.getByText('+ New Job');
    fireEvent.click(newJobButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Schedule New Job')).toBeInTheDocument();
    });
    
    // Find the customer dropdown
    const customerSelect = screen.getByRole('combobox');
    expect(customerSelect).toBeInTheDocument();
    
    // Check that it has options
    const options = customerSelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(1); // At least placeholder + 1 customer
  });

  it('allows selecting a customer from dropdown', async () => {
    renderCalendar();
    
    // Open new job modal
    fireEvent.click(screen.getByText('+ New Job'));
    
    await waitFor(() => {
      expect(screen.getByText('Schedule New Job')).toBeInTheDocument();
    });
    
    // Get the customer dropdown
    const customerSelect = screen.getByRole('combobox');
    
    // Change the selection
    fireEvent.change(customerSelect, { target: { value: '1' } });
    
    // Verify the value changed
    expect(customerSelect.value).toBe('1');
  });

  it('shows customer names in dropdown options', async () => {
    renderCalendar();
    
    // Open new job modal
    fireEvent.click(screen.getByText('+ New Job'));
    
    await waitFor(() => {
      expect(screen.getByText('Schedule New Job')).toBeInTheDocument();
    });
    
    // Check for customer names
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Davis')).toBeInTheDocument();
  });
});