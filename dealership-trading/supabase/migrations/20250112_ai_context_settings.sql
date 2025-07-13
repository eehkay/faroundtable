-- Create AI context settings table for storing editable context templates
CREATE TABLE IF NOT EXISTS public.ai_context_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_position_context TEXT NOT NULL DEFAULT 'This section contains price prediction data comparing the vehicle''s current price to market predictions. ''raw'' contains unprocessed API responses, ''processed'' contains calculated values. Key metrics: predicted_price, confidence level, price_range (market bounds)',
  inventory_analysis_context TEXT NOT NULL DEFAULT 'Market Day Supply (MDS) indicates how many days of inventory exist based on current sales rate. Lower MDS = higher demand/scarcity, Higher MDS = oversupply. inventory_count: current listings, sales_count: recent sales used for MDS calculation',
  regional_performance_context TEXT NOT NULL DEFAULT 'Historical sales data for this vehicle type in the specified city/region. Includes pricing statistics, mileage averages, and days on market trends. ''count'' represents historical sales volume in this market',
  competitive_landscape_context TEXT NOT NULL DEFAULT 'Shows competing inventory within the search radius. Limited to top 20 vehicles to reduce data size. Includes pricing, mileage, distance from location, and days on market. totalCount shows full inventory size even though listings are limited',
  demand_analysis_context TEXT NOT NULL DEFAULT 'Based on keyword search volume data from DataForSEO. Shows consumer interest through search queries. Vehicle-specific keywords indicate direct interest in this model. Generic keywords show general market activity',
  include_context BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Add RLS policies
ALTER TABLE public.ai_context_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view context settings (they're used in analysis)
CREATE POLICY "Anyone can view AI context settings" ON public.ai_context_settings
  FOR SELECT
  USING (true);

-- Only admins can update context settings
CREATE POLICY "Admins can update AI context settings" ON public.ai_context_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can insert context settings (should only be one row)
CREATE POLICY "Admins can insert AI context settings" ON public.ai_context_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_context_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_context_settings_timestamp
    BEFORE UPDATE ON public.ai_context_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_context_settings_updated_at();

-- Insert default context settings
INSERT INTO public.ai_context_settings (
  market_position_context,
  inventory_analysis_context,
  regional_performance_context,
  competitive_landscape_context,
  demand_analysis_context,
  include_context
) VALUES (
  'This section contains price prediction data comparing the vehicle''s current price to market predictions. ''raw'' contains unprocessed API responses, ''processed'' contains calculated values. Key metrics: predicted_price, confidence level, price_range (market bounds)',
  'Market Day Supply (MDS) indicates how many days of inventory exist based on current sales rate. Lower MDS = higher demand/scarcity, Higher MDS = oversupply. inventory_count: current listings, sales_count: recent sales used for MDS calculation',
  'Historical sales data for this vehicle type in the specified city/region. Includes pricing statistics, mileage averages, and days on market trends. ''count'' represents historical sales volume in this market',
  'Shows competing inventory within the search radius. Limited to top 20 vehicles to reduce data size. Includes pricing, mileage, distance from location, and days on market. totalCount shows full inventory size even though listings are limited',
  'Based on keyword search volume data from DataForSEO. Shows consumer interest through search queries. Vehicle-specific keywords indicate direct interest in this model. Generic keywords show general market activity',
  true
) ON CONFLICT DO NOTHING;

-- Add a unique constraint to ensure only one row exists
CREATE UNIQUE INDEX idx_ai_context_settings_single_row ON public.ai_context_settings ((true));

-- Create audit log table for context changes
CREATE TABLE IF NOT EXISTS public.ai_context_settings_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES public.users(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT
);

-- Add index for audit lookups
CREATE INDEX idx_ai_context_settings_audit_changed_at ON public.ai_context_settings_audit(changed_at DESC);

-- Grant select on audit table to admins only
ALTER TABLE public.ai_context_settings_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AI context audit log" ON public.ai_context_settings_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );