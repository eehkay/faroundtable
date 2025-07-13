import { unstable_cache } from 'next/cache'

export interface OpenRouterModel {
  id: string
  name: string
  created: number
  description?: string
  context_length: number
  architecture: {
    input_modalities: string[]
    output_modalities: string[]
    tokenizer?: string
  }
  pricing: {
    prompt: string
    completion: string
    image?: string
    request?: string
  }
  top_provider?: {
    context_length?: number
    max_completion_tokens?: number
    is_moderated: boolean
  }
  per_request_limits?: Record<string, any> | null
  supported_parameters?: string[]
  canonical_slug?: string
}

export interface ModelCategory {
  name: string
  models: OpenRouterModel[]
}

// Cache the models for 1 hour
const getCachedModels = unstable_cache(
  async () => fetchOpenRouterModels(),
  ['openrouter-models'],
  { revalidate: 3600 } // 1 hour
)

async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'User-Agent': 'Round Table Market Analysis'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error)
    return []
  }
}

export async function getAvailableModels(): Promise<OpenRouterModel[]> {
  return getCachedModels()
}

export async function getModelCategories(): Promise<ModelCategory[]> {
  const models = await getAvailableModels()
  
  // Categorize models
  const categories = new Map<string, OpenRouterModel[]>()
  
  // First, add OpenAI Direct models (those without /)
  const openaiDirect = models.filter(m => !m.id.includes('/') && m.id.startsWith('gpt'))
  if (openaiDirect.length > 0) {
    categories.set('OpenAI Direct', openaiDirect)
  }

  // Then categorize OpenRouter models by provider
  models.forEach(model => {
    if (model.id.includes('/')) {
      const [provider] = model.id.split('/')
      const categoryName = getCategoryName(provider)
      
      if (!categories.has(categoryName)) {
        categories.set(categoryName, [])
      }
      categories.get(categoryName)!.push(model)
    } else if (!model.id.startsWith('gpt')) {
      // Non-GPT models without provider prefix
      if (!categories.has('Other Models')) {
        categories.set('Other Models', [])
      }
      categories.get('Other Models')!.push(model)
    }
  })

  // Convert to array and sort
  const result: ModelCategory[] = []
  
  // Priority order for categories
  const priorityOrder = [
    'OpenAI Direct',
    'OpenRouter: Anthropic',
    'OpenRouter: Google',
    'OpenRouter: Meta',
    'OpenRouter: Mistral',
    'OpenRouter: OpenAI',
    'OpenRouter: Perplexity',
    'OpenRouter: Cohere',
    'OpenRouter: Databricks',
    'OpenRouter: Together'
  ]

  // Add categories in priority order
  priorityOrder.forEach(categoryName => {
    if (categories.has(categoryName)) {
      result.push({
        name: categoryName,
        models: categories.get(categoryName)!.sort((a, b) => {
          // Sort by context length (descending) then name
          if (a.context_length !== b.context_length) {
            return b.context_length - a.context_length
          }
          return a.name.localeCompare(b.name)
        })
      })
    }
  })

  // Add remaining categories alphabetically
  Array.from(categories.entries())
    .filter(([name]) => !priorityOrder.includes(name))
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, models]) => {
      result.push({
        name,
        models: models.sort((a, b) => {
          if (a.context_length !== b.context_length) {
            return b.context_length - a.context_length
          }
          return a.name.localeCompare(b.name)
        })
      })
    })

  return result
}

function getCategoryName(provider: string): string {
  const providerNames: Record<string, string> = {
    'anthropic': 'OpenRouter: Anthropic',
    'openai': 'OpenRouter: OpenAI',
    'google': 'OpenRouter: Google',
    'meta-llama': 'OpenRouter: Meta',
    'meta': 'OpenRouter: Meta',
    'mistralai': 'OpenRouter: Mistral',
    'mistral': 'OpenRouter: Mistral',
    'perplexity': 'OpenRouter: Perplexity',
    'cohere': 'OpenRouter: Cohere',
    'databricks': 'OpenRouter: Databricks',
    'together': 'OpenRouter: Together',
    'deepseek': 'OpenRouter: DeepSeek',
    'qwen': 'OpenRouter: Qwen',
    'nous': 'OpenRouter: Nous',
    'gryphe': 'OpenRouter: Gryphe',
    'liquid': 'OpenRouter: Liquid',
    'neversleep': 'OpenRouter: Neversleep',
    'recursal': 'OpenRouter: Recursal',
    'sophosympatheia': 'OpenRouter: Sophosympatheia'
  }

  return providerNames[provider] || `OpenRouter: ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
}

export function getModelInfo(model: OpenRouterModel): {
  provider: string
  shortName: string
  pricePerMillionInput: number
  pricePerMillionOutput: number
  contextWindow: string
  features: string[]
} {
  const [provider, ...nameParts] = model.id.split('/')
  const shortName = nameParts.join('/') || model.id
  
  // Convert pricing from per-token to per-million tokens
  const pricePerMillionInput = parseFloat(model.pricing.prompt) * 1_000_000
  const pricePerMillionOutput = parseFloat(model.pricing.completion) * 1_000_000
  
  // Format context window
  const contextWindow = formatContextWindow(model.context_length)
  
  // Extract features from supported parameters
  const features: string[] = []
  if (model.supported_parameters?.includes('tools')) features.push('Tools')
  if (model.supported_parameters?.includes('response_format')) features.push('JSON Mode')
  if (model.id.includes(':online')) features.push('Web Search')
  if (model.architecture.input_modalities?.includes('image')) features.push('Vision')
  
  return {
    provider: provider || 'OpenAI',
    shortName,
    pricePerMillionInput,
    pricePerMillionOutput,
    contextWindow,
    features
  }
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  } else if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`
  }
  return tokens.toString()
}