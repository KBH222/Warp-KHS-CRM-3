# Development Story 1.1: Project Setup and Infrastructure

## Story Overview
**As a developer,**  
**I want a fully configured development environment with frontend, backend, and database,**  
**so that the team can begin building features immediately.**

## Technical Implementation Details

### 1. Monorepo Structure Setup

#### Directory Structure
```
khs-crm/
├── frontend/               # React PWA application
├── backend/                # Node.js API server
├── shared/                 # Shared TypeScript types/interfaces
│   ├── types/             # TypeScript type definitions
│   └── constants/         # Shared constants
├── infrastructure/         # Docker, deployment configs
├── scripts/               # Build and utility scripts
├── docs/                  # Documentation
├── .github/               # GitHub Actions workflows
├── docker-compose.yml     # Local development environment
├── package.json           # Root package.json for workspaces
├── tsconfig.json          # Root TypeScript config
├── .gitignore            
├── .env.example          
└── README.md             
```

#### Implementation Tasks
1. Initialize npm workspaces in root package.json
2. Configure TypeScript project references for cross-package imports
3. Set up path aliases for clean imports (@khs/shared, @khs/types)
4. Create workspace scripts for parallel execution

### 2. Frontend Setup (React + TypeScript + Vite)

#### Technology Stack
- React 18.x with TypeScript 5.x
- Vite 5.x for build tooling
- Tailwind CSS 3.x for styling
- React Router v6 for navigation
- Zustand for state management
- React Query for server state

#### Setup Commands
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install tailwindcss postcss autoprefixer
npm install @tailwindcss/forms @tailwindcss/typography
npm install react-router-dom zustand @tanstack/react-query
npm install -D @types/react @types/react-dom
```

#### Configuration Files
- `vite.config.ts`: Configure proxy for backend API, PWA plugin
- `tailwind.config.js`: Mobile-first breakpoints, custom colors
- `tsconfig.json`: Strict mode, path aliases
- `.env.example`: VITE_API_URL=http://localhost:3001

### 3. Backend Setup (Node.js + Express + TypeScript)

#### Technology Stack
- Node.js 20.x LTS
- Express 4.x with TypeScript
- Prisma ORM for database
- JWT for authentication
- Helmet for security headers
- Cors for cross-origin requests
- Express-validator for input validation

#### Setup Commands
```bash
cd backend
npm init -y
npm install express helmet cors dotenv bcrypt jsonwebtoken
npm install -D typescript @types/node @types/express ts-node-dev
npm install -D @types/bcrypt @types/jsonwebtoken
npm install prisma @prisma/client
npm install express-validator express-rate-limit
```

#### Initial Server Structure
```typescript
// src/server.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4. PostgreSQL Database Setup

#### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: khs_user
      POSTGRES_PASSWORD: khs_password
      POSTGRES_DB: khs_crm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@khs.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

#### Prisma Schema Initial Setup
```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  OWNER
  WORKER
}
```

### 5. Development Scripts

#### Root package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm --workspace=backend run dev",
    "dev:frontend": "npm --workspace=frontend run dev",
    "dev:db": "docker-compose up -d postgres",
    "dev:all": "npm run dev:db && npm run dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:shared": "npm --workspace=@khs/shared run build",
    "build:backend": "npm --workspace=backend run build",
    "build:frontend": "npm --workspace=frontend run build",
    "test": "npm run test:shared && npm run test:backend && npm run test:frontend",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### 6. Environment Configuration

#### Backend .env.example
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://khs_user:khs_password@localhost:5432/khs_crm
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
```

#### Frontend .env.example
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=KHS CRM
```

### 7. Git Configuration

#### .gitignore
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
postgres_data/
*.sqlite
*.sqlite3

# Temporary
tmp/
temp/
.cache/
```

### 8. CI/CD Pipeline (GitHub Actions)

#### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm test
```

## Definition of Done

### Required Outputs
1. **Working Development Environment**
   - [ ] `npm run dev` starts frontend, backend, and database
   - [ ] Frontend accessible at http://localhost:5173
   - [ ] Backend health check at http://localhost:3001/health
   - [ ] Database accessible at localhost:5432

2. **Code Quality**
   - [ ] TypeScript strict mode enabled
   - [ ] ESLint configured with no errors
   - [ ] Prettier formatting configured
   - [ ] Pre-commit hooks running lint/format

3. **Documentation**
   - [ ] README.md with setup instructions
   - [ ] API documentation started
   - [ ] Environment variables documented

4. **CI/CD**
   - [ ] GitHub Actions running on PRs
   - [ ] All checks passing on main branch

## Testing Requirements

### Manual Testing
1. Clone repository on fresh machine
2. Follow README setup instructions
3. Verify all services start correctly
4. Verify hot-reload works for frontend/backend
5. Verify TypeScript compilation works

### Automated Testing
1. CI pipeline runs successfully
2. Type checking passes
3. Linting passes
4. Basic health check endpoint test

## Estimated Effort
- **Story Points:** 8
- **Time Estimate:** 1-2 days
- **Complexity:** Medium (mostly configuration)

## Dependencies
- None (first story in epic)

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Windows/Mac/Linux compatibility | High | Test on all platforms, use cross-platform scripts |
| Node version conflicts | Medium | Specify exact versions in .nvmrc |
| Database connection issues | Medium | Provide troubleshooting guide |

## Notes for Developers
- Use npm workspaces, not Yarn or pnpm (for simplicity)
- Commit docker-compose.yml but not .env files
- Include VS Code recommended extensions in .vscode/extensions.json
- Set up Husky for pre-commit hooks in follow-up story