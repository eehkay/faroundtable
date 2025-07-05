-- Since we're using NextAuth instead of Supabase Auth, auth.uid() is always null
-- This causes RLS policies to block access even for authenticated users
-- We need to disable RLS on tables that have auth.uid() based policies

-- Disable RLS on vehicles table
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table  
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on activities table (if it has similar issues)
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- Disable RLS on comments table (if it has similar issues)
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Note: dealership_locations already has a public read policy, so it should work fine

-- Verify the changes
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname IN ('vehicles', 'users', 'activities', 'comments', 'transfers')
        AND relkind = 'r'
    LOOP
        RAISE NOTICE 'Table % - RLS enabled: %', table_record.relname, table_record.relrowsecurity;
    END LOOP;
END $$;