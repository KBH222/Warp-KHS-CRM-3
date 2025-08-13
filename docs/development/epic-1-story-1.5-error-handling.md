# Development Story 1.5: Error Handling and Monitoring

## Story Overview
**As a developer,**  
**I want comprehensive error tracking and monitoring,**  
**so that I can quickly identify and fix issues in production.**

## Technical Implementation Details

### 1. Error Types and Structure

#### shared/types/src/errors.ts
```typescript
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE = 'INVALID_STATE',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  stack?: string;
  timestamp: string;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
```

### 2. Custom Error Classes

#### backend/src/utils/errors.ts
```typescript
import { ErrorCode } from '@khs/shared/types';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ValidationError[]) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.ALREADY_EXISTS, message, 409);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, 422, details);
  }
}
```

### 3. Global Error Handler Middleware

#### backend/src/middleware/errorHandler.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ErrorCode } from '@khs/shared/types';
import * as Sentry from '@sentry/node';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate request ID if not present
  const requestId = req.headers['x-request-id'] as string || generateRequestId();

  // Log error with context
  logger.error('Request error', {
    error: err,
    requestId,
    method: req.method,
    url: req.url,
    userId: (req as any).user?.userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setTag('requestId', requestId);
      scope.setUser({
        id: (req as any).user?.userId,
        email: (req as any).user?.email,
      });
      scope.setContext('request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
      });
      Sentry.captureException(err);
    });
  }

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = handlePrismaError(err as any);
    return res.status(prismaError.statusCode).json({
      error: {
        code: prismaError.code,
        message: prismaError.message,
        requestId,
      },
    });
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: err.message,
        requestId,
      },
    });
  }

  // Default to internal server error
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message,
      requestId,
    },
  });
};

function handlePrismaError(error: any): AppError {
  switch (error.code) {
    case 'P2002':
      return new AppError(
        ErrorCode.ALREADY_EXISTS,
        'A record with this value already exists',
        409
      );
    case 'P2025':
      return new AppError(
        ErrorCode.NOT_FOUND,
        'Record not found',
        404
      );
    case 'P2003':
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid reference',
        400
      );
    default:
      return new AppError(
        ErrorCode.DATABASE_ERROR,
        'Database operation failed',
        500
      );
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### 4. Structured Logging

#### backend/src/utils/logger.ts
```typescript
import winston from 'winston';
import { Request } from 'express';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// JSON format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: isDevelopment ? devFormat : prodFormat,
  defaultMeta: { service: 'khs-crm-api' },
  transports: [
    new winston.transports.Console(),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

// Create child logger for specific contexts
export const createLogger = (context: string) => {
  return logger.child({ context });
};
```

### 5. Frontend Error Boundary

#### frontend/src/components/ErrorBoundary.tsx
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      eventId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Send to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({
      errorInfo,
      eventId,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. The error has been reported and we'll look into it.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details (development only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Go to Dashboard
              </button>
            </div>

            {this.state.eventId && (
              <p className="mt-4 text-xs text-gray-500">
                Error ID: {this.state.eventId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 6. API Error Handling Hook

#### frontend/src/hooks/useApiError.ts
```typescript
import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { ErrorCode } from '@khs/shared/types';

interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  requestId?: string;
}

export const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data?.error as ApiError;
      
      if (apiError) {
        setError(apiError);
        
        // Show user-friendly toast messages
        switch (apiError.code) {
          case ErrorCode.NETWORK_ERROR:
            toast.error('Network error. Please check your connection.');
            break;
          case ErrorCode.UNAUTHORIZED:
            toast.error('Please log in to continue.');
            break;
          case ErrorCode.FORBIDDEN:
            toast.error('You don\'t have permission to do that.');
            break;
          case ErrorCode.NOT_FOUND:
            toast.error('The requested resource was not found.');
            break;
          case ErrorCode.VALIDATION_ERROR:
            toast.error(apiError.message || 'Please check your input.');
            break;
          default:
            toast.error(apiError.message || 'An error occurred.');
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else if (!error.response) {
        toast.error('Unable to connect to server.');
      }
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    console.error('API Error:', error);
  }, []);

  const execute = useCallback(async <T,>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    execute,
    clearError,
  };
};
```

### 7. Monitoring Setup

#### backend/src/monitoring/sentry.ts
```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';

export const initSentry = (app: Express) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 0.1,
      beforeSend: (event) => {
        // Scrub sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        if (event.request?.headers) {
          delete event.request.headers.authorization;
        }
        return event;
      },
    });

    // Request handler must be first middleware
    app.use(Sentry.Handlers.requestHandler());
    
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }
};

export const initSentryErrorHandler = (app: Express) => {
  if (process.env.SENTRY_DSN) {
    // Error handler must be before any other error middleware
    app.use(Sentry.Handlers.errorHandler());
  }
};
```

#### frontend/src/monitoring/sentry.ts
```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initSentry = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          maskAllInputs: true,
        }),
      ],
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend: (event) => {
        // Don't send events in development
        if (import.meta.env.DEV) {
          console.log('Sentry event (dev):', event);
          return null;
        }
        return event;
      },
    });
  }
};
```

### 8. Health Check and Monitoring Endpoints

#### backend/src/routes/health.routes.ts
```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const router = Router();
const prisma = new PrismaClient();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const checks = {
    api: 'ok',
    database: 'checking',
    memory: 'checking',
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
  
  checks.memory = memoryUsagePercent > 90 ? 'warning' : 'ok';

  const allOk = Object.values(checks).every(status => status === 'ok');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    metrics: {
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
      },
      system: {
        loadAverage: os.loadavg(),
        freeMemory,
        totalMemory,
      },
    },
  });
});

// Metrics endpoint for monitoring
router.get('/metrics', (req, res) => {
  // This would typically export Prometheus metrics
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP nodejs_heap_size_total_bytes Process heap size from Node.js in bytes.
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes ${process.memoryUsage().heapTotal}

# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes.
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes ${process.memoryUsage().heapUsed}

# HELP nodejs_external_memory_bytes Node.js external memory size in bytes.
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${process.memoryUsage().external}

# HELP process_uptime_seconds Process uptime in seconds.
# TYPE process_uptime_seconds counter
process_uptime_seconds ${process.uptime()}
  `);
});

export default router;
```

### 9. Performance Monitoring

#### frontend/src/utils/performance.ts
```typescript
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  measureApiCall(endpoint: string, duration: number) {
    const key = `api_${endpoint}`;
    this.addMetric(key, duration);
  }

  measurePageLoad(pageName: string) {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.addMetric(`page_load_${pageName}`, navigation.loadEventEnd - navigation.loadEventStart);
      }
    }
  }

  measureComponentRender(componentName: string, duration: number) {
    this.addMetric(`render_${componentName}`, duration);
  }

  private addMetric(key: string, value: number) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    const values = this.metrics.get(key)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }

    // Log slow operations
    if (value > 1000) {
      console.warn(`Slow operation detected: ${key} took ${value}ms`);
    }
  }

  getMetrics() {
    const summary: Record<string, any> = {};
    
    this.metrics.forEach((values, key) => {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        summary[key] = {
          count: values.length,
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          median: sorted[Math.floor(sorted.length / 2)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          max: sorted[sorted.length - 1],
          min: sorted[0],
        };
      }
    });

    return summary;
  }

  sendToAnalytics() {
    const metrics = this.getMetrics();
    
    // Send to analytics service
    if (window.gtag) {
      Object.entries(metrics).forEach(([key, data]) => {
        window.gtag('event', 'performance', {
          event_category: 'Performance',
          event_label: key,
          value: Math.round(data.mean),
          custom_metrics: data,
        });
      });
    }
  }
}
```

## Definition of Done

### Required Outputs
1. **Error Handling**
   - [ ] Global error boundary in React
   - [ ] Consistent error format from API
   - [ ] User-friendly error messages
   - [ ] Error recovery mechanisms

2. **Logging**
   - [ ] Structured logging in backend
   - [ ] Request/response logging
   - [ ] Error context captured
   - [ ] Log rotation configured

3. **Monitoring**
   - [ ] Sentry integrated (frontend & backend)
   - [ ] Health check endpoints working
   - [ ] Performance metrics collected
   - [ ] Alerts configured for critical errors

4. **Developer Experience**
   - [ ] Clear error messages in development
   - [ ] Stack traces in dev mode only
   - [ ] Request IDs for tracing
   - [ ] Debugging tools configured

## Testing Requirements

### Manual Testing
1. **Error Scenarios**
   - Trigger network errors
   - Test with invalid tokens
   - Submit invalid form data
   - Access forbidden resources

2. **Monitoring**
   - Verify Sentry receives errors
   - Check health endpoints
   - Validate log output
   - Test error recovery

3. **Performance**
   - Monitor slow API calls
   - Check memory usage
   - Validate metric collection
   - Test under load

### Automated Testing
1. Error handler unit tests
2. Logger configuration tests
3. Health check endpoint tests
4. Error boundary component tests

## Estimated Effort
- **Story Points:** 8
- **Time Estimate:** 1-2 days
- **Complexity:** Medium

## Dependencies
- All previous stories complete
- Sentry account created
- Logging infrastructure ready

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Sensitive data in logs | High | Implement scrubbing, review carefully |
| Performance impact | Medium | Async logging, sampling |
| Alert fatigue | Medium | Tune thresholds, group similar errors |
| Storage costs | Low | Log rotation, retention policies |

## Notes for Developers
- Never log passwords or tokens
- Include request context in errors
- Use appropriate log levels
- Test error scenarios thoroughly
- Document known error codes