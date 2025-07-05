# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name (e.g., "round-table-production")
3. Set a strong database password and save it securely
4. Select the region closest to your users

## 2. Run the Database Schema

1. Once your project is created, go to the SQL Editor
2. Copy the entire contents of `/supabase/schema.sql`
3. Paste and run the SQL in the editor
4. Verify all tables were created successfully

## 3. Configure Environment Variables

Update your `.env.local` file with the Supabase credentials:

```bash
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Enable Google OAuth in Supabase (Optional)

If you want to use Supabase Auth instead of NextAuth:

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set the redirect URL in Google Console to:
   `https://[PROJECT_ID].supabase.co/auth/v1/callback`

## 5. Configure Row Level Security

The schema includes basic RLS policies. You may need to adjust them based on your authentication approach:

- If using NextAuth: Policies will need to check against your users table
- If using Supabase Auth: Policies can use `auth.uid()` directly

## 6. Set Up Storage Bucket (for future vehicle images)

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called "vehicle-images"
3. Set it to public if images should be publicly accessible
4. Add RLS policies for upload permissions

## Next Steps

After completing this setup:
1. The authentication system will be converted to use Supabase
2. All queries will be migrated from GROQ to SQL
3. Real-time features will use Supabase subscriptions
4. Sanity dependencies will be removed