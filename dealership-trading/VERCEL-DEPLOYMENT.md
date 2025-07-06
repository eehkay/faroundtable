# Vercel Deployment Guide

This guide helps you deploy Round Table to Vercel.

## Prerequisites

1. A Vercel account
2. Google OAuth credentials configured
3. Supabase project set up
4. (Optional) Resend account for email notifications

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add these Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://faroundtable.vercel.app/api/auth/callback/google
   https://your-custom-domain.com/api/auth/callback/google
   ```
6. Add your domains to Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://faroundtable.vercel.app
   https://your-custom-domain.com
   ```

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```bash
# NextAuth
NEXTAUTH_URL=https://faroundtable.vercel.app  # Your Vercel URL
NEXTAUTH_SECRET=your-secret-here              # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Allowed Domains
ALLOWED_DOMAINS=delmaradv.com,formanautomotive.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional Variables

```bash
# Email Notifications (if using)
RESEND_API_KEY=re_your-api-key
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Market Insights API (if using)
AUTODEALERDATA_API_URL=https://api.autodealerdata.com
AUTODEALERDATA_API_KEY_ID=your-key-id
AUTODEALERDATA_API_KEY=your-key
```

## Deployment Steps

1. **Connect GitHub Repository**
   - In Vercel, click "New Project"
   - Import your GitHub repository
   - Select the `dealership-trading` directory as the root

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Add all required variables listed above
   - Make sure to set them for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Post-Deployment

1. **Test Authentication**
   - Visit your deployment URL
   - Try logging in with a Google account from allowed domains

2. **Custom Domain (Optional)**
   - Add your custom domain in Vercel settings
   - Update `NEXTAUTH_URL` to your custom domain
   - Add custom domain to Google OAuth redirect URIs

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure the exact redirect URI is added to Google Cloud Console
- Check that `NEXTAUTH_URL` matches your deployment URL
- Wait a few minutes for Google's changes to propagate

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set and secure
- Check that user's email domain is in `ALLOWED_DOMAINS`
- Ensure Google OAuth credentials are correct

### Database Connection Issues
- Verify Supabase credentials are correct
- Check that Supabase project is active
- Ensure service role key has proper permissions

## Security Notes

- Never commit `.env.local` files
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use strong `NEXTAUTH_SECRET` (32+ characters)
- Regularly rotate API keys