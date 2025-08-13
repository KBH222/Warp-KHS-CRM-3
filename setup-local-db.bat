@echo off
echo =============================================
echo KHS CRM - Local PostgreSQL Setup
echo =============================================
echo.
echo This script will help you set up PostgreSQL locally for KHS CRM.
echo Make sure you have installed PostgreSQL for Windows first!
echo.
pause

echo.
echo Step 1: Stopping Docker PostgreSQL container (if running)...
docker stop khs-crm-postgres 2>nul
if %errorlevel% == 0 (
    echo Docker container stopped.
) else (
    echo Docker container was not running.
)

echo.
echo Step 2: Creating database and user...
echo You will be prompted for the postgres password you set during installation.
echo.

set PGPASSWORD=
set /p PGPASSWORD=Enter your PostgreSQL 'postgres' user password: 

"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -f backend\setup-local-postgres.sql
if %errorlevel% neq 0 (
    echo.
    echo Failed to run setup script. Trying alternative path...
    "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -f backend\setup-local-postgres.sql
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Could not find PostgreSQL. Make sure it's installed and in the default location.
        echo If installed in a custom location, please run the SQL script manually.
        pause
        exit /b 1
    )
)

echo.
echo Step 3: Updating backend configuration...
cd backend

echo DATABASE_URL="postgresql://khs_user:khs_dev_password@localhost:5432/khs_crm?schema=public" > .env.local
echo.
echo Created .env.local with local database connection.
echo Please copy other environment variables from .env to .env.local

echo.
echo Step 4: Running Prisma migrations...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to run migrations. Please check the error above.
    pause
    exit /b 1
)

echo.
echo Step 5: Generating Prisma client...
call npx prisma generate

echo.
echo Step 6: Seeding database with test data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo.
    echo Warning: Seeding failed. You may need to run it manually.
)

echo.
echo =============================================
echo Setup Complete!
echo =============================================
echo.
echo Next steps:
echo 1. Copy .env to .env.local and update DATABASE_URL
echo 2. Start the backend: npm run dev
echo 3. Start the frontend: cd ..\frontend ^&^& npm run dev
echo 4. Login with: owner@khs.com / password123
echo.
pause