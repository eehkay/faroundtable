-- Fix days_on_lot to be a generated column
-- This converts the regular column to a computed column that automatically calculates days on lot

-- First drop the existing column
ALTER TABLE vehicles DROP COLUMN IF EXISTS days_on_lot;

-- Then add it back as a generated column
ALTER TABLE vehicles ADD COLUMN days_on_lot INTEGER GENERATED ALWAYS AS (
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - imported_at)::INTEGER
) STORED;

-- Verify the column was created correctly
SELECT 
  column_name, 
  data_type, 
  is_generated,
  generation_expression
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'days_on_lot';

-- Test that it works by selecting a few vehicles
SELECT 
  stock_number, 
  imported_at, 
  days_on_lot,
  CURRENT_TIMESTAMP as current_time
FROM vehicles 
LIMIT 5;