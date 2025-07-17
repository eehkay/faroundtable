import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { DataForSEODebugClient } from '@/lib/analytics/clients/dataforseo-debug'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get request body
    const { keywords, location_code } = await request.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    // Get DataForSEO credentials
    const dataForSEOEmail = process.env.DATAFORSEO_EMAIL
    const dataForSEOApiKey = process.env.DATAFORSEO_API_KEY

    if (!dataForSEOEmail || !dataForSEOApiKey) {
      return NextResponse.json(
        { error: 'DataForSEO credentials not configured' },
        { status: 500 }
      )
    }

    // Initialize DataForSEO debug client
    const client = new DataForSEODebugClient({
      email: dataForSEOEmail,
      apiKey: dataForSEOApiKey
    })

    const startTime = Date.now()
    
    // Get search volume with debug info
    const result = await client.getSearchVolumeWithDebug(
      keywords,
      location_code || 2840 // Default to US
    )
    
    const endTime = Date.now()

    // Format the response for easier reading
    const formattedResults = result.results.map(r => ({
      keyword: r.keyword,
      search_volume: r.search_volume,
      competition: r.competition,
      trend: r.trend,
      monthly_searches: r.monthly_searches
    }))

    return NextResponse.json({
      success: true,
      data: {
        results: formattedResults,
        debug: {
          endpoint: result.debug.apiUrl,
          requestData: result.debug.requestBody,
          curlCommand: result.debug.curlCommand,
          rawResponse: result.debug.rawResponse,
          locationCode: result.debug.locationCode,
          keywordsCount: result.debug.keywordsCount,
          resultsCount: result.debug.resultsCount
        }
      },
      timing: endTime - startTime,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get search volume data',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}