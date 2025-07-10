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

    const { keywords, location_code, date_from, date_to } = await request.json()

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords are required' }, { status: 400 })
    }

    const startTime = Date.now()

    // Prepare request body
    const requestBody = [{
      keywords,
      location_code: location_code || 2840, // Default to US
      language_code: "en",
      date_from: date_from || "2024-01-01",
      date_to: date_to || new Date().toISOString().split('T')[0]
    }]

    // Make API call
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
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
    const searchVolumes = results?.items || []

    // Process monthly searches data
    const processedResults = searchVolumes.map((item: any) => ({
      keyword: item.keyword,
      avgMonthlySearches: item.search_volume,
      competition: item.competition,
      competitionLevel: item.competition_level,
      cpc: item.cpc,
      monthlySearches: item.monthly_searches?.map((month: any) => ({
        year: month.year,
        month: month.month,
        searchVolume: month.search_volume
      })) || []
    }))

    return NextResponse.json({
      success: true,
      data: {
        keywords: processedResults,
        summary: {
          totalKeywords: processedResults.length,
          dateRange: {
            from: date_from || "2024-01-01",
            to: date_to || new Date().toISOString().split('T')[0]
          },
          location: results?.location_code || location_code || 2840
        }
      },
      debug: {
        apiUrl: 'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
        requestBody,
        responseStatus: response.status,
        processingTime: `${processingTime}ms`,
        rawResponse: data
      }
    })
  } catch (error) {
    console.error('DataForSEO search history error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch search history',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 })
  }
}