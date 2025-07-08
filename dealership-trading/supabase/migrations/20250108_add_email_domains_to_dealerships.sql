-- Add email_domains field to dealership_locations table
ALTER TABLE dealership_locations 
ADD COLUMN email_domains TEXT[] DEFAULT '{}';

-- Add index for faster domain lookups
CREATE INDEX idx_dealership_email_domains ON dealership_locations USING GIN (email_domains);

-- Add some example domain mappings
UPDATE dealership_locations 
SET email_domains = ARRAY['unitednissan.com']
WHERE LOWER(name) LIKE '%united nissan%' AND LOWER(name) NOT LIKE '%reno%';

UPDATE dealership_locations 
SET email_domains = ARRAY['unitednissanreno.com']
WHERE LOWER(name) LIKE '%united nissan%' AND LOWER(name) LIKE '%reno%';

-- Comment for documentation
COMMENT ON COLUMN dealership_locations.email_domains IS 'Email domains associated with this dealership for automatic user assignment during login';