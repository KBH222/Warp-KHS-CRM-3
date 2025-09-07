# Railway Deployment Setup for Warp KHS-CRM-5

## Project Information
- **Project Name**: Warp KHS-CRM-5
- **Project URL**: https://railway.com/project/9a4767f8-2f63-49e0-81b5-4d16607cee2d

## Required Services
1. **PostgreSQL Database** ✓ (Already created)
2. **Node.js Application Service** (To be created)

## Environment Variables to Set in Railway

### For the Application Service:
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# JWT Secrets (generate secure ones for production)
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-for-production

# Database URL (Railway will auto-populate this)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Frontend URL (will be set after deployment)
FRONTEND_URL=https://your-frontend-domain.railway.app
```

## Deploy Steps:

### Option 1: Deploy from GitHub (Recommended)
1. Push your code to GitHub repository
2. In Railway dashboard, click "+ New Service"
3. Select "GitHub Repo"
4. Connect your repository
5. Railway will auto-detect the build process

### Option 2: Deploy from CLI
```bash
# After setting up the service in dashboard
npx @railway/cli up
```

## Build Configuration
The `package.json` already includes Railway-specific scripts:
- **Build**: `npm run build:railway`
- **Start**: `npm run start:railway`

## Post-Deployment Steps
1. Set up custom domains if needed
2. Configure environment variables
3. Run database migrations
4. Test the deployment

## Commands for Railway CLI
```bash
# Check deployment status
npx @railway/cli status

# View logs
npx @railway/cli logs

# Open project dashboard
npx @railway/cli open

# Connect to database
npx @railway/cli connect postgres
```
