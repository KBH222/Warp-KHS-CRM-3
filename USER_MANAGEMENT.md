# KHS CRM User Management

## Default Test Users

The system comes with two test users pre-configured:

1. **Owner Account**
   - Email: `owner@khs.com`
   - Password: `password123`
   - Role: OWNER (full access)

2. **Worker Account**
   - Email: `worker@khs.com`
   - Password: `password123`
   - Role: WORKER (limited access)

## Creating New Users

### Method 1: Using the Interactive Script

```bash
node create-user.js
```

This will prompt you for:
- Email address
- Full name
- Password
- Role (OWNER or WORKER)

### Method 2: Using the Test User Script

To recreate the default test users:

```bash
cd backend
node create-test-user.js
```

### Method 3: Direct Database Access

If you have direct database access, you can create users using Prisma Studio:

```bash
cd backend
npx prisma studio
```

Then navigate to the User table and add new records.

## User Roles

- **OWNER**: Full system access, can manage all data and users
- **WORKER**: Limited access, can view and update job information

## Logging In

1. Start the application:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:5173 (or your configured port)

3. Use one of the credentials above to log in

## Password Requirements

- Passwords are hashed using bcrypt
- No specific complexity requirements in the current version
- Recommended: Use strong passwords in production

## Troubleshooting

### "User already exists" error
- The email address is already in use
- Use a different email or delete the existing user

### Cannot log in
- Ensure the backend server is running
- Check that the database is accessible
- Verify the password is correct (case-sensitive)

### Reset a password
Currently, password reset must be done manually:

1. Generate a new password hash:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = bcrypt.hashSync('newpassword', 10);
   console.log(hash);
   ```

2. Update the user record in the database with the new hash