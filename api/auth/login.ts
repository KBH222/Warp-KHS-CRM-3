import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, password } = req.body;
    
    // For now, return a mock token (same as backend)
    if (email === 'admin@khscrm.com' && password === 'admin123') {
      return res.status(200).json({
        token: 'mock-token-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
        user: {
          id: 'admin-id',
          email: 'admin@khscrm.com',
          name: 'Admin User',
          role: 'OWNER'
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}