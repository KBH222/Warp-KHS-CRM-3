import { apiClient } from '../api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'WORKER';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'OWNER' | 'WORKER';
}

export interface ResetPasswordDto {
  password: string;
}

export const usersApi = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    return await apiClient.get('/api/users');
  },

  // Create a new user
  create: async (data: CreateUserDto): Promise<User> => {
    return await apiClient.post('/api/users', data);
  },

  // Reset user password
  resetPassword: async (userId: string, data: ResetPasswordDto): Promise<{ message: string }> => {
    return await apiClient.put(`/api/users/${userId}/reset-password`, data);
  },

  // Delete user
  delete: async (userId: string): Promise<{ message: string }> => {
    return await apiClient.delete(`/api/users/${userId}`);
  },
};