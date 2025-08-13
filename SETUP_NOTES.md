# Setup Notes

## Docker Requirements
To run the development environment, you need Docker Desktop installed and running:
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Start Docker Desktop
3. Run `docker-compose up -d` to start PostgreSQL and Redis containers

## Alternative Setup (without Docker)
If you prefer to run PostgreSQL and Redis locally:
1. Install PostgreSQL 16+ and create a database named `khs_crm`
2. Install Redis 7+
3. Update the connection strings in `backend/.env`

## Current Status
- ✅ Monorepo structure configured
- ✅ NPM workspaces set up
- ✅ TypeScript configured
- ✅ Shared packages built
- ✅ Environment files created
- ⚠️ Docker containers need to be started (requires Docker Desktop)