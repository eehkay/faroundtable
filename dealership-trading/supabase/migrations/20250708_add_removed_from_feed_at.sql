-- Add removed_from_feed_at column to track when vehicles disappear from inventory feeds
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS removed_from_feed_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance when querying removed vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_removed_from_feed_at 
ON vehicles(removed_from_feed_at) 
WHERE removed_from_feed_at IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN vehicles.removed_from_feed_at IS 'Timestamp when the vehicle was no longer found in the dealership inventory feed. Used to track vehicles that may have been sold or transferred outside the system.';