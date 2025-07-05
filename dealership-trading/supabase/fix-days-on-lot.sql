-- Fix days_on_lot to be a generated column
ALTER TABLE vehicles DROP COLUMN days_on_lot;

ALTER TABLE vehicles ADD COLUMN days_on_lot INTEGER GENERATED ALWAYS AS (
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - imported_at)
) STORED;