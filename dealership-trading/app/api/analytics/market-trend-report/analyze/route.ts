import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import OpenAI from 'openai'

interface AIContextSettings {
  market_position_context: string
  inventory_analysis_context: string
  regional_performance_context: string
  competitive_landscape_context: string
  demand_analysis_context: string
  include_context: boolean
}

interface AnalyzeMarketTrendRequest {
  // System prompt to guide the AI analysis
  systemPrompt?: string
  
  // AI setting ID to use (optional - will use default if not provided)
  aiSettingId?: string
  
  // User prompt/question about the data
  userPrompt: string
  
  // The market trend report data
  reportData: {
    vehicle: {
      vin: string
      year: number
      make: string
      model: string
      trim?: string
      mileage: number
      currentPrice: number
    }
    location: {
      dealership: string
      coordinates: { lat: number; lng: number }
      cityState: string
    }
    marketPosition?: any
    inventoryAnalysis?: any
    regionalPerformance?: any
    competitiveLandscape?: any
    demandAnalysis?: any
    opportunityScore?: any
    recommendations?: any
  }
  
  // Optional parameters
  options?: {
    model?: string // Default: gpt-4-turbo-preview
    temperature?: number // Default: 0.7
    maxTokens?: number // Default: 2000
    responseFormat?: 'text' | 'json' // Default: 'text'
  }
}

// Default system prompt for market analysis
const DEFAULT_SYSTEM_PROMPT = `You are an expert automotive market analyst with deep knowledge of:
- Vehicle pricing strategies and market dynamics
- Inventory management and supply/demand analysis
- Regional market trends and consumer behavior
- Competitive landscape analysis
- Search trend interpretation and demand forecasting

You will receive market data in a structured format with the following sections:
- VEHICLE INFORMATION: Basic details about the vehicle being analyzed
- LOCATION CONTEXT: Dealership location and market area
- MARKET POSITION: Price predictions and market value analysis
- INVENTORY ANALYSIS: Supply metrics including Market Day Supply (MDS)
- REGIONAL PERFORMANCE: Historical sales data for this vehicle type in the region
- COMPETITIVE LANDSCAPE: Similar vehicles currently for sale nearby
- DEMAND ANALYSIS: Consumer search trends and keyword volumes

When you see 'raw' and 'processed' data:
- 'raw' contains unbiased API responses - use this for your analysis
- 'processed' contains pre-calculated values - use these only as reference points

Provide actionable insights focusing on:
1. Key opportunities and risks based on the raw data
2. Strategic recommendations with specific price points
3. Market timing considerations (when to sell)
4. Competitive positioning strategies
5. Expected days to sell based on market conditions

Be specific, data-driven, and provide concrete action items with numerical targets where possible.`

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body: AnalyzeMarketTrendRequest = await request.json()
    const { systemPrompt, aiSettingId, userPrompt, reportData, options = {} } = body

    // Server-side debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [AI Analysis API] Request received:', {
        timestamp: new Date().toISOString(),
        userEmail: session.user.email,
        hasSystemPrompt: !!systemPrompt,
        aiSettingId,
        userPromptLength: userPrompt?.length,
        vehicleVin: reportData?.vehicle?.vin,
        reportDataKeys: Object.keys(reportData || {})
      })
    }

    // Validate required fields
    if (!userPrompt || !reportData) {
      return NextResponse.json(
        { error: 'userPrompt and reportData are required' },
        { status: 400 }
      )
    }

    // Get AI setting from database if not using custom prompt
    let aiSetting = null
    let finalSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT
    let finalOptions = { ...options }

    if (!systemPrompt) {
      if (aiSettingId) {
        // Use specific AI setting
        const { data: setting } = await supabaseAdmin
          .from('ai_settings')
          .select('*')
          .eq('id', aiSettingId)
          .eq('is_active', true)
          .single()
        
        if (setting) {
          aiSetting = setting
        }
      } else {
        // Use default AI setting
        const { data: setting } = await supabaseAdmin
          .from('ai_settings')
          .select('*')
          .eq('is_default', true)
          .eq('is_active', true)
          .single()
        
        if (setting) {
          aiSetting = setting
        }
      }

      // Apply settings from database
      if (aiSetting) {
        finalSystemPrompt = aiSetting.system_prompt
        finalOptions = {
          model: aiSetting.model,
          temperature: aiSetting.temperature,
          maxTokens: aiSetting.max_tokens,
          responseFormat: aiSetting.response_format,
          ...options // Allow request to override database settings
        }
      }
    }

    // Determine if we should use OpenRouter based on the model
    const isOpenRouterModel = finalOptions.model?.includes('/')
    
    // Check API key configuration
    const openaiApiKey = process.env.OPENAI_API_KEY
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    
    if (isOpenRouterModel && !openrouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    } else if (!isOpenRouterModel && !openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Fetch AI context settings from database
    let contextSettings: AIContextSettings | null = null
    try {
      const { data } = await supabaseAdmin
        .from('ai_context_settings')
        .select('*')
        .single()
      
      contextSettings = data
    } catch (error) {
      console.log('Using default context settings')
    }

    // Default context values if not in database
    const defaultContext: AIContextSettings = {
      market_position_context: 'This section contains price prediction data comparing the vehicle\'s current price to market predictions. \'raw\' contains unprocessed API responses, \'processed\' contains calculated values. Key metrics: predicted_price, confidence level, price_range (market bounds)',
      inventory_analysis_context: 'Market Day Supply (MDS) indicates how many days of inventory exist based on current sales rate. Lower MDS = higher demand/scarcity, Higher MDS = oversupply. inventory_count: current listings, sales_count: recent sales used for MDS calculation',
      regional_performance_context: 'Historical sales data for this vehicle type in the specified city/region. Includes pricing statistics, mileage averages, and days on market trends. \'count\' represents historical sales volume in this market',
      competitive_landscape_context: 'Shows competing inventory within the search radius. Limited to top 20 vehicles to reduce data size. Includes pricing, mileage, distance from location, and days on market. totalCount shows full inventory size even though listings are limited',
      demand_analysis_context: 'Based on keyword search volume data from DataForSEO. Shows consumer interest through search queries. Vehicle-specific keywords indicate direct interest in this model. Generic keywords show general market activity',
      include_context: true
    }

    const context = contextSettings || defaultContext

    // Initialize OpenAI client with appropriate configuration
    const openai = new OpenAI({
      apiKey: isOpenRouterModel ? openrouterApiKey : openaiApiKey,
      baseURL: isOpenRouterModel ? 'https://openrouter.ai/api/v1' : undefined,
      defaultHeaders: isOpenRouterModel ? {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://roundtable.app',
        'X-Title': 'Round Table Market Analysis'
      } : undefined
    })

    // Build user message content
    let userContent = userPrompt

    // Add context if enabled
    if (context.include_context) {
      userContent += `

Market Trend Report Data with Context:

VEHICLE INFORMATION:
${JSON.stringify(reportData.vehicle, null, 2)}

LOCATION CONTEXT:
${JSON.stringify(reportData.location, null, 2)}

MARKET POSITION (Price Analysis):
- ${context.market_position_context}
${JSON.stringify(reportData.marketPosition, null, 2)}

INVENTORY ANALYSIS (Supply & Demand):
- ${context.inventory_analysis_context}
${JSON.stringify(reportData.inventoryAnalysis, null, 2)}

REGIONAL PERFORMANCE (Local Market Stats):
- ${context.regional_performance_context}
${JSON.stringify(reportData.regionalPerformance, null, 2)}

COMPETITIVE LANDSCAPE (Similar Vehicles):
- ${context.competitive_landscape_context}
${JSON.stringify(reportData.competitiveLandscape, null, 2)}

DEMAND ANALYSIS (Search Trends):
- ${context.demand_analysis_context}
${JSON.stringify(reportData.demandAnalysis, null, 2)}

Note: When 'raw' data is present, it contains unbiased API responses. The 'processed' data contains our calculations for reference but the AI should form its own conclusions from the raw data.`
    } else {
      // Without context, just provide the raw data
      userContent += `

Market Trend Report Data:
${JSON.stringify(reportData, null, 2)}`
    }

    // Prepare the messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: finalSystemPrompt
      },
      {
        role: 'user',
        content: userContent
      }
    ]

    // Set default options
    const model = finalOptions.model || 'gpt-4-turbo-preview'
    const temperature = finalOptions.temperature ?? 0.7
    const maxTokens = finalOptions.maxTokens || 2000
    const responseFormat = finalOptions.responseFormat || 'text'

    // Log request details before API call
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [AI Analysis API] Calling ${isOpenRouterModel ? 'OpenRouter' : 'OpenAI'}:`, {
        model,
        provider: isOpenRouterModel ? 'OpenRouter' : 'OpenAI Direct',
        temperature,
        maxTokens,
        responseFormat,
        systemPromptPreview: finalSystemPrompt.substring(0, 100) + '...',
        userPromptPreview: userPrompt.substring(0, 100) + '...',
        aiSettingUsed: aiSetting?.name || 'Default'
      })
    }

    const startTime = Date.now()

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined
    })

    const aiResponse = completion.choices[0]?.message?.content
    const responseTime = Date.now() - startTime

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [AI Analysis API] ${isOpenRouterModel ? 'OpenRouter' : 'OpenAI'} Response:`, {
        responseTime: `${responseTime}ms`,
        tokensUsed: completion.usage?.total_tokens,
        finishReason: completion.choices[0]?.finish_reason,
        responseLength: aiResponse?.length,
        actualModel: completion.model // OpenRouter returns the actual model used
      })
    }

    if (!aiResponse) {
      throw new Error('No response from AI model')
    }

    // Parse JSON response if requested
    let processedResponse = aiResponse
    if (responseFormat === 'json') {
      try {
        processedResponse = JSON.parse(aiResponse)
      } catch (e) {
        console.error('Failed to parse JSON response:', e)
        // Return as text if JSON parsing fails
      }
    }

    // Return the analysis
    return NextResponse.json({
      success: true,
      data: {
        analysis: processedResponse,
        metadata: {
          model,
          temperature,
          timestamp: new Date().toISOString(),
          vehicleInfo: {
            vin: reportData.vehicle.vin,
            vehicle: `${reportData.vehicle.year} ${reportData.vehicle.make} ${reportData.vehicle.model}`,
            location: reportData.location.dealership
          },
          aiSetting: aiSetting ? {
            id: aiSetting.id,
            name: aiSetting.name,
            description: aiSetting.description
          } : null
        }
      }
    })

  } catch (error) {
    console.error('Market trend analysis error:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze market trend report',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Example usage endpoint that shows how to call this
export async function GET(request: NextRequest) {
  return NextResponse.json({
    description: 'Market Trend Report AI Analysis Endpoint',
    usage: {
      method: 'POST',
      endpoint: '/api/analytics/market-trend-report/analyze',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [session-token]'
      },
      body: {
        userPrompt: 'What are the top 3 strategic actions I should take for this vehicle?',
        systemPrompt: '(Optional) Custom system prompt for AI guidance',
        reportData: {
          vehicle: { /* vehicle data */ },
          location: { /* location data */ },
          marketPosition: { /* market position data */ },
          // ... other report sections
        },
        options: {
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 2000,
          responseFormat: 'text' // or 'json'
        }
      }
    },
    examples: {
      strategicAnalysis: {
        userPrompt: 'Provide a strategic analysis with specific action items for maximizing profit on this vehicle.',
        systemPrompt: 'You are a senior automotive sales strategist. Focus on profit maximization and quick inventory turnover.'
      },
      competitivePositioning: {
        userPrompt: 'How should I position this vehicle against the competition? What unique selling points should I emphasize?',
        systemPrompt: 'You are a competitive intelligence analyst. Focus on differentiation and competitive advantages.'
      },
      pricingStrategy: {
        userPrompt: 'Should I adjust the price? If so, by how much and why?',
        systemPrompt: 'You are a pricing optimization specialist. Consider market dynamics, demand, and profit margins.'
      },
      marketTiming: {
        userPrompt: 'Is this a good time to sell this vehicle, or should I hold? What market indicators support your recommendation?',
        systemPrompt: 'You are a market timing expert. Analyze seasonality, trends, and market conditions.'
      }
    }
  })
}