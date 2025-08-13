# Deploy KHS CRM to Vercel (Free Hosting)

This will make your CRM accessible from anywhere, perfect for iPhone access.

## Quick Deploy Steps:

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub/Email (free)

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   vercel
   ```
   - Follow prompts
   - Choose "Continue with Email"
   - Verify your email
   - Accept defaults

4. **Your App URL**
   - Vercel gives you: https://your-app.vercel.app
   - Access from ANY device
   - Add to iPhone home screen

## Backend Options:

### For Testing (Frontend Only):
- The app works offline after first load
- Perfect for viewing data
- Adding/editing stores locally

### For Full Functionality:
Deploy backend to Railway.app:
1. Push code to GitHub
2. Connect to Railway
3. Add PostgreSQL database
4. Deploy with one click

## iPhone Installation:

Once deployed to Vercel:
1. Open Safari on iPhone
2. Go to your-app.vercel.app
3. Tap Share → Add to Home Screen
4. Works like a native app!

## Benefits:
- ✅ No local server needed
- ✅ Access from anywhere
- ✅ Automatic HTTPS
- ✅ Fast loading
- ✅ Professional URL
- ✅ Free tier is generous