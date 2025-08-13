// User and Authentication Types
export enum Role {
  OWNER = 'OWNER',
  WORKER = 'WORKER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address: string;
  notes?: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  jobs?: Job[];
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address: string;
  notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  isArchived?: boolean;
}

// Job Types
export enum JobStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_MATERIALS = 'WAITING_ON_MATERIALS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
}

export interface Job {
  id: string;
  title: string;
  description?: string | null;
  status: JobStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  notes?: string | null;
  customerId: string;
  customer?: Customer;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  assignments?: JobAssignment[];
  materials?: Material[];
  statusHistory?: JobStatusHistory[];
}

export interface CreateJobRequest {
  title: string;
  description?: string;
  customerId: string;
  status?: JobStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  assignedUserIds?: string[];
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: string;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  userId: string;
  user?: User;
  assignedAt: Date;
}

export interface JobStatusHistory {
  id: string;
  jobId: string;
  fromStatus?: JobStatus | null;
  toStatus: JobStatus;
  changedBy: string;
  changedAt: Date;
}

// Material Types
export interface Material {
  id: string;
  jobId: string;
  itemName: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  notes?: string | null;
  addedById: string;
  addedBy?: User;
  purchasedById?: string | null;
  purchasedBy?: User | null;
  purchasedAt?: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialRequest {
  jobId: string;
  itemName: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface UpdateMaterialRequest {
  id: string;
  itemName?: string;
  quantity?: number;
  unit?: string;
  purchased?: boolean;
  notes?: string;
}

export interface BulkUpdateMaterialsRequest {
  jobId: string;
  materialIds: string[];
  purchased: boolean;
}

// Sync Types
export interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'job' | 'material';
  entityId?: string;
  payload: any;
  timestamp: Date;
}

export interface SyncStatus {
  lastSyncAt?: Date;
  pendingOperations: number;
  syncInProgress: boolean;
  errors: SyncError[];
}

export interface SyncError {
  operationId: string;
  error: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter and Query Types
export interface CustomerFilters {
  search?: string;
  isArchived?: boolean;
}

export interface JobFilters {
  status?: JobStatus | JobStatus[];
  customerId?: string;
  assignedUserId?: string;
  startDate?: { from?: Date; to?: Date };
  search?: string;
}

export interface MaterialFilters {
  jobId?: string;
  purchased?: boolean;
  search?: string;
}

// Dashboard Types
export interface DashboardStats {
  activeJobs: number;
  completedJobsThisWeek: number;
  pendingMaterials: number;
  assignedWorkers: number;
}

export interface WorkerTask {
  jobId: string;
  jobTitle: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  notes?: string;
  status: JobStatus;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: any;
  userId: string;
  user?: User;
  jobId?: string;
  createdAt: Date;
}