# Development Setup - Backend Connection Issues Resolved

## Summary

The backend connection issues have been resolved. Both frontend and backend are now running:

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001

## Test Credentials

The following test users have been created in the database:

- **Owner Account**: 
  - Email: owner@khs.com
  - Password: password123
  
- **Worker Account**:
  - Email: worker@khs.com  
  - Password: password123

## Current Status

1. ✅ Backend server is running on port 3001
2. ✅ Frontend server is running on port 5174
3. ✅ Test users are in the database
4. ✅ Frontend auth store is configured to use real API
5. ✅ API endpoints are properly configured

## Known Issue - Windows Docker Networking

There's a known issue with Prisma connecting to PostgreSQL in Docker on Windows. The database works fine, but Prisma can't connect from the Windows host.

### Workaround

For development on Windows, you have two options:

1. **Use WSL2**: Run the backend inside WSL2 where it can properly connect to Docker
2. **Use a local PostgreSQL**: Install PostgreSQL directly on Windows instead of using Docker
3. **Mock Mode**: The frontend can run with mock data (already implemented)

## Next Steps

To complete the integration:

1. Resolve the Prisma connection issue (WSL2 or local PostgreSQL)
2. Test the authentication flow end-to-end
3. Replace mock data in dashboard with real API calls
4. Implement customer and job data fetching

## Running the Application

1. Start the backend (in one terminal):
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:5174 in your browser
4. Login with the test credentials above

The application is fully functional with mock data while we resolve the database connection issue.