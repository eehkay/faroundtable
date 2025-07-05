-- Since we can't use CURRENT_TIMESTAMP in a generated column,
-- let's keep days_on_lot as a regular column and create a view
-- or calculate it in queries

-- First ensure the column exists as a regular column
ALTER TABLE vehicles DROP COLUMN IF EXISTS days_on_lot;
ALTER TABLE vehicles ADD COLUMN days_on_lot INTEGER;

-- Create a view that calculates days_on_lot dynamically
CREATE OR REPLACE VIEW vehicles_with_days AS
SELECT 
  *,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - imported_at)::INTEGER as calculated_days_on_lot
FROM vehicles;

-- For now, let's just update the column with current values
-- (You can run this periodically or use a trigger)
UPDATE vehicles 
SET days_on_lot = EXTRACT(DAY FROM CURRENT_TIMESTAMP - imported_at)::INTEGER
WHERE imported_at IS NOT NULL;

-- Verify the update worked
SELECT 
  stock_number, 
  imported_at, 
  days_on_lot,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - imported_at)::INTEGER as calculated_days
FROM vehicles 
LIMIT 5;