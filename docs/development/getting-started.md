# Getting Started with KHS CRM Development

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Recommended VS Code Extensions

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- Prisma
- Thunder Client (API testing)
- GitLens

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/khs-crm.git
cd khs-crm
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 3. Environment Configuration

Copy the example environment files:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

Edit the `.env` files with your local configuration. For development, the defaults should work.

### 4. Start Database Services

```bash
# Start PostgreSQL and Redis via Docker
npm run docker:up

# Verify services are running
docker ps
```

### 5. Initialize Database

```bash
# Run database migrations
npm run db:migrate

# Seed with test data (development only)
npm run db:seed
```

### 6. Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/health

### 7. Default Login Credentials

After seeding, use these credentials:

**Owner Account:**
- Email: owner@khscrm.com
- Password: Test123!

**Worker Account:**
- Email: worker@khscrm.com
- Password: Test123!

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific workspace tests
npm run test --workspace=frontend
npm run test --workspace=backend
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck

# Format code with Prettier
npm run format
```

### Database Management

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI for database)
npx prisma studio
```

### Building for Production

```bash
# Build all packages
npm run build

# Build specific package
npm run build:frontend
npm run build:backend
```

## Project Structure Overview

```
khs-crm/
├── frontend/                 # React PWA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route-based pages
│   │   ├── services/       # API and offline services
│   │   ├── stores/         # Zustand state management
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
│
├── backend/                 # Express API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utilities
│   └── prisma/
│       └── schema.prisma   # Database schema
│
└── shared/                  # Shared packages
    ├── types/              # TypeScript interfaces
    └── constants/          # Shared constants
```

## Common Development Tasks

### Adding a New API Endpoint

1. Define types in `shared/types/src/index.ts`
2. Add endpoint constant in `shared/constants/src/index.ts`
3. Create controller in `backend/src/controllers/`
4. Add route in `backend/src/routes/`
5. Update API service in `frontend/src/services/`

### Adding a New Database Model

1. Update schema in `backend/prisma/schema.prisma`
2. Run migration: `npm run db:migrate`
3. Add TypeScript types in `shared/types/`
4. Generate Prisma client: `npm run db:generate`

### Creating a New React Component

1. Create component in `frontend/src/components/`
2. Add Tailwind styles using utility classes
3. Use TypeScript interfaces for props
4. Export from index file for clean imports

### Working with Offline Features

1. Update IndexedDB schema in `frontend/src/services/db.service.ts`
2. Add sync logic in `frontend/src/services/sync.service.ts`
3. Test offline behavior using Chrome DevTools
4. Verify sync when returning online

## Debugging

### Backend Debugging

1. Add `debugger` statements or use VS Code breakpoints
2. Run in debug mode: `npm run dev:debug --workspace=backend`
3. Attach VS Code debugger (F5)

### Frontend Debugging

1. Use Chrome DevTools
2. React Developer Tools extension
3. Redux DevTools for state inspection
4. Network tab for API calls

### Database Debugging

1. Use Prisma Studio: `npx prisma studio`
2. Check logs: `docker logs khs-crm-postgres`
3. Connect with pgAdmin or TablePlus

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

**Database connection errors:**
```bash
# Restart Docker containers
npm run docker:down
npm run docker:up

# Check Docker status
docker ps
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors after changing shared types:**
```bash
# Rebuild shared packages
npm run build:shared
```

## Best Practices

1. **Commit Messages**: Use conventional commits (feat:, fix:, docs:, etc.)
2. **Branch Naming**: feature/description, bugfix/description
3. **Pull Requests**: Include description and testing steps
4. **Code Review**: Required before merging to develop
5. **Testing**: Write tests for new features
6. **Documentation**: Update docs with API changes

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## Getting Help

- Check existing issues on GitHub
- Ask in the development Slack channel
- Review ADRs in `/docs/architecture/`
- Contact the tech lead for complex issues