import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { keyword, location_code, include_seed_keyword, filters } = await request.json()

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const startTime = Date.now()

    // Prepare request body
    const requestBody = [{
      keyword,
      location_code: location_code || 2840, // Default to US
      language_code: "en",
      include_seed_keyword: include_seed_keyword !== false,
      filters: filters || [
        ["search_volume", ">", 100],
        ["keyword_info.competition_level", "in", ["LOW", "MEDIUM"]]
      ],
      limit: 50
    }]

    // Make API call
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.DATAFORSEO_EMAIL}:${process.env.DATAFORSEO_API_KEY}`
        ).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()
    const processingTime = Date.now() - startTime

    // Extract results
    const results = data.tasks?.[0]?.result?.[0] || null
    const suggestions = results?.items || []

    // Process suggestions
    const processedSuggestions = suggestions.map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.keyword_info?.search_volume || 0,
      competition: item.keyword_info?.competition || 0,
      competitionLevel: item.keyword_info?.competition_level || 'UNKNOWN',
      cpc: item.keyword_info?.cpc || 0,
      monthlySearches: item.keyword_info?.monthly_searches || [],
      relatedKeywords: item.keyword_annotations?.concepts?.map((concept: any) => ({
        name: concept.concept_name,
        type: concept.concept_type
      })) || []
    }))

    // Sort by search volume
    processedSuggestions.sort((a: any, b: any) => b.searchVolume - a.searchVolume)

    return NextResponse.json({
      success: true,
      data: {
        seedKeyword: keyword,
        suggestions: processedSuggestions,
        summary: {
          totalSuggestions: processedSuggestions.length,
          avgSearchVolume: Math.round(
            processedSuggestions.reduce((sum: number, s: any) => sum + s.searchVolume, 0) / 
            (processedSuggestions.length || 1)
          ),
          competitionBreakdown: {
            low: processedSuggestions.filter((s: any) => s.competitionLevel === 'LOW').length,
            medium: processedSuggestions.filter((s: any) => s.competitionLevel === 'MEDIUM').length,
            high: processedSuggestions.filter((s: any) => s.competitionLevel === 'HIGH').length
          }
        }
      },
      debug: {
        apiUrl: 'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live',
        requestBody,
        responseStatus: response.status,
        processingTime: `${processingTime}ms`,
        rawResponse: data
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch keyword suggestions',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 })
  }
}