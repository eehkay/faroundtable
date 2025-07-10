import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'US'
    const query = searchParams.get('query') || ''

    const startTime = Date.now()

    // Make API call
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/locations', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.DATAFORSEO_EMAIL}:${process.env.DATAFORSEO_API_KEY}`
        ).toString('base64'),
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    const processingTime = Date.now() - startTime

    // Extract results
    const locations = data.tasks?.[0]?.result || []

    // Filter by country and query
    let filteredLocations = locations
    if (country) {
      filteredLocations = filteredLocations.filter((loc: any) => 
        loc.country_iso_code === country.toUpperCase()
      )
    }
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredLocations = filteredLocations.filter((loc: any) => 
        loc.location_name?.toLowerCase().includes(lowerQuery) ||
        loc.location_code?.toString().includes(query)
      )
    }

    // Process and organize locations
    const processedLocations = filteredLocations.map((loc: any) => ({
      code: loc.location_code,
      name: loc.location_name,
      type: loc.location_type,
      parent: loc.location_code_parent,
      country: loc.country_iso_code,
      geoName: loc.geo_name,
      geoId: loc.geo_id
    }))

    // Group by type
    const groupedByType = processedLocations.reduce((acc: any, loc: any) => {
      if (!acc[loc.type]) acc[loc.type] = []
      acc[loc.type].push(loc)
      return acc
    }, {})

    // Get top cities for the country
    const topCities = processedLocations
      .filter((loc: any) => loc.type === 'City')
      .slice(0, 20)

    return NextResponse.json({
      success: true,
      data: {
        locations: processedLocations.slice(0, 100), // Limit to first 100
        grouped: groupedByType,
        topCities,
        summary: {
          total: processedLocations.length,
          byType: Object.entries(groupedByType).map(([type, locs]: [string, any]) => ({
            type,
            count: locs.length
          }))
        },
        popularUSLocations: [
          { code: 2840, name: "United States", type: "Country" },
          { code: 1061523, name: "New York, NY", type: "City" },
          { code: 1013962, name: "Los Angeles, CA", type: "City" },
          { code: 1013956, name: "Chicago, IL", type: "City" },
          { code: 1026201, name: "Houston, TX", type: "City" },
          { code: 1023191, name: "Phoenix, AZ", type: "City" },
          { code: 1024195, name: "Philadelphia, PA", type: "City" },
          { code: 1026339, name: "San Antonio, TX", type: "City" },
          { code: 1013974, name: "San Diego, CA", type: "City" },
          { code: 1026208, name: "Dallas, TX", type: "City" },
          { code: 1013995, name: "San Jose, CA", type: "City" }
        ]
      },
      debug: {
        apiUrl: 'https://api.dataforseo.com/v3/keywords_data/locations',
        filters: { country, query },
        responseStatus: response.status,
        processingTime: `${processingTime}ms`,
        totalLocations: locations.length
      }
    })
  } catch (error) {
    console.error('DataForSEO locations error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch locations',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 })
  }
}