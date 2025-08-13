# Development Story 1.4: Role-Based Access Control

## Story Overview
**As an owner,**  
**I want different access levels for myself and my workers,**  
**so that workers only see what they need while I maintain full control.**

## Technical Implementation Details

### 1. Database Schema Updates for RBAC

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
  phone         String?
  isActive      Boolean   @default(true)
  isFirstLogin  Boolean   @default(true)
  createdBy     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  refreshTokens RefreshToken[]
  sessions      Session[]
  createdUsers  User[]    @relation("UserCreatedBy")
  creator       User?     @relation("UserCreatedBy", fields: [createdBy], references: [id])
  
  @@index([role])
  @@index([createdBy])
}

model Permission {
  id          String   @id @default(uuid())
  resource    String   // e.g., "customers", "jobs", "users"
  action      String   // e.g., "create", "read", "update", "delete"
  role        Role
  createdAt   DateTime @default(now())
  
  @@unique([resource, action, role])
  @@index([role])
}

// Seed data for permissions will be added via migration
```

### 2. Permission Service

#### backend/src/services/permission.service.ts
```typescript
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionCheck {
  resource: string;
  action: string;
  role: Role;
}

export class PermissionService {
  // Define role permissions matrix
  private static readonly PERMISSIONS: Record<Role, Record<string, string[]>> = {
    OWNER: {
      customers: ['create', 'read', 'update', 'delete'],
      jobs: ['create', 'read', 'update', 'delete', 'assign'],
      users: ['create', 'read', 'update', 'delete'],
      materials: ['create', 'read', 'update', 'delete'],
      reports: ['read', 'export'],
      settings: ['read', 'update'],
    },
    WORKER: {
      customers: ['read'],
      jobs: ['read', 'update:status'],
      users: ['read:self', 'update:self'],
      materials: ['read', 'update:check'],
      reports: [],
      settings: ['read:self'],
    },
  };

  async hasPermission(check: PermissionCheck): Promise<boolean> {
    const rolePermissions = PermissionService.PERMISSIONS[check.role];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[check.resource];
    if (!resourcePermissions) return false;

    // Check for exact match or wildcard
    return resourcePermissions.includes(check.action) || 
           resourcePermissions.includes(check.action.split(':')[0]);
  }

  async getUserPermissions(role: Role): Promise<Record<string, string[]>> {
    return PermissionService.PERMISSIONS[role] || {};
  }

  async canAccessResource(userId: string, resource: string, resourceId?: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // Owners can access everything
    if (user.role === Role.OWNER) return true;

    // Workers can only access assigned resources
    if (user.role === Role.WORKER && resourceId) {
      switch (resource) {
        case 'jobs':
          const job = await prisma.job.findFirst({
            where: {
              id: resourceId,
              assignedTo: {
                some: { id: userId },
              },
            },
          });
          return !!job;
        
        case 'customers':
          // Workers can view customers for their assigned jobs
          const customerJob = await prisma.job.findFirst({
            where: {
              customerId: resourceId,
              assignedTo: {
                some: { id: userId },
              },
            },
          });
          return !!customerJob;
        
        default:
          return false;
      }
    }

    return false;
  }
}
```

### 3. Enhanced Authorization Middleware

#### backend/src/middleware/rbac.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/permission.service';

interface RBACRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const permissionService = new PermissionService();

export const requirePermission = (resource: string, action: string) => {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const hasPermission = await permissionService.hasPermission({
      resource,
      action,
      role: req.user.role as any,
    });

    if (!hasPermission) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `You don't have permission to ${action} ${resource}`,
        },
      });
    }

    next();
  };
};

export const requireResourceAccess = (resourceType: string) => {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const resourceId = req.params.id;
    const canAccess = await permissionService.canAccessResource(
      req.user.userId,
      resourceType,
      resourceId
    );

    if (!canAccess) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You don\'t have access to this resource',
        },
      });
    }

    next();
  };
};
```

### 4. User Management Service

#### backend/src/services/user.service.ts
```typescript
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export class UserService {
  private readonly BCRYPT_ROUNDS = 12;

  async createUser(creatorId: string, userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    phone?: string;
  }) {
    // Only owners can create users
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { role: true },
    });

    if (!creator || creator.role !== Role.OWNER) {
      throw new Error('Only owners can create users');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, this.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        createdBy: creatorId,
        isFirstLogin: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      user,
      tempPassword,
    };
  }

  async updateUser(updaterId: string, userId: string, updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
  }) {
    const updater = await prisma.user.findUnique({
      where: { id: updaterId },
      select: { role: true },
    });

    // Workers can only update themselves
    if (updater?.role === Role.WORKER && updaterId !== userId) {
      throw new Error('Workers can only update their own profile');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword && !user.isFirstLogin) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
      },
    });
  }

  async listUsers(requesterId: string, filters?: {
    role?: Role;
    isActive?: boolean;
  }) {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });

    if (requester?.role !== Role.OWNER) {
      // Workers can only see themselves
      return prisma.user.findMany({
        where: { id: requesterId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          isActive: true,
        },
      });
    }

    // Owners can see all users
    return prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateTempPassword(): string {
    // Generate readable temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
```

### 5. User Management Routes

#### backend/src/routes/user.routes.ts
```typescript
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { UserService } from '../services/user.service';

const router = Router();
const userService = new UserService();

// Create user (owner only)
router.post('/',
  authenticate,
  requirePermission('users', 'create'),
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('role').isIn(['OWNER', 'WORKER']),
    body('phone').optional().isMobilePhone(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
      }

      const result = await userService.createUser(req.user.userId, req.body);
      
      res.status(201).json({
        user: result.user,
        tempPassword: result.tempPassword,
        message: 'User created successfully. Please share the temporary password securely.',
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'USER_CREATION_ERROR',
          message: error.message,
        },
      });
    }
  }
);

// List users
router.get('/',
  authenticate,
  requirePermission('users', 'read'),
  async (req: any, res) => {
    try {
      const users = await userService.listUsers(req.user.userId, req.query);
      res.json({ users });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch users',
        },
      });
    }
  }
);

// Update user
router.put('/:id',
  authenticate,
  [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('phone').optional().isMobilePhone(),
    body('isActive').optional().isBoolean(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
      }

      const user = await userService.updateUser(
        req.user.userId,
        req.params.id,
        req.body
      );
      
      res.json({ user });
    } catch (error: any) {
      res.status(403).json({
        error: {
          code: 'UPDATE_ERROR',
          message: error.message,
        },
      });
    }
  }
);

// Change password
router.post('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req: any, res) => {
    try {
      await userService.changePassword(
        req.user.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'PASSWORD_CHANGE_ERROR',
          message: error.message,
        },
      });
    }
  }
);

export default router;
```

### 6. Frontend Role-Based Components

#### frontend/src/components/RoleGuard.tsx
```typescript
import React from 'react';
import { useAuthStore } from '../stores/auth.store';

interface RoleGuardProps {
  allowedRoles: Array<'OWNER' | 'WORKER'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

#### frontend/src/hooks/usePermissions.ts
```typescript
import { useAuthStore } from '../stores/auth.store';

type Permission = {
  resource: string;
  action: string;
};

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    { resource: 'customers', action: 'create' },
    { resource: 'customers', action: 'read' },
    { resource: 'customers', action: 'update' },
    { resource: 'customers', action: 'delete' },
    { resource: 'jobs', action: 'create' },
    { resource: 'jobs', action: 'read' },
    { resource: 'jobs', action: 'update' },
    { resource: 'jobs', action: 'delete' },
    { resource: 'jobs', action: 'assign' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'materials', action: 'create' },
    { resource: 'materials', action: 'read' },
    { resource: 'materials', action: 'update' },
    { resource: 'materials', action: 'delete' },
  ],
  WORKER: [
    { resource: 'customers', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'jobs', action: 'update:status' },
    { resource: 'materials', action: 'read' },
    { resource: 'materials', action: 'update:check' },
  ],
};

export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.some(
      (p) => p.resource === resource && (p.action === action || p.action === action.split(':')[0])
    );
  };

  const can = (action: string, resource: string): boolean => {
    return hasPermission(resource, action);
  };

  return {
    can,
    hasPermission,
    isOwner: user?.role === 'OWNER',
    isWorker: user?.role === 'WORKER',
  };
};
```

### 7. Dashboard Views by Role

#### frontend/src/pages/Dashboard.tsx
```typescript
import React from 'react';
import { useAuthStore } from '../stores/auth.store';
import { OwnerDashboard } from '../components/OwnerDashboard';
import { WorkerDashboard } from '../components/WorkerDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return user.role === 'OWNER' ? <OwnerDashboard /> : <WorkerDashboard />;
};
```

#### frontend/src/components/OwnerDashboard.tsx
```typescript
import React from 'react';
import { Users, Briefcase, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OwnerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-semibold">12</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Workers</p>
              <p className="text-2xl font-semibold">5</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3">
          <Link
            to="/users/new"
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <span className="font-medium">Add New Worker</span>
            <Users className="w-5 h-5 text-gray-400" />
          </Link>
          
          <Link
            to="/jobs/new"
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <span className="font-medium">Create New Job</span>
            <Briefcase className="w-5 h-5 text-gray-400" />
          </Link>
          
          <Link
            to="/reports"
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <span className="font-medium">View Reports</span>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          <div className="p-4">
            <p className="text-sm">John Smith completed bathroom renovation</p>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
          <div className="p-4">
            <p className="text-sm">New material list added to Johnson project</p>
            <p className="text-xs text-gray-500">4 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### frontend/src/components/WorkerDashboard.tsx
```typescript
import React from 'react';
import { MapPin, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WorkerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs Today</h1>
      
      {/* Today's Jobs */}
      <div className="space-y-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">Kitchen Remodel - Johnson</h3>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>123 Main St, Springfield</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Started 8:00 AM</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Link
              to="/jobs/123/materials"
              className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              View Materials List
            </Link>
            <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Mark as Complete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 opacity-60">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">Bathroom Renovation - Smith</h3>
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Not Started</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>456 Oak Ave, Springfield</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Scheduled 2:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tomorrow Preview */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tomorrow's Schedule</h2>
        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No jobs scheduled for tomorrow</p>
        </div>
      </div>
    </div>
  );
};
```

### 8. First Login Password Change

#### frontend/src/pages/ChangePassword.tsx
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { api } from '../services/api.service';
import { Lock, AlertCircle } from 'lucide-react';

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="mt-2 text-gray-600">
            {user?.isFirstLogin 
              ? 'Please change your temporary password'
              : 'Update your password'}
          </p>
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
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                {user?.isFirstLogin ? 'Temporary Password' : 'Current Password'}
              </label>
              <div className="mt-1 relative">
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

## Definition of Done

### Required Outputs
1. **Role-Based Access**
   - [ ] Owner can access all features
   - [ ] Workers see limited navigation options
   - [ ] API endpoints enforce role permissions
   - [ ] UI components hidden based on role

2. **User Management**
   - [ ] Owners can create worker accounts
   - [ ] Temporary passwords generated
   - [ ] First login forces password change
   - [ ] Workers can update own profile only

3. **Dashboard Differentiation**
   - [ ] Owner dashboard shows full overview
   - [ ] Worker dashboard shows assigned jobs only
   - [ ] Navigation adapts to user role
   - [ ] Quick actions based on permissions

4. **Security**
   - [ ] Role checks on all protected routes
   - [ ] Resource-level access control
   - [ ] Audit trail for user creation
   - [ ] Secure temporary password generation

## Testing Requirements

### Manual Testing
1. **Owner Flows**
   - Create worker account
   - View all users and jobs
   - Access all menu items
   - Update any user profile

2. **Worker Flows**
   - Limited menu options visible
   - Only assigned jobs shown
   - Cannot access user management
   - Can only edit own profile

3. **Permission Testing**
   - Try accessing owner routes as worker
   - Verify 403 responses
   - Test resource-level permissions
   - Validate UI element hiding

### Automated Testing
1. Permission service unit tests
2. RBAC middleware tests
3. User service integration tests
4. E2E tests for role flows

## Estimated Effort
- **Story Points:** 13
- **Time Estimate:** 2-3 days
- **Complexity:** High (security critical)

## Dependencies
- Story 1.3 complete (authentication)
- User and Job models defined
- Frontend routing established

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Permission bypass | Critical | Thorough testing, code review |
| Role elevation | High | Server-side validation only |
| Complex permissions | Medium | Keep simple for MVP |
| First login UX | Low | Clear instructions, good UI |

## Notes for Developers
- Always check permissions server-side
- Never trust client-side role checks
- Log all permission denials
- Consider permission caching for performance
- Plan for more granular permissions later