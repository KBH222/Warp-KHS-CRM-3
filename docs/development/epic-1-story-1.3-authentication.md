# Development Story 1.3: Authentication System with JWT

## Story Overview
**As an owner or worker,**  
**I want to securely log into the system with my credentials,**  
**so that I can access my authorized features and data.**

## Technical Implementation Details

### 1. Database Schema Updates

#### Prisma Schema Additions
```prisma
// backend/prisma/schema.prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  role          Role
  firstName     String
  lastName      String
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  refreshTokens RefreshToken[]
  sessions      Session[]
}

model RefreshToken {
  id            String    @id @default(uuid())
  token         String    @unique @db.Text
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}

model Session {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent     String?
  ipAddress     String?
  lastActivity  DateTime  @default(now())
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}

enum Role {
  OWNER
  WORKER
}
```

### 2. Backend Authentication Service

#### backend/src/services/auth.service.ts
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;
  private readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '30d';
  private readonly BCRYPT_ROUNDS = 12;

  async register(email: string, password: string, role: Role, firstName: string, lastName: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
      },
    });

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = await this.generateTokens(user, rememberMe);
    
    await this.createSession(user.id);
    
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET) as TokenPayload;
      
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      if (!storedToken.user.isActive) {
        throw new Error('User account is disabled');
      }

      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      return this.generateTokens(storedToken.user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId },
      });
    }

    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private async generateTokens(user: any, rememberMe: boolean = false): Promise<AuthTokens> {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const refreshTokenExpiry = rememberMe ? '30d' : '7d';
    const refreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: refreshTokenExpiry,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    await this.cleanupExpiredTokens(user.id);

    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, userAgent?: string, ipAddress?: string) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.session.create({
      data: {
        userId,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  }

  private async cleanupExpiredTokens(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
```

### 3. Authentication Middleware

#### backend/src/middleware/auth.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const authService = new AuthService();

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'No token provided' 
        } 
      });
    }

    const token = authHeader.substring(7);
    const payload = await authService.validateAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Invalid token' 
      } 
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Not authenticated' 
        } 
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions' 
        } 
      });
    }

    next();
  };
};
```

### 4. Authentication Routes

#### backend/src/routes/auth.routes.ts
```typescript
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const authService = new AuthService();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: { 
        code: 'VALIDATION_ERROR', 
        message: 'Invalid input', 
        details: errors.array() 
      } 
    });
  }
  next();
};

// Login endpoint
router.post('/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().trim(),
    body('rememberMe').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      const result = await authService.login(email, password, rememberMe);
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
      });
      
      res.json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      res.status(401).json({ 
        error: { 
          code: 'INVALID_CREDENTIALS', 
          message: 'Invalid email or password' 
        } 
      });
    }
  }
);

// Refresh token endpoint
router.post('/refresh',
  async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ 
          error: { 
            code: 'NO_REFRESH_TOKEN', 
            message: 'Refresh token not provided' 
          } 
        });
      }
      
      const tokens = await authService.refreshAccessToken(refreshToken);
      
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      
      res.json({ accessToken: tokens.accessToken });
    } catch (error) {
      res.status(401).json({ 
        error: { 
          code: 'INVALID_REFRESH_TOKEN', 
          message: 'Invalid refresh token' 
        } 
      });
    }
  }
);

// Logout endpoint
router.post('/logout',
  authenticate,
  async (req: any, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      await authService.logout(req.user.userId, refreshToken);
      
      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ 
        error: { 
          code: 'LOGOUT_ERROR', 
          message: 'Error during logout' 
        } 
      });
    }
  }
);

// Get current user
router.get('/me',
  authenticate,
  async (req: any, res) => {
    res.json({ user: req.user });
  }
);

export default router;
```

### 5. Frontend Authentication Store

#### frontend/src/stores/auth.store.ts
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../services/api.service';

interface User {
  id: string;
  email: string;
  role: 'OWNER' | 'WORKER';
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string, rememberMe: boolean) => {
        try {
          const response = await api.post('/auth/login', { email, password, rememberMe });
          const { user, accessToken } = response.data;
          
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          
          delete api.defaults.headers.common['Authorization'];
        }
      },

      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh');
          const { accessToken } = response.data;
          
          set({ accessToken });
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      checkAuth: async () => {
        const state = get();
        if (!state.accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
          const response = await api.get('/auth/me');
          set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          await get().refreshToken();
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);
```

### 6. Frontend Login Component

#### frontend/src/pages/Login.tsx
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">KHS CRM</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me for 30 days
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

### 7. API Interceptor for Token Refresh

#### frontend/src/services/api.service.ts
```typescript
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await useAuthStore.getState().refreshToken();
        const newToken = useAuthStore.getState().accessToken;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

### 8. Protected Route Component

#### frontend/src/components/ProtectedRoute.tsx
```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

## Definition of Done

### Required Outputs
1. **Authentication Flow**
   - [ ] Login page with email/password fields
   - [ ] Remember Me functionality working (30 days)
   - [ ] Logout clears all tokens and sessions
   - [ ] Auto-refresh of access tokens

2. **Security Implementation**
   - [ ] Passwords hashed with bcrypt (12 rounds)
   - [ ] JWT tokens properly signed and validated
   - [ ] Refresh tokens stored securely
   - [ ] Rate limiting on login (5 attempts/minute)

3. **Session Management**
   - [ ] Access tokens expire in 15 minutes
   - [ ] Refresh tokens expire based on Remember Me
   - [ ] Sessions persist across app restarts
   - [ ] Multiple device sessions supported

4. **Error Handling**
   - [ ] Clear error messages for invalid credentials
   - [ ] Rate limit error messages
   - [ ] Token expiry handled gracefully
   - [ ] Network errors handled

## Testing Requirements

### Manual Testing
1. **Login Flow**
   - Valid credentials log in successfully
   - Invalid credentials show error
   - Remember Me extends session to 30 days
   - Rate limiting after 5 attempts

2. **Token Management**
   - Access token refreshes automatically
   - Expired refresh token redirects to login
   - Logout clears all tokens
   - Multiple tabs stay in sync

3. **Security Testing**
   - Passwords not visible in network logs
   - Tokens not accessible via JavaScript
   - HTTPS enforced in production
   - XSS/CSRF protections working

### Automated Testing
1. Unit tests for auth service
2. Integration tests for auth endpoints
3. E2E tests for login/logout flow
4. Security tests for token validation

## Estimated Effort
- **Story Points:** 13
- **Time Estimate:** 2-3 days
- **Complexity:** High (security critical)

## Dependencies
- Story 1.1 complete (database setup)
- Environment variables configured
- HTTPS certificates for production

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Token theft | Critical | HttpOnly cookies, HTTPS, short expiry |
| Brute force attacks | High | Rate limiting, account lockout |
| Session hijacking | High | Secure cookies, IP validation |
| Password compromise | Critical | Strong hashing, password requirements |

## Notes for Developers
- Never log passwords or tokens
- Always use HTTPS in production
- Test with multiple devices/browsers
- Consider 2FA in future iteration
- Document security decisions