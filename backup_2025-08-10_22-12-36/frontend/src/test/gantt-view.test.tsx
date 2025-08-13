import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScheduleCalendar from '../pages/ScheduleCalendar';

describe('Gantt Chart View', () => {
  const renderCalendar = () => {
    return render(
      <BrowserRouter>
        <ScheduleCalendar />
      </BrowserRouter>
    );
  };

  it('switches to gantt view when clicked', () => {
    renderCalendar();
    
    // Click gantt button
    const ganttButton = screen.getByText('gantt');
    fireEvent.click(ganttButton);
    
    // Check for Gantt chart header
    expect(screen.getByText(/Gantt Chart/)).toBeInTheDocument();
    expect(screen.getByText('Worker')).toBeInTheDocument();
  });

  it('displays worker rows in gantt view', () => {
    renderCalendar();
    
    // Switch to gantt view
    const ganttButton = screen.getByText('gantt');
    fireEvent.click(ganttButton);
    
    // Check for workers - using getAllByText since they appear in multiple places
    expect(screen.getAllByText('KBH').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ISA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TYL').length).toBeGreaterThan(0);
  });

  it('shows view switcher includes gantt option', () => {
    renderCalendar();
    
    expect(screen.getByText('month')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
    expect(screen.getByText('gantt')).toBeInTheDocument();
  });
});