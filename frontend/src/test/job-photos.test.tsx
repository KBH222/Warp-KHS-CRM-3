import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JobPhotos from '../pages/JobPhotos';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock job data
const mockJob = {
  id: 'job123',
  title: 'Kitchen Remodel',
  customerName: 'Sarah Johnson',
  startDate: new Date(),
  endDate: new Date(),
  workers: ['KBH'],
  color: '#3B82F6'
};

describe('Job Photos', () => {
  const renderJobPhotos = () => {
    // Mock job in localStorage
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'khs_crm_calendar_jobs') {
        return JSON.stringify([mockJob]);
      }
      return null;
    });

    return render(
      <MemoryRouter initialEntries={[`/jobs/${mockJob.id}/photos`]}>
        <Routes>
          <Route path="/jobs/:id/photos" element={<JobPhotos />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job photos page with job details', () => {
    renderJobPhotos();
    
    expect(screen.getByText('Job Photos')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Remodel - Sarah Johnson')).toBeInTheDocument();
  });

  it('shows before, during, and after tabs', () => {
    renderJobPhotos();
    
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('During')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('shows empty state when no photos', () => {
    renderJobPhotos();
    
    expect(screen.getByText('No before photos yet')).toBeInTheDocument();
    expect(screen.getByText('Click "Upload Photos" to add some')).toBeInTheDocument();
  });

  it('opens upload modal when upload button clicked', async () => {
    renderJobPhotos();
    
    const uploadButton = screen.getByText('+ Upload Photos');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Before Photos')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    renderJobPhotos();
    
    // Click on "After" tab
    const afterTab = screen.getByText('After');
    fireEvent.click(afterTab);
    
    await waitFor(() => {
      expect(screen.getByText('No after photos yet')).toBeInTheDocument();
    });
  });

  it.skip('shows tab counts', async () => {
    // Mock photos in localStorage
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'khs_crm_calendar_jobs') {
        return JSON.stringify([mockJob]);
      }
      if (key === `job_photos_${mockJob.id}`) {
        return JSON.stringify({
          before: [{ id: 1, name: 'photo1.jpg', url: 'data:image/jpeg;base64,test', uploadDate: new Date().toISOString() }],
          during: [],
          after: []
        });
      }
      return null;
    });

    renderJobPhotos();
    
    // Wait for the component to load
    await waitFor(() => {
      const beforeTab = screen.getByText('Before');
      expect(beforeTab).toBeInTheDocument();
    });

    // Verify that the count badge "1" is displayed somewhere on the page
    const countBadge = await screen.findByText('1');
    expect(countBadge).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    renderJobPhotos();
    
    // Open upload modal
    fireEvent.click(screen.getByText('+ Upload Photos'));
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Click to select photos/i).parentElement.querySelector('input[type="file"]');
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null,
      result: 'data:image/jpeg;base64,test'
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    // Trigger file upload
    fireEvent.change(input, { target: { files: [file] } });
    
    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } });
    }
    
    // Check that localStorage was called to save the photo
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `job_photos_${mockJob.id}`,
        expect.stringContaining('test.jpg')
      );
    });
  });
});