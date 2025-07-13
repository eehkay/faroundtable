-- Clean up hardcoded model entries since we now load models dynamically
-- This removes the OpenRouter-specific presets we added earlier

-- First, check if any of these presets are currently in use
DO $$
DECLARE
  models_in_use INTEGER;
BEGIN
  -- Count how many AI settings are using the OpenRouter presets
  SELECT COUNT(*) INTO models_in_use
  FROM public.ai_settings
  WHERE name IN (
    'Claude 3 Opus - Deep Analysis',
    'Claude 3.5 Sonnet - Fast & Smart',
    'Gemini Pro 1.5 - Multimodal Analysis',
    'Llama 3 70B - Open Source Expert',
    'Perplexity Online - Real-time Market Intel'
  );

  -- Only delete if these presets aren't being used
  IF models_in_use = 0 THEN
    DELETE FROM public.ai_settings
    WHERE name IN (
      'Claude 3 Opus - Deep Analysis',
      'Claude 3.5 Sonnet - Fast & Smart',
      'Gemini Pro 1.5 - Multimodal Analysis',
      'Llama 3 70B - Open Source Expert',
      'Perplexity Online - Real-time Market Intel'
    );
    
    RAISE NOTICE 'Cleaned up % hardcoded model presets', 5;
  ELSE
    RAISE NOTICE 'Skipping cleanup - % model presets are currently in use', models_in_use;
  END IF;
END $$;

-- Update any existing settings that use deprecated model IDs to ensure compatibility
-- This maps old hardcoded IDs to their current versions if they've changed

-- Update settings using old Anthropic model IDs (if any)
UPDATE public.ai_settings
SET model = 'anthropic/claude-3-opus'
WHERE model = 'anthropic/claude-3-opus-20240229'
  AND EXISTS (
    SELECT 1 FROM public.ai_settings 
    WHERE model = 'anthropic/claude-3-opus-20240229'
  );

UPDATE public.ai_settings
SET model = 'anthropic/claude-3.5-sonnet'
WHERE model = 'anthropic/claude-3.5-sonnet-20241022'
  AND EXISTS (
    SELECT 1 FROM public.ai_settings 
    WHERE model = 'anthropic/claude-3.5-sonnet-20241022'
  );

-- Add a comment about the dynamic model loading
COMMENT ON TABLE public.ai_settings IS 'AI model configurations for market analysis. Models are now loaded dynamically from OpenRouter API, no database constraints on model field.';