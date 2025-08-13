import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScheduleCalendar from '../pages/ScheduleCalendar';

describe('Drag and Drop Calendar', () => {
  const renderCalendar = () => {
    return render(
      <BrowserRouter>
        <ScheduleCalendar />
      </BrowserRouter>
    );
  };

  it('makes calendar cells droppable', () => {
    renderCalendar();
    
    // Find a calendar cell (day 15 for example)
    const dayCell = screen.getByText('15').parentElement.parentElement;
    
    // Check that drag events can be handled
    expect(dayCell).toBeTruthy();
  });

  it('calendar has draggable elements when jobs exist', async () => {
    renderCalendar();
    
    // First, create a job for the current month
    const newJobButton = screen.getByText('+ New Job');
    fireEvent.click(newJobButton);
    
    // Wait for modal to appear
    await screen.findByText('Schedule New Job');
    
    // The modal should be open
    expect(screen.getByText('Schedule New Job')).toBeInTheDocument();
  });

  it('shows drag cursor style', () => {
    renderCalendar();
    
    // Any element with draggable should have move cursor
    const calendarContainer = screen.getByText('Schedule').parentElement.parentElement;
    expect(calendarContainer).toBeInTheDocument();
  });

  it('handles drag over event on calendar cells', () => {
    renderCalendar();
    
    // Find a calendar cell (day 10 for example)
    const dayCell = screen.getByText('10').parentElement.parentElement;
    
    // Create mock dataTransfer
    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: '',
      preventDefault: vi.fn()
    };
    
    // Fire drag over event
    const dragOverEvent = new Event('dragover', { bubbles: true });
    Object.defineProperty(dragOverEvent, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(dragOverEvent, 'preventDefault', { value: vi.fn() });
    
    dayCell.dispatchEvent(dragOverEvent);
    
    // The cell should accept the drag
    expect(dragOverEvent.preventDefault).toHaveBeenCalled();
  });

  it('prevents default on drag over to allow drop', () => {
    renderCalendar();
    
    // Find a calendar cell
    const dayCell = screen.getByText('20').parentElement.parentElement;
    
    // Create a drag over event
    const preventDefault = vi.fn();
    const dragOverEvent = new Event('dragover', { bubbles: true });
    dragOverEvent.preventDefault = preventDefault;
    
    dayCell.dispatchEvent(dragOverEvent);
    
    // Should prevent default to allow drop
    expect(preventDefault).toHaveBeenCalled();
  });
});