// Use relative path for Vercel deployment (same domain)
const API_URL = import.meta.env.VITE_API_URL || '';

export const authApi = {
  // Login with credentials
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Invalid email or password');
    }

    const { token, refreshToken, user } = await response.json();
    
    // Store tokens
    localStorage.setItem('khs-crm-token', token);
    localStorage.setItem('khs-crm-refresh-token', refreshToken);
    localStorage.setItem('khs-crm-user', JSON.stringify(user));
    
    return { token, user };
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