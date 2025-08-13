# KHS Construction & Remodeling CRM - Technical Architecture

## Executive Summary

The KHS CRM is designed as an offline-first Progressive Web App (PWA) that enables construction professionals to manage customer information, jobs, and materials from the field. The architecture prioritizes mobile performance, offline reliability, and data synchronization while maintaining simplicity for a small development team.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │   Mobile PWA     │    │   Tablet PWA     │    │  Desktop Web │ │
│  │  (Primary)       │    │  (Secondary)     │    │  (Admin)     │ │
│  └────────┬─────────┘    └────────┬─────────┘    └──────┬───────┘ │
│           │                       │                       │         │
│  ┌────────┴───────────────────────┴───────────────────────┴──────┐ │
│  │                    Service Worker Layer                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐   │ │
│  │  │   Caching   │  │   Offline   │  │  Background Sync   │   │ │
│  │  │   Strategy  │  │   Queue     │  │                    │   │ │
│  │  └─────────────┘  └─────────────┘  └────────────────────┘   │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                               │                                     │
│  ┌────────────────────────────┴──────────────────────────────────┐ │
│  │                     Local Storage Layer                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐   │ │
│  │  │  IndexedDB  │  │ LocalStorage│  │   Session Storage  │   │ │
│  │  │  (Main DB)  │  │  (Settings) │  │   (Temp Data)      │   │ │
│  │  └─────────────┘  └─────────────┘  └────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │ HTTPS
┌─────────────────────────────────────┴───────────────────────────────┐
│                           API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │   Nginx/    │  │    Rate     │  │    CORS     │  │    SSL    │ │
│  │  CloudFront │  │   Limiting  │  │   Handler   │  │ Termination│ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
└─────────┴────────────────┴─────────────────┴───────────────┴───────┘
                                      │
┌─────────────────────────────────────┴───────────────────────────────┐
│                         Application Layer                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────┐ │
│  │  Auth Service  │  │  API Service   │  │   Sync Service        │ │
│  │  - JWT Auth    │  │  - REST APIs   │  │   - Conflict Res.    │ │
│  │  - RBAC        │  │  - Validation  │  │   - Queue Processing │ │
│  └────────────────┘  └────────────────┘  └───────────────────────┘ │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────┐ │
│  │Customer Service│  │  Job Service   │  │  Material Service     │ │
│  │  - CRUD Ops    │  │  - Workflow    │  │   - Checklist Mgmt   │ │
│  │  - Search      │  │  - Assignment  │  │   - Bulk Updates     │ │
│  └────────────────┘  └────────────────┘  └───────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
┌─────────────────────────────────────┴───────────────────────────────┐
│                          Data Layer                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐        ┌─────────────────────┐            │
│  │    PostgreSQL       │        │      Redis         │            │
│  │  ┌───────────────┐  │        │  ┌───────────────┐ │            │
│  │  │   Customers   │  │        │  │   Sessions    │ │            │
│  │  ├───────────────┤  │        │  ├───────────────┤ │            │
│  │  │     Jobs      │  │        │  │     Cache     │ │            │
│  │  ├───────────────┤  │        │  ├───────────────┤ │            │
│  │  │   Materials   │  │        │  │  Rate Limits  │ │            │
│  │  ├───────────────┤  │        │  └───────────────┘ │            │
│  │  │     Users     │  │        └─────────────────────┘            │
│  │  ├───────────────┤  │                                           │
│  │  │  Sync Queue   │  │        ┌─────────────────────┐            │
│  │  └───────────────┘  │        │     S3 Bucket      │            │
│  └─────────────────────┘        │   (File Storage)   │            │
│                                  └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Architecture Principles

### 1. Offline-First Design
- **Local-First Data**: All data operations work against local IndexedDB first
- **Optimistic Updates**: UI updates immediately, sync happens in background
- **Queue-Based Sync**: Failed operations queued for retry when online
- **Conflict Resolution**: Server timestamp wins, owner changes prioritized

### 2. Mobile-First Implementation
- **Progressive Enhancement**: Core features work on basic devices
- **Touch-Optimized**: 48px minimum touch targets
- **One-Handed Operation**: Bottom navigation, thumb-reach design
- **Performance Budget**: < 500KB initial bundle, < 3s first load

### 3. Security by Design
- **Zero Trust**: Every request authenticated and authorized
- **Defense in Depth**: Multiple security layers
- **Data Encryption**: At rest and in transit
- **Principle of Least Privilege**: Role-based access control

### 4. Scalability Considerations
- **Stateless Services**: Horizontal scaling ready
- **Database Indexing**: Optimized for common queries
- **Caching Strategy**: Multi-level caching
- **CDN Distribution**: Static assets globally distributed

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript 5
- **State Management**: Zustand for global state
- **Offline Storage**: IndexedDB via idb library
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite 5
- **PWA**: Workbox 7 for service workers
- **Testing**: Vitest + React Testing Library

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express 4 with TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod for schema validation
- **Testing**: Vitest + Supertest

### Infrastructure
- **Cloud Provider**: AWS
- **Frontend Hosting**: S3 + CloudFront
- **Backend Hosting**: ECS Fargate
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch + Sentry

### Development Tools
- **Version Control**: Git with GitHub
- **Package Manager**: npm workspaces
- **Code Quality**: ESLint + Prettier
- **API Documentation**: OpenAPI 3.0
- **Development Environment**: Docker Compose

## Monorepo Structure

```
khs-crm/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── packages/
│   ├── frontend/          # React PWA application
│   │   ├── src/
│   │   │   ├── components/    # UI components
│   │   │   ├── features/      # Feature modules
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── services/      # API & offline services
│   │   │   ├── stores/        # Zustand stores
│   │   │   ├── utils/         # Utilities
│   │   │   └── workers/       # Service workers
│   │   └── public/           # Static assets
│   ├── backend/           # Express API server
│   │   ├── src/
│   │   │   ├── modules/       # Feature modules
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── services/      # Business logic
│   │   │   ├── utils/         # Utilities
│   │   │   └── workers/       # Background jobs
│   │   └── prisma/           # Database schema
│   └── shared/            # Shared packages
│       ├── types/            # TypeScript types
│       ├── constants/        # Shared constants
│       └── utils/            # Shared utilities
├── infrastructure/        # IaC and deployment
│   ├── terraform/           # AWS infrastructure
│   └── docker/              # Docker configs
└── docs/                  # Documentation
    ├── api/                # API documentation
    ├── architecture/       # Architecture docs
    └── guides/             # User guides
```

## Data Architecture

### Primary Database (PostgreSQL)

```sql
-- Core domain model relationships
Users (1) ─── (M) Jobs (M) ─── (1) Customers
  │                │
  │                └──── (M) Materials
  │                │
  │                └──── (M) JobAssignments
  │
  └──── (M) RefreshTokens
  └──── (M) ActivityLogs
  └──── (M) SyncQueue
```

### Offline Storage (IndexedDB)

```typescript
interface OfflineDatabase {
  customers: {
    key: string;  // customerId
    value: Customer;
    indexes: ['name', 'phone', 'updatedAt'];
  };
  jobs: {
    key: string;  // jobId
    value: Job;
    indexes: ['status', 'customerId', 'updatedAt'];
  };
  materials: {
    key: string;  // materialId
    value: Material;
    indexes: ['jobId', 'purchased', 'updatedAt'];
  };
  syncQueue: {
    key: string;  // operationId
    value: SyncOperation;
    indexes: ['timestamp', 'status'];
  };
  metadata: {
    key: string;
    value: any;  // lastSync, schemaVersion, etc.
  };
}
```

### Cache Layer (Redis)

```
Sessions:     session:{sessionId} → User data (TTL: 30 days)
Auth:         refresh:{tokenId} → Refresh token data
Rate Limit:   rate:{userId}:{endpoint} → Request count
Cache:        cache:{endpoint}:{params} → API response
Locks:        lock:{resource}:{id} → Distributed locks
```

## API Architecture

### RESTful Endpoints

```
Authentication:
POST   /api/auth/login          # Login with credentials
POST   /api/auth/refresh        # Refresh access token
POST   /api/auth/logout         # Logout and invalidate tokens
GET    /api/auth/me            # Get current user

Customers:
GET    /api/customers          # List customers (paginated)
GET    /api/customers/:id      # Get customer details
POST   /api/customers          # Create customer
PUT    /api/customers/:id      # Update customer
DELETE /api/customers/:id      # Soft delete customer
GET    /api/customers/search   # Search customers

Jobs:
GET    /api/jobs              # List jobs (filtered)
GET    /api/jobs/:id          # Get job details
POST   /api/jobs              # Create job
PUT    /api/jobs/:id          # Update job
DELETE /api/jobs/:id          # Delete job
PUT    /api/jobs/:id/status   # Update job status
POST   /api/jobs/:id/assign   # Assign workers

Materials:
GET    /api/jobs/:jobId/materials      # List materials
POST   /api/jobs/:jobId/materials      # Add materials
PUT    /api/materials/:id              # Update material
DELETE /api/materials/:id              # Delete material
PUT    /api/materials/bulk-update      # Bulk update

Sync:
POST   /api/sync/push         # Push offline changes
GET    /api/sync/pull         # Pull latest changes
GET    /api/sync/status       # Get sync status
```

### API Response Format

```typescript
// Success response
{
  "data": T,
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0"
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}

// Paginated response
{
  "data": T[],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Offline Sync Architecture

### Sync Strategy

1. **Optimistic Updates**: All changes applied locally first
2. **Operation Queue**: Changes queued with timestamp and operation type
3. **Batch Sync**: Multiple operations sent in single request
4. **Conflict Resolution**: Server timestamp wins, owner overrides worker
5. **Retry Logic**: Exponential backoff with max 3 retries

### Sync Flow

```
User Action → Local Update → Queue Operation → Background Sync
                   ↓                              ↓
              Update UI                    Success → Clear Queue
                                                ↓
                                          Failure → Retry Later
```

### Conflict Resolution Rules

```typescript
interface ConflictResolution {
  strategy: 'SERVER_WINS' | 'CLIENT_WINS' | 'MERGE';
  rules: [
    { field: 'any', rule: 'LAST_WRITE_WINS' },
    { field: 'materials', rule: 'UNION_MERGE' },
    { field: 'status', rule: 'OWNER_WINS' }
  ];
}
```

## Security Architecture

### Authentication Flow

```
1. User Login
   → Validate credentials
   → Generate JWT (15min) + Refresh Token (30d)
   → Store refresh token in Redis
   → Return tokens to client

2. API Request
   → Validate JWT
   → Check user active status
   → Authorize based on role
   → Process request

3. Token Refresh
   → Validate refresh token
   → Check Redis for token
   → Generate new JWT
   → Rotate refresh token
```

### Security Measures

- **Password Security**: bcrypt with 12 rounds
- **Token Security**: RS256 signed JWTs
- **Rate Limiting**: 5 login attempts/minute, 100 API calls/minute
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection**: Prevented by Prisma ORM
- **XSS Protection**: Content Security Policy headers
- **CORS**: Whitelist allowed origins
- **HTTPS**: Enforced everywhere
- **Secrets Management**: AWS Secrets Manager

## Performance Optimization

### Frontend Performance

1. **Code Splitting**: Route-based lazy loading
2. **Bundle Optimization**: < 500KB initial bundle
3. **Image Optimization**: WebP with fallbacks
4. **Caching Strategy**: 
   - Static assets: 1 year cache
   - API responses: 5 minute cache
   - HTML: no-cache
5. **Service Worker**: Precache critical assets

### Backend Performance

1. **Database Optimization**:
   - Indexed columns for search
   - Connection pooling
   - Query optimization
2. **Caching**:
   - Redis for sessions
   - Response caching
   - Query result caching
3. **Async Processing**: Background job queue
4. **Compression**: Gzip responses

### Monitoring & Observability

1. **Application Monitoring**: Sentry for errors
2. **Performance Monitoring**: Core Web Vitals
3. **Infrastructure Monitoring**: CloudWatch
4. **Logging**: Structured JSON logs
5. **Alerting**: PagerDuty integration

## Deployment Architecture

### Infrastructure as Code

```hcl
# Simplified Terraform structure
resource "aws_s3_bucket" "frontend" {
  bucket = "khs-crm-frontend"
  website_configuration { ... }
}

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.frontend.website_endpoint
  }
  ...
}

resource "aws_ecs_service" "backend" {
  name            = "khs-crm-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  ...
}

resource "aws_db_instance" "postgres" {
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t3.micro"
  ...
}
```

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Test frontend
      - Test backend
      - Security scan

  deploy:
    needs: test
    steps:
      - Build images
      - Deploy frontend to S3
      - Deploy backend to ECS
      - Run migrations
      - Invalidate CDN
```

## Development Workflow

### Local Development

```bash
# Start all services
docker-compose up -d

# Install dependencies
npm install

# Run development servers
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Git Workflow

1. Feature branches from `develop`
2. Pull requests with reviews
3. Automated CI checks
4. Merge to `develop` for staging
5. Merge to `main` for production

## Technical Decisions & Rationale

### Why PWA over Native?
- Single codebase for all platforms
- No app store friction
- Instant updates
- Lower development cost
- Native-like capabilities sufficient

### Why PostgreSQL?
- ACID compliance for financial data
- Complex relational queries
- Mature ecosystem
- Excellent performance
- Built-in full-text search

### Why Monorepo?
- Shared types ensure API contract
- Atomic commits across stack
- Simplified dependency management
- Single deployment pipeline
- Easier refactoring

### Why IndexedDB?
- Large storage capacity (>50MB)
- Structured data support
- Transaction support
- Better performance than localStorage
- Available in service workers

## Future Considerations

### Scalability Path
1. **Database**: Read replicas for reporting
2. **API**: Microservices extraction
3. **Cache**: Redis Cluster
4. **Search**: Elasticsearch integration
5. **Real-time**: WebSocket support

### Feature Expansion
1. **Payments**: Stripe integration
2. **Scheduling**: Calendar sync
3. **Reporting**: Analytics dashboard
4. **Mobile Apps**: React Native migration
5. **AI Features**: Predictive materials

## Conclusion

This architecture provides a solid foundation for the KHS CRM that balances technical excellence with practical constraints. The offline-first PWA approach ensures field workers have reliable access to data, while the monorepo structure and shared types maintain development velocity. Security, performance, and scalability are built in from the start, positioning the system for growth while keeping initial complexity manageable.