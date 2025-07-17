-- Add OpenRouter model options to the AI settings table
ALTER TABLE public.ai_settings 
DROP CONSTRAINT IF EXISTS ai_settings_model_check;

-- Add new constraint with OpenRouter models
ALTER TABLE public.ai_settings 
ADD CONSTRAINT ai_settings_model_check 
CHECK (model IN (
  -- OpenAI Models (Direct)
  'gpt-4-turbo-preview',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-4-32k',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-4o',
  'gpt-4o-mini',
  'o1-preview',
  'o1-mini',
  
  -- OpenRouter Models (Provider/Model format)
  -- OpenAI via OpenRouter
  'openai/gpt-4-turbo-preview',
  'openai/gpt-4-turbo',
  'openai/gpt-4',
  'openai/gpt-4-32k',
  'openai/gpt-3.5-turbo',
  'openai/gpt-3.5-turbo-16k',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/o1-preview',
  'openai/o1-mini',
  
  -- Anthropic Models
  'anthropic/claude-3-opus-20240229',
  'anthropic/claude-3-sonnet-20240229',
  'anthropic/claude-3-haiku-20240307',
  'anthropic/claude-3.5-sonnet-20241022',
  'anthropic/claude-3.5-haiku-20241022',
  
  -- Google Models
  'google/gemini-pro',
  'google/gemini-pro-1.5',
  'google/gemini-pro-1.5-flash',
  'google/gemini-ultra',
  
  -- Meta Llama Models
  'meta-llama/llama-3-70b-instruct',
  'meta-llama/llama-3-8b-instruct',
  'meta-llama/llama-3.1-405b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
  
  -- Mistral Models
  'mistralai/mistral-7b-instruct',
  'mistralai/mixtral-8x7b-instruct',
  'mistralai/mixtral-8x22b-instruct',
  'mistralai/mistral-large',
  
  -- Perplexity Models
  'perplexity/llama-3-sonar-large-32k-online',
  'perplexity/llama-3-sonar-small-32k-online',
  
  -- Other Notable Models
  'cohere/command-r-plus',
  'cohere/command-r',
  'databricks/dbrx-instruct',
  'together/llama-3-70b-instruct'
));

-- Add new AI setting presets with OpenRouter models
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
  'Claude 3 Opus - Deep Analysis',
  'Uses Anthropic Claude 3 Opus via OpenRouter for comprehensive market analysis',
  'anthropic/claude-3-opus-20240229',
  'You are Claude, an expert automotive market analyst with exceptional analytical capabilities. Your strengths include:
- Deep reasoning and nuanced understanding of complex market dynamics
- Ability to identify subtle patterns and correlations in data
- Comprehensive analysis that considers multiple perspectives
- Clear, well-structured recommendations with detailed justifications

Analyze the provided market trend report data with particular attention to:
1. Hidden opportunities that might not be immediately obvious
2. Risk factors and potential market shifts
3. Long-term value considerations beyond immediate pricing
4. Strategic positioning for maximum profitability
5. Data quality issues or inconsistencies that might affect decisions

Provide thorough analysis with specific, actionable recommendations backed by data.',
  0.7,
  3000,
  false,
  true
),
(
  'Claude 3.5 Sonnet - Fast & Smart',
  'Uses Claude 3.5 Sonnet for quick, intelligent analysis with excellent balance',
  'anthropic/claude-3.5-sonnet-20241022',
  'You are Claude, a highly capable automotive market analyst optimized for speed and accuracy. Focus on:
- Quick identification of key insights and opportunities
- Clear, concise recommendations with supporting data
- Practical strategies that can be implemented immediately
- Price optimization based on current market conditions
- Time-sensitive opportunities and risks

Deliver rapid but thorough analysis with emphasis on actionable insights.',
  0.7,
  2000,
  false,
  true
),
(
  'Gemini Pro 1.5 - Multimodal Analysis',
  'Uses Google Gemini Pro 1.5 for cost-effective analysis with strong capabilities',
  'google/gemini-pro-1.5',
  'You are an automotive market analyst powered by Gemini, specializing in data synthesis and pattern recognition. Your analysis should:
- Synthesize information from multiple data sources effectively
- Identify market trends and consumer behavior patterns
- Provide balanced recommendations considering various factors
- Highlight both immediate opportunities and longer-term strategies
- Use data visualization concepts to explain complex relationships

Focus on clarity and practical application of insights.',
  0.7,
  2000,
  false,
  true
),
(
  'Llama 3 70B - Open Source Expert',
  'Uses Meta Llama 3 70B for transparent, detailed analysis',
  'meta-llama/llama-3-70b-instruct',
  'You are an automotive market analyst using advanced open-source capabilities. Provide:
- Transparent reasoning for all recommendations
- Multiple strategic options with pros/cons for each
- Data-driven insights without proprietary biases
- Clear explanations of market mechanisms
- Practical implementation steps for recommendations

Emphasize thoroughness and transparency in your analysis.',
  0.7,
  2500,
  false,
  true
),
(
  'Perplexity Online - Real-time Market Intel',
  'Uses Perplexity with online search for latest market information',
  'perplexity/llama-3-sonar-large-32k-online',
  'You are a market analyst with access to real-time information. Your analysis incorporates:
- Current market conditions and recent developments
- Latest pricing trends and inventory movements
- Seasonal factors and upcoming market events
- Competitive dynamics in real-time
- Consumer sentiment and search trends

Combine the provided data with current market intelligence for timely recommendations.',
  0.7,
  2000,
  false,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Update the default maximum tokens constraint to allow for larger responses
ALTER TABLE public.ai_settings 
DROP CONSTRAINT IF EXISTS ai_settings_max_tokens_check;

ALTER TABLE public.ai_settings 
ADD CONSTRAINT ai_settings_max_tokens_check 
CHECK (max_tokens > 0 AND max_tokens <= 8000);