import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import CustomersNew from '../CustomersNew';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('CustomersNew', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocation.href = '';
  });

  it('renders customers list', () => {
    render(<CustomersNew />);
    
    expect(screen.getByText(/Customers \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Davis')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<CustomersNew />);
    
    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or address...');
    expect(searchInput).toBeInTheDocument();
  });

  it('filters customers based on search term', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or address...');
    
    // Search for Sarah
    await user.type(searchInput, 'Sarah');
    
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Mike Davis')).not.toBeInTheDocument();
  });

  it('opens add customer modal when Add Customer button is clicked', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    const addButtons = screen.getAllByRole('button', { name: /Add Customer/i });
    const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
    await user.click(addButton!);
    
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
  });

  it('adds a new customer when form is submitted', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    // Open modal
    const addButtons = screen.getAllByRole('button', { name: /Add Customer/i });
    const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
    await user.click(addButton!);
    
    // Fill form
    await user.type(screen.getByLabelText('Name *'), 'John Doe');
    await user.type(screen.getByLabelText('Email *'), 'john@example.com');
    await user.type(screen.getByLabelText('Phone *'), '5551234567');
    await user.type(screen.getByLabelText('Street Address *'), '123 Test St');
    await user.type(screen.getByLabelText('Zip *'), '62701');
    await user.type(screen.getByLabelText('City *'), 'Springfield');
    await user.type(screen.getByLabelText('State *'), 'IL');
    
    // Submit form
    const submitButtons = screen.getAllByRole('button', { name: /Add Customer/i });
    const submitButton = submitButtons.find(button => button.getAttribute('type') === 'submit');
    await user.click(submitButton!);
    
    // Check customer was added
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('formats phone number as user types', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    // Open modal
    const addButtons = screen.getAllByRole('button', { name: /Add Customer/i });
    const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
    await user.click(addButton!);
    
    const phoneInput = screen.getByLabelText('Phone *') as HTMLInputElement;
    
    // Type phone number
    await user.type(phoneInput, '5551234567');
    
    // Check formatting
    expect(phoneInput.value).toBe('(555) 123-4567');
  });

  it('auto-populates city and state when valid zip is entered', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    // Open modal
    const addButtons = screen.getAllByRole('button', { name: /Add Customer/i });
    const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
    await user.click(addButton!);
    
    const zipInput = screen.getByLabelText('Zip *');
    const cityInput = screen.getByLabelText('City *') as HTMLInputElement;
    const stateInput = screen.getByLabelText('State *') as HTMLInputElement;
    
    // Type Springfield zip
    await user.type(zipInput, '62701');
    
    // Check auto-population
    expect(cityInput.value).toBe('Springfield');
    expect(stateInput.value).toBe('IL');
  });

  it('navigates to customer detail when customer is clicked', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    const customerCard = screen.getByText('Sarah Johnson').closest('.bg-white');
    await user.click(customerCard!);
    
    expect(mockNavigate).toHaveBeenCalledWith('/customers/1');
  });

  it('initiates phone call when call button is clicked', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    const callButton = screen.getAllByTitle('Call customer')[0];
    await user.click(callButton);
    
    expect(mockLocation.href).toBe('tel:5551234567');
  });

  it('initiates text message when text button is clicked', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    const textButton = screen.getAllByTitle('Text customer')[0];
    await user.click(textButton);
    
    expect(mockLocation.href).toBe('sms:5551234567');
  });

  it('closes modal when Cancel button is clicked', async () => {
    render(<CustomersNew />);
    const user = userEvent.setup();
    
    // Open modal
    const addButtons = screen.getAllByRole('button', { name: /Add Customer/i });
    const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
    await user.click(addButton!);
    
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    
    // Modal should be closed
    expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
  });

  it('displays customer notes when present', () => {
    render(<CustomersNew />);
    
    expect(screen.getByText('Note: Prefers morning appointments')).toBeInTheDocument();
    expect(screen.getByText('Note: Has two dogs')).toBeInTheDocument();
  });

  it('displays customer total spent and job count', () => {
    render(<CustomersNew />);
    
    expect(screen.getByText('$15,750')).toBeInTheDocument();
    expect(screen.getByText('3 jobs')).toBeInTheDocument();
    
    expect(screen.getByText('$8,500')).toBeInTheDocument();
    expect(screen.getByText('2 jobs')).toBeInTheDocument();
  });
});