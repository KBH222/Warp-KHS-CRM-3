import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScheduleCalendar from '../pages/ScheduleCalendar';

describe('Calendar Views', () => {
  const renderCalendar = () => {
    return render(
      <BrowserRouter>
        <ScheduleCalendar />
      </BrowserRouter>
    );
  };

  it('renders month view by default', () => {
    renderCalendar();
    
    // Check for weekday headers
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('switches to week view when clicked', () => {
    renderCalendar();
    
    // Click week button
    const weekButton = screen.getByText('week');
    fireEvent.click(weekButton);
    
    // Check for time slots (8 AM should be visible)
    expect(screen.getByText('8 AM')).toBeInTheDocument();
  });

  it('switches to day view when clicked', () => {
    renderCalendar();
    
    // Click day button
    const dayButton = screen.getByText('day');
    fireEvent.click(dayButton);
    
    // Check for more detailed time slots (8:00 AM should be visible)
    expect(screen.getByText('8:00 AM')).toBeInTheDocument();
    expect(screen.getByText('+ Add Job')).toBeInTheDocument();
  });

  it('shows view switcher buttons', () => {
    renderCalendar();
    
    expect(screen.getByText('month')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
  });
});