import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { Router } from '../../router';

// Mock auth store
vi.mock('../../stores/auth.store');

describe('App Integration Tests', () => {
  describe('Page Loading Tests', () => {
    it('loads dashboard page successfully', async () => {
      render(<Router />);
      
      await waitFor(() => {
        expect(screen.getByText(/Good (morning|afternoon|evening), Bruce!/)).toBeInTheDocument();
      });
      
      // Verify all navigation cards are present
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Workers')).toBeInTheDocument();
      expect(screen.getByText('Materials')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('loads customers page successfully', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Wait for dashboard to load
      await screen.findByText(/Good (morning|afternoon|evening), Bruce!/);
      
      // Navigate to customers
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      await waitFor(() => {
        expect(screen.getByText(/Customers \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search by name, email, phone, address, or notes...')).toBeInTheDocument();
      });
    });

    it('loads schedule page successfully', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Wait for dashboard to load
      await screen.findByText(/Good (morning|afternoon|evening), Bruce!/);
      
      // Navigate to schedule
      const scheduleCard = await screen.findByText('Schedule');
      await user.click(scheduleCard.closest('div[style*="cursor: pointer"]')!);
      
      await waitFor(() => {
        expect(screen.getByText('month')).toBeInTheDocument();
        expect(screen.getByText('week')).toBeInTheDocument();
        expect(screen.getByText('day')).toBeInTheDocument();
        expect(screen.getByText('gantt')).toBeInTheDocument();
      });
    });

    it('loads materials page successfully', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Wait for dashboard to load
      await screen.findByText(/Good (morning|afternoon|evening), Bruce!/);
      
      // Navigate to materials
      const materialsCard = await screen.findByText('Materials');
      await user.click(materialsCard.closest('div[style*="cursor: pointer"]')!);
      
      await waitFor(() => {
        expect(screen.getByText('Master Materials List')).toBeInTheDocument();
      });
    });

    it('loads profile page successfully', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Wait for dashboard to load
      await screen.findByText(/Good (morning|afternoon|evening), Bruce!/);
      
      // Navigate to profile
      const profileCard = await screen.findByText('Profile');
      await user.click(profileCard.closest('div[style*="cursor: pointer"]')!);
      
      await waitFor(() => {
        expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Tests', () => {
    it('navigates between pages correctly', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Start at dashboard
      expect(await screen.findByText(/Good (morning|afternoon|evening), Bruce!/)).toBeInTheDocument();
      
      // Navigate to customers
      const customersCard = screen.getByText('Customers').closest('div[style*="cursor: pointer"]')!;
      await user.click(customersCard);
      expect(await screen.findByText(/Customers \(\d+\)/)).toBeInTheDocument();
      
      // Verify we're on customers page
      expect(screen.getByPlaceholderText('Search by name, email, phone, address, or notes...')).toBeInTheDocument();
    });
  });

  describe('Button Functionality Tests', () => {
    it('Add Customer button opens modal', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Navigate to customers
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      // Wait for page to load
      await screen.findByText(/Customers \(\d+\)/);
      
      // Click Add Customer button
      const addButton = screen.getByRole('button', { name: /Add Customer/i });
      await user.click(addButton);
      
      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });
      
      // Check for form fields by placeholder
      expect(screen.getByPlaceholderText('Name *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Phone * (555) 123-4567')).toBeInTheDocument();
    });

    it('Cancel button closes modal', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Navigate to customers and open modal
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      const addButtons = await screen.findAllByRole('button', { name: /Add Customer/i });
      const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
      await user.click(addButton!);
      
      expect(await screen.findByText('Add New Customer')).toBeInTheDocument();
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);
      
      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
      });
    });

    it('Call and Text buttons have correct functionality', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Navigate to customers
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      await screen.findByText('Sarah Johnson');
      
      // Test call button
      const callButton = screen.getAllByTitle('Call customer')[0];
      expect(callButton).toBeInTheDocument();
      
      // Test text button
      const textButton = screen.getAllByTitle('Text customer')[0];
      expect(textButton).toBeInTheDocument();
    });
  });

  describe('Form Functionality Tests', () => {
    it('Customer form validates required fields', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Navigate to customers and open modal
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      const addButtons = await screen.findAllByRole('button', { name: /Add Customer/i });
      const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
      await user.click(addButton!);
      
      // Try to submit empty form
      const submitButtons = await screen.findAllByRole('button', { name: /Add Customer/i });
      const submitButton = submitButtons.find(button => button.getAttribute('type') === 'submit');
      await user.click(submitButton!);
      
      // Form should not close (still see the modal)
      expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    });

    it('Phone number auto-formats correctly', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Navigate to customers and open modal
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      const addButtons = await screen.findAllByRole('button', { name: /Add Customer/i });
      const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
      await user.click(addButton!);
      
      const phoneInput = await screen.findByPlaceholderText('Phone * (555) 123-4567') as HTMLInputElement;
      
      // Type phone number
      await user.type(phoneInput, '5551234567');
      
      // Check formatting
      expect(phoneInput.value).toBe('(555) 123-4567');
    });

    it('Zip code auto-populates city and state', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Navigate to customers and open modal
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      const addButtons = await screen.findAllByRole('button', { name: /Add Customer/i });
      const addButton = addButtons.find(button => button.getAttribute('type') !== 'submit');
      await user.click(addButton!);
      
      const zipInput = await screen.findByPlaceholderText('Zip *');
      const cityInput = screen.getByPlaceholderText('City *') as HTMLInputElement;
      const stateInput = screen.getByPlaceholderText('State *') as HTMLInputElement;
      
      // Type zip code
      await user.type(zipInput, '62701');
      
      // Verify auto-population
      await waitFor(() => {
        expect(cityInput.value).toBe('Springfield');
        expect(stateInput.value).toBe('IL');
      });
    });

    it('Search functionality filters customers', async () => {
      render(<Router />);
      const user = userEvent.setup();
      
      // Navigate to customers
      const customersCard = await screen.findByText('Customers');
      await user.click(customersCard.closest('div[style*="cursor: pointer"]')!);
      
      await screen.findByText('Sarah Johnson');
      expect(screen.getByText('Mike Davis')).toBeInTheDocument();
      
      // Search for Sarah
      const searchInput = screen.getByPlaceholderText('Search by name, email, phone, address, or notes...');
      await user.type(searchInput, 'Sarah');
      
      // Verify filtering
      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Mike Davis')).not.toBeInTheDocument();
      });
    });
  });
});