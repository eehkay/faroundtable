-- Create AI settings table for storing system prompts and model configurations
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4-turbo-preview',
  system_prompt TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000 CHECK (max_tokens > 0 AND max_tokens <= 4000),
  response_format TEXT DEFAULT 'text' CHECK (response_format IN ('text', 'json')),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Ensure only one default prompt
CREATE UNIQUE INDEX idx_ai_settings_default ON public.ai_settings(is_default) WHERE is_default = true;

-- Add RLS policies
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all settings
CREATE POLICY "Admins can view AI settings" ON public.ai_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can insert settings
CREATE POLICY "Admins can insert AI settings" ON public.ai_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update settings
CREATE POLICY "Admins can update AI settings" ON public.ai_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can delete settings
CREATE POLICY "Admins can delete AI settings" ON public.ai_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create audit log table for AI settings changes
CREATE TABLE IF NOT EXISTS public.ai_settings_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_id UUID REFERENCES public.ai_settings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to audit table
ALTER TABLE public.ai_settings_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view AI settings audit" ON public.ai_settings_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_settings_updated_at();

-- Create audit trigger
CREATE OR REPLACE FUNCTION audit_ai_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ai_settings_audit (setting_id, action, new_values, changed_by)
    VALUES (NEW.id, 'create', to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.ai_settings_audit (setting_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.ai_settings_audit (setting_id, action, old_values, changed_by)
    VALUES (OLD.id, 'delete', to_jsonb(OLD), auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_settings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION audit_ai_settings_changes();

-- Insert default AI settings
INSERT INTO public.ai_settings (
  name, 
  description, 
  model, 
  system_prompt, 
  temperature,
  is_default,
  is_active
) VALUES (
  'Default Market Analyst',
  'Standard market analysis prompt for vehicle trend reports',
  'gpt-4-turbo-preview',
  'You are an expert automotive market analyst with deep knowledge of:
- Vehicle pricing strategies and market dynamics
- Inventory management and supply/demand analysis
- Regional market trends and consumer behavior
- Competitive landscape analysis
- Search trend interpretation and demand forecasting

Analyze the provided market trend report data and provide actionable insights. Focus on:
1. Key opportunities and risks
2. Strategic recommendations
3. Market timing considerations
4. Competitive positioning strategies
5. Pricing optimization suggestions

Be specific, data-driven, and provide concrete action items.',
  0.7,
  true,
  true
), (
  'Aggressive Sales Strategist',
  'Focused on quick sales and aggressive pricing',
  'gpt-4-turbo-preview',
  'You are an aggressive automotive sales strategist focused on rapid inventory turnover. Your primary goals are:
- Maximize sales velocity
- Identify pricing sweet spots for quick sales
- Highlight urgency factors
- Recommend promotional strategies
- Focus on beating competition

Analyze the data with a bias toward action and quick results. Recommend bold moves when justified by the data.',
  0.8,
  false,
  true
), (
  'Premium Market Specialist',
  'For high-value vehicles and luxury market analysis',
  'gpt-4-turbo-preview',
  'You are a luxury automotive market specialist with expertise in:
- Premium vehicle positioning
- High-net-worth buyer psychology
- Luxury market trends
- Value preservation strategies
- Exclusive marketing approaches

Focus on maximizing profit margins rather than quick sales. Identify unique selling propositions and premium positioning opportunities.',
  0.7,
  false,
  true
);

-- Create index for faster lookups
CREATE INDEX idx_ai_settings_active ON public.ai_settings(is_active);
CREATE INDEX idx_ai_settings_name ON public.ai_settings(name);