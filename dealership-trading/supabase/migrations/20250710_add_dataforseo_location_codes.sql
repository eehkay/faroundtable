-- Add DataForSEO location code column to dealership_locations table
ALTER TABLE dealership_locations
ADD COLUMN IF NOT EXISTS dataforseo_location_code INTEGER;

-- Create an index on the location code for queries
CREATE INDEX IF NOT EXISTS idx_dealership_locations_dataforseo_code 
ON dealership_locations (dataforseo_location_code);

-- Update existing dealership locations with correct Las Vegas/Reno data and DataForSEO codes
-- Note: The user specified these are the actual locations, not Phoenix/Tucson
UPDATE dealership_locations
SET 
  -- Las Vegas locations
  latitude = CASE
    WHEN code IN ('MP18527', 'MP18528', 'MP18529') THEN 36.1699  -- Las Vegas latitude
    WHEN code IN ('MP18530', 'MP18531') THEN 39.5296  -- Reno latitude
    ELSE latitude
  END,
  longitude = CASE
    WHEN code IN ('MP18527', 'MP18528', 'MP18529') THEN -115.1398  -- Las Vegas longitude
    WHEN code IN ('MP18530', 'MP18531') THEN -119.8138  -- Reno longitude
    ELSE longitude
  END,
  city = CASE
    WHEN code IN ('MP18527', 'MP18528', 'MP18529') THEN 'Las Vegas'
    WHEN code IN ('MP18530', 'MP18531') THEN 'Reno'
    ELSE city
  END,
  state = CASE
    WHEN code IN ('MP18527', 'MP18528', 'MP18529', 'MP18530', 'MP18531') THEN 'NV'
    ELSE state
  END,
  city_state = CASE
    WHEN code IN ('MP18527', 'MP18528', 'MP18529') THEN 'las-vegas|NV'
    WHEN code IN ('MP18530', 'MP18531') THEN 'reno|NV'
    ELSE city_state
  END,
  dataforseo_location_code = CASE
    WHEN code IN ('MP18527', 'MP18528', 'MP18529') THEN 9057131  -- Las Vegas location code
    WHEN code IN ('MP18530', 'MP18531') THEN 9058666  -- Reno location code (primary)
    ELSE dataforseo_location_code
  END,
  -- Update dealership names to reflect actual brands
  name = CASE
    WHEN code = 'MP18527' THEN 'United Kia'
    WHEN code = 'MP18528' THEN 'United Nissan Imperial'
    WHEN code = 'MP18529' THEN 'United Toyota'
    WHEN code = 'MP18530' THEN 'Store 4 - Reno'
    WHEN code = 'MP18531' THEN 'Store 5 - Reno'
    ELSE name
  END
WHERE code IN ('MP18527', 'MP18528', 'MP18529', 'MP18530', 'MP18531');

-- Add comment for documentation
COMMENT ON COLUMN dealership_locations.dataforseo_location_code IS 'DataForSEO location code for search volume data. Las Vegas: 9057131, Reno: 9058666/1022620';

-- Create a lookup table for secondary location codes (like Reno's second code)
CREATE TABLE IF NOT EXISTS dealership_location_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_location_id UUID NOT NULL REFERENCES dealership_locations(id) ON DELETE CASCADE,
  dataforseo_location_code INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dealership_location_id, dataforseo_location_code)
);

-- Insert secondary location codes for Reno dealerships
INSERT INTO dealership_location_codes (dealership_location_id, dataforseo_location_code, is_primary)
SELECT 
  dl.id,
  1022620,  -- Reno's secondary location code
  false
FROM dealership_locations dl
WHERE dl.code IN ('MP18530', 'MP18531')
ON CONFLICT DO NOTHING;

-- Also insert primary codes into the lookup table for consistency
INSERT INTO dealership_location_codes (dealership_location_id, dataforseo_location_code, is_primary)
SELECT 
  dl.id,
  dl.dataforseo_location_code,
  true
FROM dealership_locations dl
WHERE dl.dataforseo_location_code IS NOT NULL
ON CONFLICT DO NOTHING;