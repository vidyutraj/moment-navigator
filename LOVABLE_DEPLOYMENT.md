# Deploying Clarity to Lovable

## Important: Backend Deployment Required

**Your tasks and goals are stored on a separate backend server**, not in the browser. To make your data persist when deploying via Lovable, you need to:

1. **Deploy the backend server separately** (see options below)
2. **Set the API URL** in your Lovable environment variables
3. **Ensure data persistence** on your backend hosting

## Quick Setup Options

### Option 1: Deploy Backend to Railway (Recommended - Easy)

1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repo
4. Add a new service → "Empty Service"
5. Set the root directory to `server/`
6. Set the start command: `npm start`
7. Railway will automatically:
   - Detect `server/package.json`
   - Install dependencies
   - Run the server
   - Provide a public URL (e.g., `https://your-app.railway.app`)

8. **Set environment variable in Lovable:**
   - Go to your Lovable project settings
   - Add environment variable: `VITE_API_URL=https://your-app.railway.app/api`
   - Also set: `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

9. **Data persistence:** Railway provides persistent storage, so your `server/data/` files will persist.

### Option 2: Deploy Backend to Render

1. Go to [Render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

5. Render will provide a URL like `https://your-app.onrender.com`

6. **Set environment variables in Lovable:**
   - `VITE_API_URL=https://your-app.onrender.com/api`
   - `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

7. **Note:** Render free tier spins down after inactivity. Consider upgrading for persistent data.

### Option 3: Deploy Backend to Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In the `server/` directory, run: `fly launch`
3. Follow the prompts to create your app
4. Deploy: `fly deploy`
5. Get your URL: `fly info`

6. **Set environment variables in Lovable:**
   - `VITE_API_URL=https://your-app.fly.dev/api`
   - `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

## Deploy Frontend to Lovable

1. Open your project in Lovable
2. Click **Share → Publish**
3. Set environment variables:
   - `VITE_API_URL` - Your backend URL (from above)
   - `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID

## Verify It Works

1. After deploying both frontend and backend:
2. Open your deployed Lovable app
3. Create a test task
4. Refresh the page
5. The task should still be there ✅

## Data Backup (Important!)

Since you're using JSON files for storage, consider:

1. **Regular backups:** Export your `server/data/` folder periodically
2. **Database migration:** Consider migrating to a database (PostgreSQL, MongoDB) for better reliability
3. **Git ignore:** Your `server/data/` is already in `.gitignore` (good!)

## Troubleshooting

### Tasks not saving?
- Check that `VITE_API_URL` is set correctly in Lovable
- Verify your backend is running and accessible
- Check browser console for API errors

### CORS errors?
- Make sure your backend has CORS enabled (it does by default)
- Verify the backend URL is correct

### Backend not starting?
- Check that `server/data/` directory is writable
- Verify Node.js version (should be 18+)
- Check backend logs for errors

## Current Limitations

- **Single user:** No authentication (data is shared if backend is public)
- **JSON storage:** Not ideal for production (consider database migration)
- **No backups:** Manual backup required

## Future Improvements

Consider migrating to:
- **Supabase** (free tier available)
- **PostgreSQL** database
- **User authentication** for multi-user support

