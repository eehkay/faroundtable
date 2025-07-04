# Google OAuth Setup Guide

## Quick Setup Steps

### 1. Create Google Cloud Project
- Go to https://console.cloud.google.com/
- Create new project named "Round Table"

### 2. Enable Google+ API
- Navigate to APIs & Services → Library
- Search for "Google+ API"
- Click Enable

### 3. Configure OAuth Consent Screen
- Go to APIs & Services → OAuth consent screen
- Choose "Internal" for organization-only access
- Fill in required fields:
  - App name: Round Table
  - Support email: your-email@company.com
  - Developer email: your-email@company.com
- Save and continue through all steps

### 4. Create OAuth Credentials
- Go to APIs & Services → Credentials
- Click "Create Credentials" → "OAuth client ID"
- Choose "Web application"
- Name: "Round Table Web Client"

Add these URLs:

**Authorized JavaScript origins:**
- http://localhost:3000
- https://your-app-name.netlify.app

**Authorized redirect URIs:**
- http://localhost:3000/api/auth/callback/google
- https://your-app-name.netlify.app/api/auth/callback/google

### 5. Domain Restriction (Important!)

To restrict sign-ins to your company domain, the system uses two methods:

1. **OAuth HD Parameter**: In the code, it sets `hd: ALLOWED_DOMAINS[0]` which hints to Google to show only accounts from that domain
2. **Server-side Validation**: The NextAuth callbacks verify the email domain matches your allowed domains

### 6. Update .env.local

Copy your credentials to `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Allowed Email Domains (comma-separated)
ALLOWED_DOMAINS=yourdealership.com,subsidiary.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-string-here
```

To generate NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

### 7. Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000
3. You should be redirected to /login
4. Click "Sign in with Google"
5. You should see Google's sign-in page
6. Only emails from your allowed domains will be accepted

## Troubleshooting

### "Access Denied" Error
- Check that your email domain matches one in ALLOWED_DOMAINS
- Ensure the user exists in Sanity and is active

### "Configuration" Error
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Check that NEXTAUTH_URL matches your current URL

### Redirect URI Mismatch
- The redirect URI must match EXACTLY what's in Google Console
- Check for trailing slashes or http vs https

### For Production

When deploying to Netlify:

1. Update NEXTAUTH_URL to your production URL
2. Add production URLs to Google OAuth settings
3. Generate a new NEXTAUTH_SECRET for production
4. Set all environment variables in Netlify dashboard

## Security Notes

- The "Internal" OAuth consent screen type restricts to G Suite/Workspace domains
- Server-side domain validation provides additional security
- Users are created in Sanity on first login with 'sales' role
- Admins can deactivate users in Sanity to prevent access