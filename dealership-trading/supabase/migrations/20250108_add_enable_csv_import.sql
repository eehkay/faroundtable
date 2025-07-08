-- Add enable_csv_import field to dealership_locations table
ALTER TABLE dealership_locations 
ADD COLUMN enable_csv_import BOOLEAN DEFAULT true;

-- Set Corporate HQ to not import CSV
UPDATE dealership_locations 
SET enable_csv_import = false
WHERE code = 'CORP';

-- Comment for documentation
COMMENT ON COLUMN dealership_locations.enable_csv_import IS 'Whether this dealership participates in automated CSV imports';