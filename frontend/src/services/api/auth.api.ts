const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const authApi = {
  // Auto-login for now
  async autoLogin(): Promise<{ token: string; user: any }> {
    try {
      console.log('[AuthAPI] Attempting auto-login...');
      // Try to login with default credentials using fetch
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@khscrm.com',
          password: 'admin123'
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { token, refreshToken, user } = await response.json();
      console.log('[AuthAPI] Login successful, storing token...');
      
      // Store tokens
      localStorage.setItem('khs-crm-token', token);
      localStorage.setItem('khs-crm-refresh-token', refreshToken);
      localStorage.setItem('khs-crm-user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      console.error('[AuthAPI] Auto-login failed:', error);
      // If login fails, create a mock token for development
      const mockToken = 'dev-token-' + Date.now();
      const mockUser = {
        id: 'dev-user',
        email: 'dev@khscrm.com',
        name: 'Development User',
        role: 'OWNER'
      };
      
      console.log('[AuthAPI] Using mock token:', mockToken);
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