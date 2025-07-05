# Environment Variables Setup

This guide explains the environment variables needed for Round Table.

## Required Variables

### Authentication
- `NEXTAUTH_URL` - Your application URL (e.g., `http://localhost:3000` for development)
- `NEXTAUTH_SECRET` - Secret key for NextAuth. Generate with: `openssl rand -base64 32`

### Google OAuth
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `ALLOWED_DOMAINS` - Comma-separated list of allowed email domains

### Supabase Database
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key (safe for browser)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, keep secret!)

## Optional Variables

### Email Notifications (Resend)
Only needed if you want to send email notifications:
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM_EMAIL` - Email address to send from

### SFTP Configuration
These will be used in GitHub Actions for CSV imports (not used in the app directly):
- `SFTP_HOST` - SFTP server hostname
- `SFTP_USERNAME` - SFTP username
- `SFTP_PASSWORD` - SFTP password
- `SFTP_PORT` - SFTP port (default: 22)
- `SFTP_PATH` - Path to CSV files on SFTP server

## Setup Steps

1. Copy `.env.example` to `.env.local`
2. Fill in all required variables
3. Add optional variables as needed
4. Never commit `.env.local` to version control

## Production Deployment

For Netlify/Vercel deployment:
1. Add all required variables to your deployment platform
2. Update `NEXTAUTH_URL` to your production URL
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is kept secret
4. Configure Google OAuth redirect URLs for your production domain