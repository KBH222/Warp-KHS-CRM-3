# Environment Variables Documentation

## Backend Environment Variables

### Required Variables

These environment variables MUST be set for the backend to function properly:

#### Core Configuration
- **NODE_ENV** (required)
  - Values: `development`, `production`, `test`
  - Default: `development`
  - Used for: Logging levels, error messages, Redis connection handling

- **PORT** (required)
  - Default: `3001`
  - Used in: `server-simple.ts`, `server.ts`
  - Note: Render typically uses `10000`

- **DATABASE_URL** (required)
  - Format: `postgresql://user:password@host:port/database?schema=public`
  - Example: `postgresql://user:pass@localhost:5432/khs_crm?schema=public`
  - Used by: Prisma ORM for database connections

#### Authentication
- **JWT_SECRET** (required)
  - Used for: Signing JWT access tokens
  - Security: Must be a long, random string (32+ characters)
  - Used in: `auth.middleware.ts`, `auth.service.ts`

- **JWT_REFRESH_SECRET** (optional)
  - Used for: Signing JWT refresh tokens
  - Default: Falls back to JWT_SECRET if not provided
  - Security: Should be different from JWT_SECRET in production

#### CORS Configuration
- **FRONTEND_URL** (recommended)
  - Default: `*` (allows all origins - not recommended for production)
  - Example: `https://khs-crm-frontend.vercel.app`
  - Used in: `server-simple.ts`, `server.ts`

### Optional Variables

These variables are referenced in code but have fallbacks:

#### Logging
- **LOG_LEVEL** (optional)
  - Values: `error`, `warn`, `info`, `debug`
  - Default: `info`
  - Used in: `logger.ts`, `prisma.ts`

#### Redis (Not used in server-simple.ts)
- **REDIS_URL** (optional - only for full server)
  - Default: `redis://localhost:6379`
  - Used in: `redis.service.ts` (not used in simple deployment)

### Unused Variables (Safe to Remove)

These variables are in .env.example but not used in the codebase:

- **SENTRY_DSN** - Error tracking (not implemented)
- **SMTP_HOST** - Email service (not implemented)
- **SMTP_PORT** - Email service (not implemented)
- **SMTP_USER** - Email service (not implemented)
- **SMTP_PASS** - Email service (not implemented)
- **EMAIL_FROM** - Email service (not implemented)

## Frontend Environment Variables

The frontend uses Vite environment variables (prefixed with VITE_):

- **VITE_API_URL** (optional)
  - Default: `http://localhost:3001`
  - Should match your backend URL in production

## Production Configuration Examples

### Render Deployment
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:password@host/database?ssl=true
JWT_SECRET=your-32-character-random-string-here
JWT_REFRESH_SECRET=another-32-character-random-string
FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=info
```

### Local Development
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/khs_crm
JWT_SECRET=dev-secret-change-in-production
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

## Security Notes

1. **Never commit .env files** to version control
2. **Use strong, unique secrets** for JWT tokens in production
3. **Rotate secrets regularly** in production environments
4. **Use environment-specific values** for each deployment stage

## Deployment Checklist

- [ ] Set NODE_ENV to "production"
- [ ] Configure DATABASE_URL with production database
- [ ] Generate strong JWT_SECRET (minimum 32 characters)
- [ ] Generate different JWT_REFRESH_SECRET
- [ ] Set FRONTEND_URL to your frontend domain
- [ ] Remove or leave empty unused variables