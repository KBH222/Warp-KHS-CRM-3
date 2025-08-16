import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  // Auto-login for now
  async autoLogin(): Promise<{ token: string; user: any }> {
    try {
      // Try to login with default credentials
      const response = await api.post('/auth/login', {
        email: 'admin@khscrm.com',
        password: 'admin123'
      });
      
      const { accessToken, refreshToken, user } = response.data;
      const token = accessToken; // Backend returns accessToken, not token
      
      // Store tokens
      localStorage.setItem('khs-crm-token', token);
      localStorage.setItem('khs-crm-refresh-token', refreshToken);
      localStorage.setItem('khs-crm-user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      // If login fails, create a mock token for development
      const mockToken = 'dev-token-' + Date.now();
      const mockUser = {
        id: 'dev-user',
        email: 'dev@khscrm.com',
        name: 'Development User',
        role: 'OWNER'
      };
      
      localStorage.setItem('khs-crm-token', mockToken);
      localStorage.setItem('khs-crm-user', JSON.stringify(mockUser));
      
      return { token: mockToken, user: mockUser };
    }
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('khs-crm-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token
  getToken() {
    return localStorage.getItem('khs-crm-token');
  },

  // Logout
  logout() {
    localStorage.removeItem('khs-crm-token');
    localStorage.removeItem('khs-crm-refresh-token');
    localStorage.removeItem('khs-crm-user');
  }
};