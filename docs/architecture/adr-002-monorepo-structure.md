# ADR-002: Monorepo Architecture

## Status
Accepted

## Context
The KHS CRM consists of multiple interconnected components: frontend PWA, backend API, shared types, and shared constants. We need a repository structure that facilitates code sharing, maintains consistency, and simplifies deployment.

## Decision
We will use a monorepo structure with npm workspaces to manage all components in a single repository.

## Consequences

### Positive
- **Atomic Changes**: Frontend and backend changes can be made in single commits
- **Type Safety**: Shared TypeScript types ensure API contract consistency
- **Simplified Setup**: One clone, one install, one build command
- **Unified CI/CD**: Single pipeline for all components
- **Code Reuse**: Easy sharing of utilities and constants
- **Refactoring**: Cross-component refactoring is straightforward

### Negative
- **Larger Repository**: All code in one place increases clone size
- **Complex Dependencies**: Workspace dependencies need careful management
- **Build Times**: Changes trigger builds for all components
- **Access Control**: Cannot restrict access to specific components

## Implementation Details

### Repository Structure
```
khs-crm/
├── package.json          # Root package with workspace config
├── frontend/            # React PWA application
├── backend/             # Express API server
├── shared/
│   ├── types/          # Shared TypeScript interfaces
│   └── constants/      # Shared constants and enums
└── infrastructure/     # Deployment configurations
```

### Workspace Configuration
```json
{
  "name": "khs-crm",
  "workspaces": [
    "frontend",
    "backend", 
    "shared/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend"
  }
}
```

### Shared Types Example
```typescript
// shared/types/src/index.ts
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address: string;
}

// Used in both frontend and backend:
import { Customer } from '@khs-crm/types';
```

### Development Workflow
1. **Install**: `npm install` at root installs all dependencies
2. **Develop**: `npm run dev` starts both frontend and backend
3. **Type Changes**: Automatically propagate to all consumers
4. **Test**: `npm test` runs all workspace tests
5. **Build**: `npm run build` creates production builds

## Alternatives Considered

1. **Separate Repositories**
   - Pros: Independent deployment, smaller repos, granular access
   - Cons: Complex coordination, version mismatches, duplicate code
   - Rejected: Synchronization overhead outweighs benefits for small team

2. **Git Submodules**
   - Pros: Separate repos with linking
   - Cons: Complex workflow, steep learning curve
   - Rejected: Too complex for team size

3. **Lerna**
   - Pros: Powerful monorepo tool
   - Cons: Adds complexity, npm workspaces sufficient
   - Rejected: Native npm workspaces meet our needs

4. **Nx**
   - Pros: Advanced monorepo features, build caching
   - Cons: Significant complexity increase
   - Rejected: Overkill for current project size

## Migration Strategy
Not applicable - greenfield project

## References
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v8/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Monorepo.tools Comparison](https://monorepo.tools/)