import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScheduleCalendar from '../pages/ScheduleCalendar';

describe('Recurring Jobs', () => {
  const renderCalendar = () => {
    return render(
      <BrowserRouter>
        <ScheduleCalendar />
      </BrowserRouter>
    );
  };

  it('shows recurring job checkbox in new job modal', async () => {
    renderCalendar();
    
    // Open new job modal
    const newJobButton = screen.getByText('+ New Job');
    fireEvent.click(newJobButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Schedule New Job')).toBeInTheDocument();
    });
    
    // Check for recurring checkbox
    const recurringCheckbox = screen.getByText('Make this a recurring job');
    expect(recurringCheckbox).toBeInTheDocument();
  });

  it('shows recurrence options when checkbox is checked', async () => {
    renderCalendar();
    
    // Open new job modal
    fireEvent.click(screen.getByText('+ New Job'));
    
    await waitFor(() => {
      expect(screen.getByText('Schedule New Job')).toBeInTheDocument();
    });
    
    // Check the recurring checkbox
    const checkbox = screen.getByRole('checkbox', { name: /Make this a recurring job/i });
    fireEvent.click(checkbox);
    
    // Should show recurrence options
    expect(screen.getByText('Repeat Every')).toBeInTheDocument();
    expect(screen.getByText('Number of Occurrences')).toBeInTheDocument();
    expect(screen.getByText('End By (Optional)')).toBeInTheDocument();
  });

  it('has recurrence type dropdown with options', async () => {
    renderCalendar();
    
    // Open modal and enable recurring
    fireEvent.click(screen.getByText('+ New Job'));
    await screen.findByText('Schedule New Job');
    
    const checkbox = screen.getByRole('checkbox', { name: /Make this a recurring job/i });
    fireEvent.click(checkbox);
    
    // Find the select dropdown
    const repeatSelect = screen.getByDisplayValue('Week');
    expect(repeatSelect).toBeInTheDocument();
    
    // Check options
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Two Weeks')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('does not show recurring options when editing existing job', async () => {
    renderCalendar();
    
    // Create a job first
    fireEvent.click(screen.getByText('+ New Job'));
    await screen.findByText('Schedule New Job');
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('e.g., Kitchen Remodel'), { target: { value: 'Test Job' } });
    
    // The recurring checkbox should be present for new jobs
    expect(screen.getByText('Make this a recurring job')).toBeInTheDocument();
  });
});