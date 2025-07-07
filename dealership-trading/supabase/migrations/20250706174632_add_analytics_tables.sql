-- Analytics cache table for storing API responses
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'vehicle_analysis', 
    'regional_trends', 
    'market_position',
    'competitor_analysis'
  )),
  api_source TEXT NOT NULL CHECK (api_source IN (
    'marketcheck', 
    'dataforseo', 
    'combined'
  )),
  request_params JSONB NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  hit_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
CREATE INDEX idx_analytics_cache_type ON analytics_cache(data_type);

-- Usage tracking for monitoring and billing
CREATE TABLE analytics_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  location_id UUID REFERENCES dealership_locations(id),
  endpoint TEXT NOT NULL,
  api_calls JSONB DEFAULT '{}', -- {"marketcheck": 5, "dataforseo": 3}
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for usage queries
CREATE INDEX idx_analytics_usage_user ON analytics_usage(user_id);
CREATE INDEX idx_analytics_usage_location ON analytics_usage(location_id);
CREATE INDEX idx_analytics_usage_created ON analytics_usage(created_at);

-- Saved reports for quick access
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'vehicle_analysis',
    'market_overview',
    'regional_insights',
    'custom'
  )),
  parameters JSONB NOT NULL,
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron TEXT,
  last_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for report queries
CREATE INDEX idx_analytics_reports_user ON analytics_reports(user_id);
CREATE INDEX idx_analytics_reports_type ON analytics_reports(report_type);

-- User preferences for analytics
CREATE TABLE analytics_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  default_radius INTEGER DEFAULT 50, -- miles
  preferred_charts JSONB DEFAULT '["bar", "line", "pie"]',
  email_reports BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for analytics tables
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_preferences ENABLE ROW LEVEL SECURITY;

-- Analytics cache is read-only for all authenticated users
CREATE POLICY analytics_cache_read ON analytics_cache
  FOR SELECT
  USING (true);

-- Usage tracking is readable by users for their own data
CREATE POLICY analytics_usage_read ON analytics_usage
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Reports are private to users unless admin
CREATE POLICY analytics_reports_read ON analytics_reports
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY analytics_reports_write ON analytics_reports
  FOR ALL
  USING (auth.uid() = user_id);

-- Preferences are private to each user
CREATE POLICY analytics_preferences_read ON analytics_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY analytics_preferences_write ON analytics_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean cache (requires pg_cron extension)
-- This would be run separately: SELECT cron.schedule('clean-analytics-cache', '0 * * * *', 'SELECT clean_expired_analytics_cache();');