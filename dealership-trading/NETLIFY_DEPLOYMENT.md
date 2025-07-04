# Netlify Deployment Guide for Round Table

## Prerequisites

1. A Netlify account
2. All required environment variables configured
3. Sanity.io project set up
4. Google OAuth credentials configured

## Deployment Steps

### 1. Connect to GitHub

1. Log in to Netlify
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and authorize access
4. Select the `faroundtable` repository
5. Set the base directory to `dealership-trading`

### 2. Build Settings

The `netlify.toml` file already configures:
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 20
- Functions directory: `netlify/functions`

### 3. Environment Variables

Add these required environment variables in Netlify:

**Authentication:**
- `NEXTAUTH_URL` - Your Netlify URL (e.g., https://your-site.netlify.app)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `ALLOWED_DOMAINS` - delmaradv.com,formanautomotive.com

**Sanity.io:**
- `SANITY_PROJECT_ID` - Your Sanity project ID
- `SANITY_DATASET` - production
- `SANITY_API_TOKEN` - Create in Sanity with write permissions
- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Same as SANITY_PROJECT_ID
- `NEXT_PUBLIC_SANITY_DATASET` - production

**SFTP (for CSV imports):**
- `SFTP_HOST` - Your SFTP server
- `SFTP_PORT` - 22
- `SFTP_USERNAME` - SFTP username
- `SFTP_PASSWORD` - SFTP password

**Email (Optional):**
- `RESEND_API_KEY` - From Resend dashboard
- `EMAIL_FROM` - noreply@yourdomain.com

### 4. Deploy

1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at the provided Netlify URL

### 5. Post-Deployment

1. Update `NEXTAUTH_URL` to match your final URL
2. Add your Netlify URL to Google OAuth authorized redirect URIs
3. Test the login flow
4. Verify the scheduled import function is registered

## Important Notes

- The scheduled import function runs daily at 2 AM
- Ensure your Sanity dataset has proper CORS settings for your Netlify domain
- The site uses ISR (Incremental Static Regeneration) for optimal performance
- All API routes are serverless functions

## Troubleshooting

- If builds fail, check Node version compatibility
- For auth issues, verify NEXTAUTH_URL matches your site URL exactly
- For Sanity connection issues, check CORS settings and API token permissions