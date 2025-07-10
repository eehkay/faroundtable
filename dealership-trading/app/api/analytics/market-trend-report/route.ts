import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MarketCheckClient } from '@/lib/analytics/clients/marketcheck'
import { DataForSEOClient } from '@/lib/analytics/clients/dataforseo'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getLocationCodesForDealership, generateLocationKeywords, getLocationName } from '@/lib/analytics/location-config'

interface MarketTrendReportRequest {
  vin: string
  currentPrice?: number
  locationId?: string  // Now optional when using overrides
  overrides?: {
    vehicle?: {
      year?: number
      make?: string
      model?: string
      trim?: string
      mileage?: number
    }
    location?: {
      zip?: string
      latitude?: number
      longitude?: number
      cityState?: string
      dataforseoLocationCode?: number
    }
    searchRadius?: number
  }
}

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
    const body: MarketTrendReportRequest = await request.json()
    const { vin, currentPrice, locationId, overrides } = body

    // Validate required fields
    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      )
    }

    // Either locationId or location overrides are required
    if (!locationId && (!overrides?.location || (!overrides.location.latitude && !overrides.location.zip))) {
      return NextResponse.json(
        { error: 'Location ID or location overrides (latitude/longitude or ZIP) are required' },
        { status: 400 }
      )
    }

    // Build location data from database or overrides
    let locationData: any = null
    
    if (locationId) {
      const { data: location, error: locationError } = await supabaseAdmin
        .from('dealership_locations')
        .select('id, name, latitude, longitude, city_state, zip, dataforseo_location_code')
        .eq('id', locationId)
        .single()

      if (locationError || !location) {
        return NextResponse.json(
          { error: 'Invalid location' },
          { status: 400 }
        )
      }
      
      locationData = location
    } else {
      // Create synthetic location data from overrides
      locationData = {
        id: 'manual-override',
        name: 'Manual Location',
        latitude: null,
        longitude: null,
        city_state: null,
        zip: null,
        dataforseo_location_code: null
      }
    }

    // Apply location overrides
    if (overrides?.location) {
      if (overrides.location.latitude !== undefined) locationData.latitude = overrides.location.latitude
      if (overrides.location.longitude !== undefined) locationData.longitude = overrides.location.longitude
      if (overrides.location.cityState) locationData.city_state = overrides.location.cityState
      if (overrides.location.zip) locationData.zip = overrides.location.zip
      if (overrides.location.dataforseoLocationCode !== undefined) locationData.dataforseo_location_code = overrides.location.dataforseoLocationCode
    }

    // Validate final location data
    if (!locationData.latitude || !locationData.longitude) {
      return NextResponse.json(
        { error: 'Location missing coordinates. Please provide latitude and longitude.' },
        { status: 400 }
      )
    }

    // Get vehicle details from inventory or use overrides
    let vehicleData: any = null
    
    // Try to fetch from inventory first
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('vin, year, make, model, trim, mileage, price')
      .eq('vin', vin)
      .single()

    if (vehicle) {
      vehicleData = vehicle
    } else if (overrides?.vehicle) {
      // If not in inventory but we have overrides, use them
      vehicleData = {
        vin: vin,
        year: overrides.vehicle.year || null,
        make: overrides.vehicle.make || null,
        model: overrides.vehicle.model || null,
        trim: overrides.vehicle.trim || null,
        mileage: overrides.vehicle.mileage || null,
        price: currentPrice || null
      }
    } else {
      // If not in inventory and no overrides, try VIN decoding
      try {
        const vinDecodeResponse = await fetch(`${request.nextUrl.origin}/api/analytics/debug/vin-decode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vin })
        })
        
        if (vinDecodeResponse.ok) {
          const vinData = await vinDecodeResponse.json()
          if (vinData.success && vinData.data) {
            vehicleData = {
              vin: vin,
              year: vinData.data.year,
              make: vinData.data.make,
              model: vinData.data.model,
              trim: vinData.data.trim || null,
              mileage: overrides?.vehicle?.mileage || null,
              price: currentPrice || null
            }
          }
        }
      } catch (error) {
        console.error('VIN decode failed:', error)
      }
    }

    // Apply vehicle overrides if provided
    if (overrides?.vehicle && vehicleData) {
      if (overrides.vehicle.year !== undefined) vehicleData.year = overrides.vehicle.year
      if (overrides.vehicle.make) vehicleData.make = overrides.vehicle.make
      if (overrides.vehicle.model) vehicleData.model = overrides.vehicle.model
      if (overrides.vehicle.trim !== undefined) vehicleData.trim = overrides.vehicle.trim
      if (overrides.vehicle.mileage !== undefined) vehicleData.mileage = overrides.vehicle.mileage
    }

    // Update price if provided
    if (currentPrice !== undefined) {
      vehicleData.price = currentPrice
    }

    // Validate we have minimum vehicle data
    if (!vehicleData || !vehicleData.year || !vehicleData.make || !vehicleData.model) {
      return NextResponse.json(
        { error: 'Unable to determine vehicle details. Please provide year, make, and model in overrides.' },
        { status: 400 }
      )
    }

    // Initialize API clients
    const marketCheckApiKey = process.env.MARKETCHECK_API_KEY
    if (!marketCheckApiKey) {
      return NextResponse.json(
        { error: 'Market Check API key not configured' },
        { status: 500 }
      )
    }

    const marketCheckClient = new MarketCheckClient({
      apiKey: marketCheckApiKey
    })

    // Check if DataForSEO credentials are configured
    const dataForSEOEmail = process.env.DATAFORSEO_EMAIL
    const dataForSEOApiKey = process.env.DATAFORSEO_API_KEY
    
    let dataForSEOClient = null
    if (dataForSEOEmail && dataForSEOApiKey) {
      dataForSEOClient = new DataForSEOClient({
        email: dataForSEOEmail,
        apiKey: dataForSEOApiKey
      })
    }

    // Get DataForSEO location codes for this dealership
    const locationCodes = locationData.dataforseo_location_code 
      ? [locationData.dataforseo_location_code]
      : locationId 
        ? await getLocationCodesForDealership(locationId)
        : [2840] // Default to US if no specific location code
    
    // Generate keywords for search volume
    const baseKeywords = [
      `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`,
      `${vehicleData.make} ${vehicleData.model}`,
      `${vehicleData.make} ${vehicleData.model} for sale`,
      `${vehicleData.make} ${vehicleData.model} price`,
      `used ${vehicleData.make} ${vehicleData.model}`
    ]
    
    const locationName = getLocationName(locationCodes[0])
    const localKeywords = generateLocationKeywords(baseKeywords, locationName)

    // Use search radius from overrides or default
    const searchRadius = overrides?.searchRadius || 100

    // Call all APIs in parallel
    const [pricePrediction, marketDaySupply, citywiseSales, similarVehicles, searchVolume] = await Promise.allSettled([
      // Price Prediction
      marketCheckClient.getPricePrediction({
        vin: vehicleData.vin,
        miles: vehicleData.mileage,
        zip: locationData.zip || '89101',
        car_type: 'used'
      }),
      
      // Market Day Supply
      marketCheckClient.getMarketDaySupply({
        vin: vehicleData.vin,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius: searchRadius,
        exact: true,
        debug: false
      }),
      
      // Citywise Sales
      marketCheckClient.getCitywiseSales({
        vin: vehicleData.vin,
        year: vehicleData.year,
        make: vehicleData.make.toLowerCase(),
        model: vehicleData.model.toLowerCase(),
        trim: vehicleData.trim,
        city_state: locationData.city_state
      }),
      
      // Similar Vehicles
      marketCheckClient.searchSimilarVehicles({
        vin: vehicleData.vin,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius: searchRadius,
        rows: 20
      }),
      
      // DataForSEO Search Volume (only if client is configured)
      dataForSEOClient ? (
        locationCodes.length > 1
          ? dataForSEOClient.getSearchVolumeMultiLocation(localKeywords, locationCodes)
          : dataForSEOClient.getSearchVolume(localKeywords, locationCodes[0])
      ) : Promise.resolve(null)
    ])

    // Process results
    const report: any = {
      vehicle: {
        vin: vehicleData.vin,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim,
        mileage: vehicleData.mileage,
        currentPrice: currentPrice || vehicleData.price
      },
      location: {
        dealership: locationData.name,
        coordinates: {
          lat: locationData.latitude,
          lng: locationData.longitude
        },
        cityState: locationData.city_state
      }
    }

    // Process Price Prediction
    if (pricePrediction.status === 'fulfilled') {
      const priceData = pricePrediction.value
      const predictedPrice = priceData.predicted_price || 0
      const lowerBound = priceData.price_range?.low || predictedPrice * 0.9
      const upperBound = priceData.price_range?.high || predictedPrice * 1.1
      
      report.marketPosition = {
        predictedPrice,
        priceRange: {
          lower: lowerBound,
          upper: upperBound
        },
        currentPrice: currentPrice || vehicleData.price,
        percentile: calculatePricePercentile(currentPrice || vehicleData.price, lowerBound, upperBound),
        recommendation: generatePriceRecommendation(currentPrice || vehicleData.price, predictedPrice)
      }
    } else {
      report.marketPosition = {
        error: 'Unable to get price prediction'
      }
    }

    // Process Market Day Supply
    if (marketDaySupply.status === 'fulfilled') {
      const mdsData = marketDaySupply.value
      report.inventoryAnalysis = {
        marketDaySupply: mdsData.mds || 0,
        inventoryCount: mdsData.inventory_count || 0,
        salesCount: mdsData.sales_count || 0,
        scarcityScore: calculateScarcityScore(mdsData.mds || 0)
      }
    } else {
      report.inventoryAnalysis = {
        error: 'Unable to get market day supply'
      }
    }

    // Process Citywise Sales
    if (citywiseSales.status === 'fulfilled') {
      const salesData = citywiseSales.value
      console.log('✅ Citywise Sales SUCCESS:', {
        request: {
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make.toLowerCase(),
          model: vehicle.model.toLowerCase(),
          trim: vehicle.trim,
          city_state: locationData.city_state
        },
        response: salesData
      })
      report.regionalPerformance = {
        citySalesCount: salesData.count || salesData.sales_count || 0,
        avgPrice: salesData.price_stats?.mean || salesData.average_price || 0,
        avgMiles: salesData.miles_stats?.mean || salesData.average_miles || 0,
        avgDaysOnMarket: salesData.dom_stats?.mean || salesData.average_dom || 0,
        topColors: salesData.top_colors || [],
        salesTrend: salesData.sales_trend || 'stable'
      }
    } else {
      console.log('❌ Citywise Sales FAILED:', {
        status: citywiseSales.status,
        reason: citywiseSales.reason,
        requestParams: {
          vin: vehicleData.vin,
          year: vehicleData.year,
          make: vehicleData.make.toLowerCase(),
          model: vehicleData.model.toLowerCase(),
          trim: vehicleData.trim,
          city_state: locationData.city_state
        }
      })
      
      const errorMessage = citywiseSales.reason instanceof Error 
        ? citywiseSales.reason.message 
        : 'Unable to get citywise sales data'
      
      report.regionalPerformance = {
        error: errorMessage,
        debugInfo: {
          requestParams: {
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make.toLowerCase(),
            model: vehicle.model.toLowerCase(),
            trim: vehicle.trim,
            city_state: locationData.city_state
          },
          errorReason: citywiseSales.reason?.toString(),
          promiseStatus: citywiseSales.status
        }
      }
    }

    // Process Similar Vehicles
    if (similarVehicles.status === 'fulfilled') {
      const similarData = similarVehicles.value
      const vehicles = similarData.listings || []
      
      const competitiveVehicles = vehicles.map((v: any) => ({
        vin: v.vin,
        distance: Math.round(v.distance),
        price: v.price,
        dealer: v.dealer.name,
        daysOnMarket: v.dom || 0,
        year: v.year,
        make: v.make,
        model: v.model,
        vdpUrl: v.vdp_url
      }))

      const avgCompetitorPrice = vehicles.length > 0
        ? vehicles.reduce((sum: number, v: any) => sum + v.price, 0) / vehicles.length
        : 0

      report.competitiveLandscape = {
        similarVehicles: competitiveVehicles.slice(0, 10), // Top 10 closest
        totalNearbyInventory: vehicles.length,
        avgCompetitorPrice,
        pricePosition: determinePricePosition(currentPrice || vehicleData.price, avgCompetitorPrice)
      }
    } else {
      report.competitiveLandscape = {
        error: 'Unable to get similar vehicles data'
      }
    }

    // Process Search Volume Data
    if (searchVolume.status === 'fulfilled' && searchVolume.value) {
      const volumeData = searchVolume.value
      
      // Calculate total search volume
      const totalSearchVolume = volumeData.reduce((sum, keyword) => sum + keyword.search_volume, 0)
      
      // Find top performing keywords
      const topKeywords = volumeData
        .sort((a, b) => b.search_volume - a.search_volume)
        .slice(0, 5)
        .map(kw => ({
          keyword: kw.keyword,
          monthlySearches: kw.search_volume,
          competition: kw.competition
        }))
      
      report.demandAnalysis = {
        totalMonthlySearches: totalSearchVolume,
        locationName,
        locationCodes,
        topKeywords,
        searchTrend: determineSearchTrend(volumeData),
        demandLevel: determineDemandLevel(totalSearchVolume)
      }
    } else {
      report.demandAnalysis = {
        error: dataForSEOClient ? 'Unable to get search volume data' : 'DataForSEO API credentials not configured',
        locationName,
        locationCodes,
        note: !dataForSEOClient ? 'Please add DATAFORSEO_EMAIL and DATAFORSEO_API_KEY to your environment variables' : undefined
      }
    }

    // Calculate Opportunity Score
    report.opportunityScore = calculateOpportunityScore(report)

    // Generate Recommendations
    report.recommendations = generateRecommendations(report)

    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Market trend report error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate market trend report',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Helper functions
function calculatePricePercentile(currentPrice: number, lower: number, upper: number): number {
  if (currentPrice <= lower) return 0
  if (currentPrice >= upper) return 100
  return Math.round(((currentPrice - lower) / (upper - lower)) * 100)
}

function generatePriceRecommendation(currentPrice: number, predictedPrice: number): string {
  const difference = ((currentPrice - predictedPrice) / predictedPrice) * 100
  
  if (difference > 10) {
    return `Price is ${Math.abs(difference).toFixed(1)}% above market. Consider reducing by $${Math.round(currentPrice - predictedPrice).toLocaleString()}`
  } else if (difference < -10) {
    return `Price is ${Math.abs(difference).toFixed(1)}% below market. You have room to increase by $${Math.round(predictedPrice - currentPrice).toLocaleString()}`
  } else {
    return 'Price is well-aligned with market predictions'
  }
}

function calculateScarcityScore(mds: number): number {
  // Lower MDS = Higher scarcity score
  if (mds <= 30) return Math.round(90 + (30 - mds) / 3) // 90-100 for very scarce
  if (mds <= 60) return Math.round(70 + (60 - mds) / 3 * 2) // 70-90 for scarce
  if (mds <= 90) return Math.round(40 + (90 - mds)) // 40-70 for moderate
  return Math.round(Math.max(0, 40 - (mds - 90) / 2)) // 0-40 for abundant
}

function determinePricePosition(currentPrice: number, avgCompetitorPrice: number): 'above' | 'at' | 'below' {
  const difference = ((currentPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100
  if (difference > 5) return 'above'
  if (difference < -5) return 'below'
  return 'at'
}

function calculateOpportunityScore(report: any): any {
  const scores = {
    priceCompetitiveness: 50,
    inventoryScarcity: 50,
    regionalDemand: 50,
    marketTiming: 50
  }

  // Price Competitiveness (0-100)
  if (report.marketPosition && !report.marketPosition.error) {
    const percentile = report.marketPosition.percentile || 50
    scores.priceCompetitiveness = 100 - Math.abs(50 - percentile) // Best at 50th percentile
  }

  // Inventory Scarcity (0-100)
  if (report.inventoryAnalysis && !report.inventoryAnalysis.error) {
    scores.inventoryScarcity = report.inventoryAnalysis.scarcityScore || 50
  }

  // Regional Demand (0-100)
  if (report.demandAnalysis && !report.demandAnalysis.error) {
    // Use search volume data for demand scoring
    const demandLevel = report.demandAnalysis.demandLevel
    const searchTrend = report.demandAnalysis.searchTrend
    
    let demandScore = 50
    if (demandLevel === 'high') demandScore = 80
    else if (demandLevel === 'medium') demandScore = 60
    else if (demandLevel === 'low') demandScore = 30
    
    // Adjust for trend
    if (searchTrend === 'rising') demandScore = Math.min(100, demandScore * 1.2)
    else if (searchTrend === 'declining') demandScore = demandScore * 0.8
    
    scores.regionalDemand = Math.round(demandScore)
  } else if (report.regionalPerformance && !report.regionalPerformance.error) {
    // Fallback to sales data if search volume not available
    const salesCount = report.regionalPerformance.citySalesCount || 0
    const trend = report.regionalPerformance.salesTrend
    
    let demandScore = Math.min(100, salesCount / 10) // 1000 sales = 100 score
    if (trend === 'increasing') demandScore = Math.min(100, demandScore * 1.2)
    if (trend === 'decreasing') demandScore = demandScore * 0.8
    
    scores.regionalDemand = Math.round(demandScore)
  }

  // Market Timing (0-100)
  if (report.regionalPerformance && !report.regionalPerformance.error) {
    const avgDaysOnMarket = report.regionalPerformance.avgDaysOnMarket || 60
    const timingScore = Math.max(0, 100 - avgDaysOnMarket) // Lower days = better timing
    scores.marketTiming = Math.round(timingScore)
  }

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (scores.priceCompetitiveness * 0.25) +
    (scores.inventoryScarcity * 0.25) +
    (scores.regionalDemand * 0.25) +
    (scores.marketTiming * 0.25)
  )

  return {
    overall,
    breakdown: scores
  }
}

function generateRecommendations(report: any): any {
  const recommendations: any = {}

  // Pricing recommendation
  if (report.marketPosition && !report.marketPosition.error) {
    recommendations.pricing = report.marketPosition.recommendation
  }

  // Inventory recommendation
  if (report.inventoryAnalysis && !report.inventoryAnalysis.error) {
    const mds = report.inventoryAnalysis.marketDaySupply
    if (mds < 30) {
      recommendations.inventory = 'Very low inventory levels. This vehicle is in high demand - hold firm on pricing'
    } else if (mds < 60) {
      recommendations.inventory = 'Healthy inventory turnover. Market is balanced for this vehicle'
    } else if (mds < 90) {
      recommendations.inventory = 'Inventory building up. Consider promotional pricing or incentives'
    } else {
      recommendations.inventory = 'High inventory levels. Aggressive pricing or transfers may be needed'
    }
  }

  // Timing recommendation
  if (report.regionalPerformance && !report.regionalPerformance.error) {
    const trend = report.regionalPerformance.salesTrend
    const avgDays = report.regionalPerformance.avgDaysOnMarket
    
    if (trend === 'increasing' && avgDays < 45) {
      recommendations.timing = 'Excellent market timing. High demand with quick turnover'
    } else if (trend === 'decreasing' || avgDays > 90) {
      recommendations.timing = 'Challenging market conditions. Act quickly to move inventory'
    } else {
      recommendations.timing = 'Stable market conditions. Focus on competitive pricing'
    }
  }

  // Demand recommendation
  if (report.demandAnalysis && !report.demandAnalysis.error) {
    const demandLevel = report.demandAnalysis.demandLevel
    const searchTrend = report.demandAnalysis.searchTrend
    const topKeyword = report.demandAnalysis.topKeywords[0]
    
    if (demandLevel === 'high' && searchTrend === 'rising') {
      recommendations.demand = `Very strong local demand with ${report.demandAnalysis.totalMonthlySearches.toLocaleString()} monthly searches in ${report.demandAnalysis.locationName}. Top search: "${topKeyword?.keyword}"`
    } else if (demandLevel === 'high') {
      recommendations.demand = `High local demand in ${report.demandAnalysis.locationName}. Focus on competitive pricing to capture market share`
    } else if (demandLevel === 'medium') {
      recommendations.demand = `Moderate demand in your market. Consider targeted marketing to boost visibility`
    } else {
      recommendations.demand = `Lower search demand in ${report.demandAnalysis.locationName}. May need aggressive pricing or consider transfers to higher-demand markets`
    }
  }

  // Overall action recommendation
  const score = report.opportunityScore?.overall || 50
  if (score >= 80) {
    recommendations.action = 'STRONG BUY: Excellent opportunity with high demand and good margins'
  } else if (score >= 60) {
    recommendations.action = 'HOLD: Solid market position, maintain current strategy'
  } else if (score >= 40) {
    recommendations.action = 'MONITOR: Market conditions require attention and possible adjustments'
  } else {
    recommendations.action = 'REVIEW: Consider transfers or aggressive pricing to move inventory'
  }

  return recommendations
}

function determineSearchTrend(volumeData: any[]): 'rising' | 'stable' | 'declining' {
  // Simple trend analysis based on search volume distribution
  // In a more sophisticated version, we'd look at historical data
  const totalVolume = volumeData.reduce((sum, kw) => sum + kw.search_volume, 0)
  const avgVolume = totalVolume / volumeData.length
  
  // Count keywords above and below average
  const aboveAvg = volumeData.filter(kw => kw.search_volume > avgVolume).length
  const percentAbove = aboveAvg / volumeData.length
  
  if (percentAbove > 0.6) return 'rising'
  if (percentAbove < 0.3) return 'declining'
  return 'stable'
}

function determineDemandLevel(totalSearchVolume: number): 'high' | 'medium' | 'low' {
  // Thresholds based on typical automotive search volumes
  if (totalSearchVolume > 10000) return 'high'
  if (totalSearchVolume > 2000) return 'medium'
  return 'low'
}