import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Dashboard from '../DashboardEnhanced';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
  });

  it('renders all navigation cards', () => {
    render(<Dashboard />);
    
    // Check all navigation cards are present
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('View and manage customer information')).toBeInTheDocument();
    
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Track and manage ongoing projects')).toBeInTheDocument();
    
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Inventory and material tracking')).toBeInTheDocument();
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Account settings and preferences')).toBeInTheDocument();
  });

  it('navigates to customers page when Customers card is clicked', () => {
    render(<Dashboard />);
    
    const customersCard = screen.getByText('Customers').closest('button');
    customersCard!.click();
    
    expect(mockNavigate).toHaveBeenCalledWith('/customers');
  });

  it('navigates to jobs page when Jobs card is clicked', () => {
    render(<Dashboard />);
    
    const jobsCard = screen.getByText('Jobs').closest('button');
    jobsCard!.click();
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });

  it('navigates to materials page when Materials card is clicked', () => {
    render(<Dashboard />);
    
    const materialsCard = screen.getByText('Materials').closest('button');
    materialsCard!.click();
    
    expect(mockNavigate).toHaveBeenCalledWith('/materials');
  });

  it('navigates to profile page when Profile card is clicked', () => {
    render(<Dashboard />);
    
    const profileCard = screen.getByText('Profile').closest('button');
    profileCard!.click();
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('applies correct styling to cards', () => {
    render(<Dashboard />);
    
    // Check that cards have the correct background colors
    const customersCard = screen.getByText('Customers').closest('button');
    expect(customersCard).toHaveClass('bg-blue-500');
    
    const jobsCard = screen.getByText('Jobs').closest('button');
    expect(jobsCard).toHaveClass('bg-green-500');
    
    const materialsCard = screen.getByText('Materials').closest('button');
    expect(materialsCard).toHaveClass('bg-purple-500');
    
    const profileCard = screen.getByText('Profile').closest('button');
    expect(profileCard).toHaveClass('bg-gray-500');
  });

  it('cards have large touch targets', () => {
    render(<Dashboard />);
    
    const cards = screen.getAllByRole('heading', { level: 3 }).map(h => h.closest('button'));
    
    cards.forEach(card => {
      expect(card).toHaveClass('p-6');
      expect(card).toHaveStyle('min-height: 100px');
    });
  });
});