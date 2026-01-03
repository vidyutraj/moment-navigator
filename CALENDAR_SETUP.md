# Google Calendar Sync Setup

Clarity can optionally sync with your Google Calendar to suggest better time windows for recommendations. This is completely optional - the app works great without it!

## How It Works

- **Read-only access**: Clarity only reads your calendar to suggest when your next event is
- **User always in control**: You can always override any calendar suggestion
- **No auto-scheduling**: Clarity never modifies your calendar
- **Privacy**: All calendar data is handled locally and never stored on servers

## Setup Instructions

### Step 1: Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:8080` (for local development - based on your vite config)
     - `http://localhost:5173` (also add this if you change the port)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Add authorized redirect URIs:
     - `http://localhost:8080` (for local development)
     - Your production domain (e.g., `https://yourdomain.com`)
     - Note: For OAuth token flow, redirect URIs can be the same as origins
   - Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### Step 2: Configure Your App

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Add your Client ID to `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

### Step 3: Connect Your Calendar

1. Click the "Connect Calendar" button in the app header
2. Sign in with your Google account
3. Grant permission for read-only calendar access
4. You're done! The calendar will now be used to suggest time windows

## Manual Token (Development Only)

If you want to test without setting up OAuth, you can manually enter a token in the browser console:

```javascript
import { setCalendarToken } from '@/services/calendar';
setCalendarToken('your-access-token-here');
```

To get a token manually:
1. Use [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Select "Calendar API v3" > "https://www.googleapis.com/auth/calendar.readonly"
3. Authorize and exchange for tokens
4. Copy the access token

**Note**: Manual tokens expire after 1 hour. For production use, set up proper OAuth as described above.

## Disconnecting

Click "Disconnect" in the header to remove calendar access at any time.

## Troubleshooting

- **"Connect Calendar" button does nothing**: Make sure `VITE_GOOGLE_CLIENT_ID` is set in your `.env` file
- **"Invalid client" error**: Check that your Client ID is correct and authorized origins include your domain
- **Calendar suggestions not showing**: Make sure you have upcoming events in your calendar within the next 24 hours

