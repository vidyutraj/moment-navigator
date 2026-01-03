# Fix: Invalid Client ID Error

## The Problem

You're using a **Client Secret** (`GOCSPX-...`) instead of a **Client ID**.

Google OAuth Client IDs look like: `xxxxx-yyyyy.apps.googleusercontent.com`
Client Secrets look like: `GOCSPX-xxxxx` (which is what you currently have)

## How to Fix

### Step 1: Get Your Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID (under "OAuth 2.0 Client IDs")
5. Click on it to view details
6. **Copy the "Client ID"** (NOT the Client Secret)
   - Should look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

### Step 2: Update Your .env File

Replace the Client Secret with the Client ID:

```
VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

**Important:**
- No quotes around the value
- No spaces before or after the `=`
- Must end with `.apps.googleusercontent.com`

### Step 3: Restart Your Dev Server

```bash
# Stop server (Ctrl+C), then:
npm run dev
```

### Step 4: Verify It's Loaded

In browser console, you should see:
```
✓ Google Calendar Client ID loaded: ...
```

Instead of:
```
⚠ Google OAuth Client ID not configured...
```

### Step 5: Try Connecting Again

Click "Connect Calendar" - it should work now!

## Common Mistakes

❌ **Wrong:** `GOCSPX-xxxxx` (This is a Client Secret)  
✅ **Right:** `xxxxx.apps.googleusercontent.com` (This is a Client ID)

❌ **Wrong:** `VITE_GOOGLE_CLIENT_ID="123.apps.googleusercontent.com"` (quotes)  
✅ **Right:** `VITE_GOOGLE_CLIENT_ID=123.apps.googleusercontent.com` (no quotes)

