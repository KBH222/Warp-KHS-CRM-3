# KHS CRM Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (Local installation, NOT Docker)
   - Download from: https://www.postgresql.org/download/
   - Remember your postgres password during installation

3. **Git** (for version control)
   - Download from: https://git-scm.com/

## Step-by-Step Setup

### 1. Clone or Download the Project
```bash
# If using git
git clone [your-repository-url]
cd khs-crm

# Or extract the downloaded folder and navigate to it
cd path/to/khs-crm
```

### 2. Database Setup

#### Create Database
```bash
# Open PostgreSQL command line or pgAdmin
# Create a new database
CREATE DATABASE khs_crm;
```

#### Configure Database Connection
1. Copy the example environment file:
```bash
# In the backend folder
cd backend
cp .env.example .env
```

2. Edit `backend/.env` with your database credentials:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/khs_crm"
JWT_SECRET="your-secret-key-here"
PORT=3001
```

### 3. Install Dependencies
```bash
# From the project root
cd khs-crm

# Install all dependencies (root, frontend, and backend)
npm install
```

### 4. Set Up Database Tables
```bash
# From the backend folder
cd backend

# Push the database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Seed with sample data
npm run db:seed
```

### 5. Start the Development Servers
```bash
# From the project root
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 6. Access the Application
1. Open your browser to http://localhost:5173
2. Default login (if seeded):
   - Email: admin@khsconstruction.com
   - Password: admin123

## Additional Setup Options

### Enable PWA Features
The app is already configured as a Progressive Web App. To install:
1. Visit http://localhost:5173 in Chrome/Edge
2. Click the install icon in the address bar
3. Or click the install banner when it appears

### Configure for Network Access
To access from other devices (like testing on phone):

1. Add firewall rule (Run as Administrator):
```bash
netsh advfirewall firewall add rule name="KHS CRM Dev" dir=in action=allow protocol=TCP localport=5173
```

2. Find your computer's IP:
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.4)
```

3. Access from other devices:
```
http://[your-ip]:5173
# Example: http://192.168.1.4:5173
```

## Production Deployment

### 1. Build for Production
```bash
# From project root
npm run build
```

### 2. Environment Variables
Create production `.env` files with:
- Production database credentials
- Secure JWT secret
- Production API URL

### 3. Database Migration
```bash
# In production environment
cd backend
npx prisma migrate deploy
```

### 4. Serve the Application
- Frontend: Serve the `frontend/dist` folder with any static file server (Nginx, Apache, etc.)
- Backend: Run with a process manager like PM2:
```bash
npm install -g pm2
pm2 start backend/dist/server.js --name khs-crm-api
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL service is running
- Check credentials in `.env` file
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
```bash
# Windows - Find and kill process
netstat -ano | findstr :5173
taskkill /PID [process-id] /F

# Or change ports in:
# - frontend/vite.config.ts (frontend port)
# - backend/.env (backend port)
```

### Dependencies Issues
```bash
# Clear everything and reinstall
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
```

### PWA Not Working
- Ensure you're using HTTPS in production
- Check browser console for service worker errors
- Clear browser cache and retry

## Development Tips

### Run Tests
```bash
# From frontend folder
npm run verify
```

### Database Management
```bash
# View database in GUI
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

### Check Code Quality
```bash
# Run all checks
npm run verify

# Individual checks
npm run typecheck
npm run lint
npm run test
```

## Support

For issues or questions:
1. Check the `TROUBLESHOOTING.md` file
2. Review error messages in browser console
3. Check backend logs in terminal

## Next Steps

1. Customize company branding in `frontend/public/manifest.json`
2. Set up email service for notifications (optional)
3. Configure backup strategy for PostgreSQL
4. Set up SSL certificates for production
5. Implement monitoring and logging

---

Remember to follow BMAD methodology:
- Always run `npm run verify` before making changes
- Use local PostgreSQL (not Docker)
- Focus on construction industry needs
- Prioritize offline functionality