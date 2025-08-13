# Windows Docker Database Connection Issue

## Problem
When running on Windows with Docker Desktop, Prisma cannot connect to PostgreSQL using `localhost` or `127.0.0.1` due to networking differences between Windows and Docker.

## Current Status
- ✅ Database is running correctly in Docker
- ✅ All tables are created and ready
- ✅ Backend server can run (with mock data for now)
- ⚠️ Prisma migrations and direct DB access from host don't work

## Workarounds

### Option 1: Use Docker Exec (Current Approach)
For any database operations, use Docker exec:
```bash
# Run SQL directly
docker exec khs-crm-postgres sh -c "PGPASSWORD=khs_dev_password psql -U khs_user -d khs_crm -c 'YOUR SQL HERE'"

# Check tables
docker exec khs-crm-postgres sh -c "PGPASSWORD=khs_dev_password psql -U khs_user -d khs_crm -c '\dt'"
```

### Option 2: Run Backend in Docker
Create a Dockerfile for the backend and run it in the same Docker network as PostgreSQL.

### Option 3: Use WSL2
Run the development environment inside WSL2 where Docker networking works normally.

### Option 4: Use Docker Host IP
Find your Docker host IP and use that instead of localhost:
```bash
# In Docker container
hostname -I
# Use that IP in your DATABASE_URL
```

## For Development
The backend will start and run, but database operations will need to be mocked or use the Docker exec workaround until you deploy or run in a proper environment.

## Production
This issue only affects local Windows development. In production or CI/CD environments, the connection will work normally.