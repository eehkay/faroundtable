-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view transfers" ON transfers;

-- Since we're using NextAuth, not Supabase Auth, we need different RLS approach
-- Option 1: Disable RLS for transfers table (simplest for NextAuth)
ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS, create policies that don't rely on auth.uid()
-- This would require passing user context differently, which is complex with NextAuth

-- For now, we'll disable RLS since authentication is handled by NextAuth middleware
-- and all database access goes through authenticated API routes