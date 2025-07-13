import { NextRequest, NextResponse } from 'next/server'
import { getModelCategories, getModelInfo } from '@/lib/analytics/openrouter-models'

export async function GET(request: NextRequest) {
  try {
    // No authentication required - model list is public information
    const categories = await getModelCategories()
    
    // Transform the data to include additional info
    const enrichedCategories = categories.map(category => ({
      name: category.name,
      models: category.models.map(model => ({
        id: model.id,
        name: model.name,
        description: model.description,
        info: getModelInfo(model),
        contextLength: model.context_length,
        pricing: {
          input: parseFloat(model.pricing.prompt) * 1_000_000,
          output: parseFloat(model.pricing.completion) * 1_000_000
        }
      }))
    }))
    
    return NextResponse.json({
      success: true,
      data: enrichedCategories,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    
    // Return a fallback list of essential models if the API fails
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch models from OpenRouter',
      data: getFallbackModels(),
      timestamp: new Date().toISOString()
    })
  }
}

function getFallbackModels() {
  return [
    {
      name: 'OpenAI Direct',
      models: [
        {
          id: 'gpt-4-turbo-preview',
          name: 'GPT-4 Turbo Preview',
          description: 'Latest GPT-4 Turbo model',
          info: {
            provider: 'OpenAI',
            shortName: 'gpt-4-turbo-preview',
            pricePerMillionInput: 10,
            pricePerMillionOutput: 30,
            contextWindow: '128K',
            features: ['Tools', 'JSON Mode']
          }
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and affordable',
          info: {
            provider: 'OpenAI',
            shortName: 'gpt-3.5-turbo',
            pricePerMillionInput: 0.5,
            pricePerMillionOutput: 1.5,
            contextWindow: '16K',
            features: ['Tools', 'JSON Mode']
          }
        }
      ]
    },
    {
      name: 'OpenRouter: Anthropic',
      models: [
        {
          id: 'anthropic/claude-3.5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          description: 'Fast and capable',
          info: {
            provider: 'anthropic',
            shortName: 'claude-3.5-sonnet-20241022',
            pricePerMillionInput: 3,
            pricePerMillionOutput: 15,
            contextWindow: '200K',
            features: ['Tools', 'Vision']
          }
        }
      ]
    }
  ]
}