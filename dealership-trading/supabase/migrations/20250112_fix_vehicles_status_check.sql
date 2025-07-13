-- Fix vehicles_status_check constraint to include 'removed' status
-- This allows the import process to soft-delete vehicles by setting status to 'removed'

-- Drop the existing constraint
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Add the updated constraint with 'removed' status
ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'claimed', 'in-transit', 'delivered', 'removed'));

-- Add a comment to document the change
COMMENT ON CONSTRAINT vehicles_status_check ON vehicles IS 'Ensures vehicle status is one of: available, claimed, in-transit, delivered, or removed';