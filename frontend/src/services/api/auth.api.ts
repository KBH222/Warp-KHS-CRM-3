// Use relative path for Vercel deployment (same domain)
const API_URL = import.meta.env.VITE_API_URL || '';

export const authApi = {
  // Auto-login for now
  async autoLogin(): Promise<{ token: string; user: any }> {
    try {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Login failed: ${response.status}`);
      }

      const { token, refreshToken, user } = await response.json();
      
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