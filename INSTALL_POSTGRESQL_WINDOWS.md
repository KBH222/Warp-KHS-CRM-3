# Installing PostgreSQL on Windows for KHS CRM

## Step 1: Download PostgreSQL

1. Go to the official PostgreSQL download page: https://www.postgresql.org/download/windows/
2. Click on "Download the installer" from EDB
3. Choose the latest version (16.x) for Windows x86-64
4. Download will start automatically

## Step 2: Install PostgreSQL

1. Run the downloaded installer as Administrator
2. Follow the installation wizard:
   - Installation Directory: Keep default or choose your preferred location
   - Select Components: 
     ✓ PostgreSQL Server
     ✓ pgAdmin 4 (optional but recommended)
     ✓ Stack Builder (optional)
     ✓ Command Line Tools
   - Data Directory: Keep default
   - **Password**: Set a password for the 'postgres' superuser (remember this!)
   - **Port**: Keep default 5432 (or change to 5433 if 5432 is in use)
   - Locale: Keep default
3. Click through to finish installation

## Step 3: Create Database and User

After installation, we need to create the database and user for KHS CRM:

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin 4 from Start Menu
2. Connect to your local PostgreSQL server using the password you set
3. Right-click on "Databases" → "Create" → "Database"
   - Database name: `khs_crm`
   - Owner: postgres (for now)
4. Right-click on "Login/Group Roles" → "Create" → "Login/Group Role"
   - General tab:
     - Name: `khs_user`
   - Definition tab:
     - Password: `khs_dev_password`
   - Privileges tab:
     - Can login: Yes
     - Create databases: Yes

### Option B: Using Command Line
1. Open Command Prompt as Administrator
2. Navigate to PostgreSQL bin directory:
   ```cmd
   cd "C:\Program Files\PostgreSQL\16\bin"
   ```
3. Connect to PostgreSQL:
   ```cmd
   psql -U postgres
   ```
4. Enter the postgres password you set during installation
5. Run these SQL commands:
   ```sql
   -- Create user
   CREATE USER khs_user WITH PASSWORD 'khs_dev_password';
   
   -- Create database
   CREATE DATABASE khs_crm OWNER khs_user;
   
   -- Grant all privileges
   GRANT ALL PRIVILEGES ON DATABASE khs_crm TO khs_user;
   
   -- Exit
   \q
   ```

## Step 4: Update Project Configuration

1. Stop the PostgreSQL Docker container to avoid port conflicts:
   ```bash
   docker stop khs-crm-postgres
   ```

2. Update the backend `.env` file to use local PostgreSQL:
   ```env
   DATABASE_URL="postgresql://khs_user:khs_dev_password@localhost:5432/khs_crm?schema=public"
   ```

3. Run Prisma migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Seed the database:
   ```bash
   npm run db:seed
   ```

## Step 5: Test the Connection

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. The backend should now connect successfully to your local PostgreSQL!

## Troubleshooting

### Port already in use
If port 5432 is already in use (by Docker PostgreSQL), either:
- Stop the Docker container: `docker stop khs-crm-postgres`
- Or install PostgreSQL on a different port (5433) during setup

### Permission denied
- Make sure you're running commands as Administrator
- Check that the khs_user has proper permissions

### Connection refused
- Ensure PostgreSQL service is running:
  - Open Services (Win+R, type "services.msc")
  - Find "postgresql-x64-16" (or similar)
  - Make sure it's Started and set to Automatic

## Next Steps

Once PostgreSQL is installed and configured:
1. The backend will connect without issues
2. You can switch back to the real auth store in the frontend
3. All API endpoints will work properly

## Optional: Add to PATH

To use psql from anywhere in Command Prompt:
1. Right-click "This PC" → Properties
2. Advanced system settings → Environment Variables
3. Under System Variables, find "Path" and click Edit
4. Add: `C:\Program Files\PostgreSQL\16\bin`
5. Click OK and restart Command Prompt