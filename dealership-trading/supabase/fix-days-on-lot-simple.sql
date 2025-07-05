-- Simple fix: Keep days_on_lot as a regular INTEGER column
-- The CSV import will provide this value directly

-- Ensure the column exists as a regular INTEGER column
ALTER TABLE vehicles DROP COLUMN IF EXISTS days_on_lot;
ALTER TABLE vehicles ADD COLUMN days_on_lot INTEGER;

-- Update any NULL values to 0 for now
UPDATE vehicles 
SET days_on_lot = 0 
WHERE days_on_lot IS NULL;

-- Verify the column is set up correctly
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'days_on_lot';

-- Check a few vehicles
SELECT 
  stock_number, 
  imported_at, 
  days_on_lot
FROM vehicles 
LIMIT 10;