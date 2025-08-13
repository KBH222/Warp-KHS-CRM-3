# Quick Start - Local PostgreSQL Setup

## Prerequisites
You need to install PostgreSQL for Windows first. If you haven't done this yet, see `INSTALL_POSTGRESQL_WINDOWS.md`.

## Fastest Setup (After PostgreSQL is Installed)

1. **Stop Docker PostgreSQL** (to free up port 5432):
   ```bash
   docker stop khs-crm-postgres
   ```

2. **Run the setup script**:
   ```bash
   setup-local-db.bat
   ```
   This script will:
   - Create the database and user
   - Run migrations
   - Seed test data

3. **Update your backend/.env file**:
   Change the DATABASE_URL to:
   ```
   DATABASE_URL="postgresql://khs_user:khs_dev_password@localhost:5432/khs_crm?schema=public"
   ```

4. **Start the application**:
   
   Terminal 1 - Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 - Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

5. **Test it**:
   - Open http://localhost:5174
   - Login with: owner@khs.com / password123

## Manual Setup (If the Script Doesn't Work)

1. Open Command Prompt as Administrator

2. Connect to PostgreSQL:
   ```bash
   "C:\Program Files\PostgreSQL\16\bin\psql" -U postgres
   ```

3. Create user and database:
   ```sql
   CREATE USER khs_user WITH PASSWORD 'khs_dev_password';
   CREATE DATABASE khs_crm OWNER khs_user;
   GRANT ALL PRIVILEGES ON DATABASE khs_crm TO khs_user;
   \q
   ```

4. Update backend/.env:
   ```
   DATABASE_URL="postgresql://khs_user:khs_dev_password@localhost:5432/khs_crm?schema=public"
   ```

5. Run migrations and seed:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   npm run db:seed
   ```

## Switching Back to Real Auth Store

Once PostgreSQL is working locally, update the frontend to use real authentication:

1. Edit `frontend/src/stores/auth.store.ts`
2. Remove the mock export and uncomment the real implementation:
   ```typescript
   // Remove these lines:
   // export * from './auth.store.mock';
   
   // Uncomment everything below
   ```

3. Restart the frontend

## Troubleshooting

### "FATAL: password authentication failed"
- Make sure you're using the correct password for the postgres user
- Try connecting with pgAdmin first to verify the password

### "Could not connect to server"
- Check if PostgreSQL service is running in Windows Services
- Make sure port 5432 is not blocked by firewall
- Verify Docker PostgreSQL is stopped

### "Permission denied to create database"
- Make sure you're connected as the postgres superuser
- Run the commands in an Administrator Command Prompt

## Success Indicators

You'll know it's working when:
1. Backend starts without connection errors
2. You can login in the frontend
3. The dashboard shows real data (once implemented)
4. No more "authentication failed" errors in the console