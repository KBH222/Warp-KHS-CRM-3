# Connecting Frontend to Deployed Backend

## Steps to Connect

1. **Get your Render backend URL**
   - Go to your Render dashboard
   - Find your backend service
   - Copy the URL (should look like: https://your-service-name.onrender.com)

2. **Update Frontend Environment**
   - Edit `frontend/.env`
   - Change `VITE_API_URL=http://localhost:3001` to your Render URL
   - Example: `VITE_API_URL=https://khs-crm-backend.onrender.com`

3. **Test the Connection**
   - Run: `node test-render-backend.js` (update the URL in the file first)
   - Should see ✅ for all endpoints

4. **Rebuild and Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   ```
   - Then push to trigger Vercel deployment

## Important Notes

- Don't include a trailing slash in VITE_API_URL
- The backend URL should use https:// not http://
- Render free tier may sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds

## Verify It's Working

After deploying, your app should:
1. Load customer data from the database
2. Save new customers to PostgreSQL
3. Persist data between sessions
4. Show no localStorage dependency

## Troubleshooting

If data isn't loading:
1. Check browser console for errors
2. Verify VITE_API_URL is correct
3. Check Render logs for backend errors
4. Ensure DATABASE_URL is set correctly in Render