# Setup Checklist

## Google OAuth Setup
- [ ] Created Google Cloud Project
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen as "Internal"
- [ ] Created OAuth 2.0 credentials
- [ ] Added localhost redirect URIs
- [ ] Added production redirect URIs
- [ ] Copied Client ID to .env.local
- [ ] Copied Client Secret to .env.local
- [ ] Set ALLOWED_DOMAINS in .env.local
- [ ] Generated NEXTAUTH_SECRET with `openssl rand -base64 32`

## Important URLs to Add in Google Console

### Authorized JavaScript Origins:
- `http://localhost:3000`
- `https://[your-netlify-subdomain].netlify.app`

### Authorized Redirect URIs:
- `http://localhost:3000/api/auth/callback/google`
- `https://[your-netlify-subdomain].netlify.app/api/auth/callback/google`

## Testing Checklist
- [ ] Run `npm run dev`
- [ ] Navigate to http://localhost:3000
- [ ] Redirected to /login page
- [ ] Click "Sign in with Google"
- [ ] Google sign-in page appears
- [ ] Sign in with company email
- [ ] Successfully authenticated and redirected

## Common Issues

1. **Redirect URI mismatch**: Make sure the URI in Google Console matches EXACTLY (including trailing slashes)
2. **Access denied**: Check email domain is in ALLOWED_DOMAINS
3. **Internal users only**: If using "Internal" consent screen, only G Suite/Workspace users can sign in