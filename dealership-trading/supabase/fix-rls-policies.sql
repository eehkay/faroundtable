-- Fix RLS policies for vehicles table
-- This allows authenticated users to view all vehicles

-- First, check if RLS is enabled (it is)
-- If not enabled, you would run: ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on vehicles table
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Service role can do everything" ON vehicles;

-- Create a policy that allows all authenticated users to view vehicles
CREATE POLICY "Authenticated users can view vehicles" 
ON vehicles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Optional: Create policies for other operations if needed
-- For now, we'll keep insert/update/delete restricted to service role

-- Verify the policy was created
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'vehicles';

-- Test that it works
-- This should now return results when using the anon key