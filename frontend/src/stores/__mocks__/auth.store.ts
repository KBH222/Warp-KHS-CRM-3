import { vi } from 'vitest';
// Inline type definitions
enum Role {
  OWNER = 'admin',
  MANAGER = 'manager',
  WORKER = 'worker'
}

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: Role.OWNER,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const useAuthStore = vi.fn(() => ({
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
}));

// Helper hooks
export const useAuth = vi.fn(() => ({
  user: mockUser,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}));

export const useUser = vi.fn(() => mockUser);

export const useIsOwner = vi.fn(() => true);

export const useIsWorker = vi.fn(() => false);