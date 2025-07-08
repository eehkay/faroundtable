-- Create import_logs table to track CSV import history
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  vehicles_imported INTEGER DEFAULT 0,
  vehicles_updated INTEGER DEFAULT 0,
  vehicles_deleted INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_logs_timestamp ON import_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_import_logs_success ON import_logs(success);

-- Add comment
COMMENT ON TABLE import_logs IS 'Tracks the history of vehicle inventory CSV imports from dealerships';