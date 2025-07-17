import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MarketCheckClient } from '@/lib/analytics/clients/marketcheck'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { vin, latitude, longitude, radius, rows } = body

    // Validate required fields
    if (!vin || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'VIN, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    // Initialize Market Check client
    const marketCheckApiKey = process.env.MARKETCHECK_API_KEY
    if (!marketCheckApiKey) {
      return NextResponse.json(
        { error: 'Market Check API key not configured' },
        { status: 500 }
      )
    }

    const client = new MarketCheckClient({
      apiKey: marketCheckApiKey
    })

    // Call the API
    const response = await client.searchSimilarVehicles({
      vin,
      latitude,
      longitude,
      radius: radius || 100,
      rows: rows || 50
    })

    return NextResponse.json({
      success: true,
      data: response,
      debug: {
        request: { vin, latitude, longitude, radius, rows },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to search similar vehicles',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}