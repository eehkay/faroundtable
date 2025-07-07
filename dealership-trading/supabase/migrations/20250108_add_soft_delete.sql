-- Add soft delete support for vehicles
-- This migration adds a removed_from_feed_at column and updates the status constraint

-- Add the removed_from_feed_at column
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS removed_from_feed_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_vehicles_removed_from_feed_at 
ON vehicles(removed_from_feed_at) 
WHERE removed_from_feed_at IS NOT NULL;

-- Update the status check constraint to include 'removed'
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('available', 'claimed', 'in-transit', 'delivered', 'removed'));

-- Add comment for documentation
COMMENT ON COLUMN vehicles.removed_from_feed_at IS 'Timestamp when vehicle was first detected as missing from inventory feed. Used for 30-day soft delete grace period.';

-- Update any existing vehicles that might need this field
-- (This is a no-op for new installations)
UPDATE vehicles 
SET removed_from_feed_at = NULL 
WHERE removed_from_feed_at IS NOT NULL;