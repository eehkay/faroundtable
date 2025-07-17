import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MarketCheckClient } from '@/lib/analytics/clients/marketcheck'

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
    const { vin } = await request.json()

    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      )
    }

    // Get MarketCheck API key
    const marketCheckApiKey = process.env.MARKETCHECK_API_KEY
    if (!marketCheckApiKey) {
      return NextResponse.json(
        { error: 'MarketCheck API key not configured' },
        { status: 500 }
      )
    }

    // Initialize MarketCheck client
    const client = new MarketCheckClient({
      apiKey: marketCheckApiKey
    })

    const startTime = Date.now()
    
    // Decode VIN
    const result = await client.decodeVin(vin)
    
    const endTime = Date.now()

    return NextResponse.json({
      success: true,
      data: result,
      timing: endTime - startTime,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to decode VIN',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}