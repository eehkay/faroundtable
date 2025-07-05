-- First, check current RLS status and policies
DO $$
BEGIN
    RAISE NOTICE 'Current RLS status for transfers table: %', 
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'transfers');
END $$;

-- Drop ALL existing policies on transfers table
DROP POLICY IF EXISTS "Authenticated users can create transfers" ON transfers;
DROP POLICY IF EXISTS "Authenticated users can view transfers" ON transfers;
DROP POLICY IF EXISTS "Users can update own transfers or managers can update any" ON transfers;

-- Ensure RLS is disabled (redundant but explicit)
ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;

-- Verify no policies remain
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'transfers' AND schemaname = 'public';
    
    RAISE NOTICE 'Remaining policies on transfers table: %', policy_count;
END $$;