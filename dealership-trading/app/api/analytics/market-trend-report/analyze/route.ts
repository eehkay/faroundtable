import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import OpenAI from 'openai'

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

Analyze the provided market trend report data and provide actionable insights. Focus on:
1. Key opportunities and risks
2. Strategic recommendations
3. Market timing considerations
4. Competitive positioning strategies
5. Pricing optimization suggestions

Be specific, data-driven, and provide concrete action items.`

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

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey
    })

    // Prepare the messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: finalSystemPrompt
      },
      {
        role: 'user',
        content: `${userPrompt}\n\nMarket Trend Report Data:\n${JSON.stringify(reportData, null, 2)}`
      }
    ]

    // Set default options
    const model = finalOptions.model || 'gpt-4-turbo-preview'
    const temperature = finalOptions.temperature ?? 0.7
    const maxTokens = finalOptions.maxTokens || 2000
    const responseFormat = finalOptions.responseFormat || 'text'

    // Log request details before API call
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [AI Analysis API] Calling OpenAI:', {
        model,
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
      console.log('✅ [AI Analysis API] OpenAI Response:', {
        responseTime: `${responseTime}ms`,
        tokensUsed: completion.usage?.total_tokens,
        finishReason: completion.choices[0]?.finish_reason,
        responseLength: aiResponse?.length
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