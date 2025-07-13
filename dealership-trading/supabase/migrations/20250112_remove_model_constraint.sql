-- Remove the model constraint to allow dynamic model selection
-- This enables using any model available from OpenRouter without database migrations

ALTER TABLE public.ai_settings 
DROP CONSTRAINT IF EXISTS ai_settings_model_check;

-- Add a comment explaining the change
COMMENT ON COLUMN public.ai_settings.model IS 'Model identifier - can be any valid OpenAI or OpenRouter model ID. OpenRouter models use provider/model format.';