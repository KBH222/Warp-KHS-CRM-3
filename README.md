# KHS Construction & Remodeling CRM

A mobile-first Progressive Web App (PWA) designed for construction professionals to manage customer information, jobs, and materials from the field with robust offline capabilities.

## 🎯 Overview

KHS CRM solves the critical pain point of information accessibility in the field for small construction businesses. The system provides instant mobile access to customer data, job details, and materials lists, eliminating the need to return to the office or make phone calls for basic information.

### Key Features

- **Offline-First Architecture**: Full functionality without internet connection
- **Mobile-Optimized**: Designed for one-handed operation on job sites
- **PWA Technology**: Installable on any device without app stores
- **Role-Based Access**: Separate interfaces for owners and workers
- **Real-Time Sync**: Automatic data synchronization when online
- **Secure Authentication**: JWT-based auth with refresh tokens

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 16+ (via Docker)
- Redis 7+ (via Docker)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/khs-crm.git
cd khs-crm
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Start the database services:
```bash
npm run docker:up
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Seed the database (development only):
```bash
npm run db:seed
```

7. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/api/health

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand for global state
- **Offline Storage**: IndexedDB via idb
- **API Client**: Axios with interceptors
- **UI Framework**: Tailwind CSS
- **PWA**: Vite PWA plugin with Workbox
- **Build Tool**: Vite

#### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions
- **Authentication**: JWT with refresh tokens
- **Validation**: express-validator
- **Logging**: Winston

#### Infrastructure
- **Hosting**: AWS (S3 + CloudFront for frontend, ECS for backend)
- **Database**: AWS RDS PostgreSQL
- **Cache**: AWS ElastiCache Redis
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch + Sentry

### Project Structure

```
khs-crm/
├── frontend/               # React PWA application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API and offline services
│   │   ├── stores/       # Zustand state stores
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Helper functions
│   └── public/           # Static assets
├── backend/               # Express API server
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── db/          # Database config
│   │   └── utils/       # Utilities
│   └── prisma/          # Database schema
├── shared/               # Shared packages
│   ├── types/           # TypeScript types
│   └── constants/       # Shared constants
├── infrastructure/       # Deployment configs
│   └── terraform/       # AWS infrastructure
└── docs/                # Documentation
```

### Offline-First Design

The application uses a sophisticated offline-first architecture:

1. **Service Worker**: Intercepts network requests and serves cached data
2. **IndexedDB**: Stores all customer, job, and material data locally
3. **Sync Queue**: Queues operations performed offline for later sync
4. **Conflict Resolution**: Server-wins strategy with owner changes taking precedence
5. **Background Sync**: Automatically syncs when connection is restored

### Security

- HTTPS everywhere with SSL/TLS encryption
- JWT tokens with 15-minute expiry and refresh token rotation
- Role-based access control (RBAC)
- Rate limiting on authentication endpoints
- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS protection headers
- CORS configuration

## 📱 PWA Features

### Installation
The app can be installed on any device:
- iOS: Safari → Share → Add to Home Screen
- Android: Chrome → Three dots → Install app
- Desktop: Chrome → Install button in address bar

### Offline Capabilities
- View all customer data
- Access job information
- Check materials lists
- Create and edit data (syncs when online)
- Queue multiple operations

### Performance
- Initial load: < 3 seconds on 4G
- Subsequent loads: < 1 second (cached)
- Offline activation: < 2 seconds
- 50MB storage limit for offline data

## 🧪 Testing

Run the test suites:

```bash
# All tests
npm test

# Backend tests
npm run test:backend

# Frontend tests  
npm run test:frontend

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Production Deployment

The application uses GitHub Actions for CI/CD:

1. Push to `main` branch triggers deployment
2. Tests and builds run automatically
3. Frontend deploys to AWS S3 + CloudFront
4. Backend deploys to AWS ECS
5. Database migrations run automatically

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy frontend
npm run deploy:frontend

# Deploy backend
npm run deploy:backend
```

## 📊 Monitoring

- **Errors**: Sentry for error tracking
- **Performance**: CloudWatch metrics
- **Logs**: CloudWatch Logs for centralized logging
- **Uptime**: AWS CloudWatch Synthetics

## 🔧 Development

### Code Style

The project uses:
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Husky for pre-commit hooks

### Git Workflow

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR
4. CI runs tests automatically
5. Merge to `develop` after review
6. Deploy to staging
7. Merge `develop` to `main` for production

### Environment Variables

See `.env.example` files in frontend and backend directories for required variables.

## 📄 License

Proprietary - KHS Construction & Remodeling

## 🤝 Contributing

This is a private repository. For access or questions, contact the development team.

## 🆘 Support

- Documentation: `/docs` directory
- Issues: GitHub Issues
- Contact: dev@khscrm.com

---

Built with ❤️ for construction professionals