-- Add latitude and longitude columns to dealership_locations table
ALTER TABLE dealership_locations
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add city_state column for Market Check API compatibility
ALTER TABLE dealership_locations
ADD COLUMN IF NOT EXISTS city_state TEXT;

-- Create an index on coordinates for geospatial queries
CREATE INDEX IF NOT EXISTS idx_dealership_locations_coordinates 
ON dealership_locations (latitude, longitude);

-- Update existing dealership locations with coordinates
-- These are approximate coordinates for each location based on their typical areas
UPDATE dealership_locations
SET latitude = CASE
    WHEN code = 'MP18527' THEN 33.0369  -- Store 1 (Phoenix area)
    WHEN code = 'MP18528' THEN 33.4484  -- Store 2 (Phoenix area)
    WHEN code = 'MP18529' THEN 33.5651  -- Store 3 (Scottsdale area)
    WHEN code = 'MP18530' THEN 32.2217  -- Store 4 (Tucson area)
    WHEN code = 'MP18531' THEN 33.3528  -- Store 5 (Phoenix area)
    ELSE latitude
END,
longitude = CASE
    WHEN code = 'MP18527' THEN -117.1311  -- Store 1
    WHEN code = 'MP18528' THEN -112.0740  -- Store 2
    WHEN code = 'MP18529' THEN -111.8983  -- Store 3
    WHEN code = 'MP18530' THEN -110.9698  -- Store 4
    WHEN code = 'MP18531' THEN -111.7892  -- Store 5
    ELSE longitude
END,
city_state = CASE
    WHEN code = 'MP18527' THEN 'phoenix|AZ'
    WHEN code = 'MP18528' THEN 'phoenix|AZ'
    WHEN code = 'MP18529' THEN 'scottsdale|AZ'
    WHEN code = 'MP18530' THEN 'tucson|AZ'
    WHEN code = 'MP18531' THEN 'phoenix|AZ'
    ELSE city_state
END
WHERE code IN ('MP18527', 'MP18528', 'MP18529', 'MP18530', 'MP18531');

-- Add comments for documentation
COMMENT ON COLUMN dealership_locations.latitude IS 'Latitude coordinate for the dealership location';
COMMENT ON COLUMN dealership_locations.longitude IS 'Longitude coordinate for the dealership location';
COMMENT ON COLUMN dealership_locations.city_state IS 'City and state in format: city|STATE for Market Check API';