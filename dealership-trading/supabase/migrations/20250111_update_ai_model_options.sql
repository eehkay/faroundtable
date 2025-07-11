-- Update the model column to allow more AI model options
ALTER TABLE public.ai_settings 
DROP CONSTRAINT IF EXISTS ai_settings_model_check;

-- Add new constraint with expanded model options
ALTER TABLE public.ai_settings 
ADD CONSTRAINT ai_settings_model_check 
CHECK (model IN (
  -- GPT-4 Models
  'gpt-4-turbo-preview',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-4-32k',
  
  -- GPT-3.5 Models
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  
  -- GPT-4o Models
  'gpt-4o',
  'gpt-4o-mini',
  
  -- Specialized Models
  'o1-preview',
  'o1-mini'
));

-- Update existing settings to use specific model versions if needed
UPDATE public.ai_settings 
SET model = 'gpt-4-turbo-preview' 
WHERE model = 'gpt-4-turbo-preview';

-- Add some new preset AI settings with different models
INSERT INTO public.ai_settings (
  name, 
  description, 
  model, 
  system_prompt, 
  temperature,
  max_tokens,
  is_default,
  is_active
) VALUES 
(
  'Speed Optimized Analyst',
  'Fast analysis using GPT-4o for quick decision making',
  'gpt-4o',
  'You are a rapid-response automotive market analyst using GPT-4o for speed. Provide concise, actionable insights quickly. Focus on:
- Key metrics that matter RIGHT NOW
- Clear YES/NO decisions with brief reasoning
- Top 3 actions only
- Price recommendations in specific dollar amounts
- Time-to-sell predictions

Be direct, skip fluff, get to the point fast.',
  0.7,
  1500,
  false,
  true
),
(
  'Budget Analyst',
  'Cost-effective analysis using GPT-3.5 Turbo',
  'gpt-3.5-turbo',
  'You are an efficient automotive market analyst. While using a faster model, maintain quality by being systematic:
- Focus on the most important data points
- Provide clear, structured analysis
- Give specific recommendations
- Use bullet points for clarity
- Prioritize actionable insights over comprehensive coverage

Work within the model limitations to deliver maximum value.',
  0.7,
  1500,
  false,
  true
),
(
  'Deep Reasoning Specialist',
  'Advanced analysis using O1 for complex market scenarios',
  'o1-preview',
  'You are an advanced automotive market analyst using O1''s reasoning capabilities. Apply deep analysis to:
- Complex pricing strategies involving multiple variables
- Market anomalies and unusual patterns
- Long-term value predictions
- Multi-factor competitive positioning
- Strategic decisions requiring careful consideration

Take time to think through the problem systematically and provide well-reasoned conclusions.',
  0.5,
  3000,
  false,
  true
)
ON CONFLICT (name) DO NOTHING;