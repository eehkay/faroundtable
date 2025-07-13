import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MarketCheckClient, PopularCar } from '@/lib/analytics/clients/marketcheck';
import { DataForSEOClient } from '@/lib/analytics/clients/dataforseo';
import { getDealershipLocation, DealershipLocation } from '@/lib/queries/locations';
import { supabaseAdmin } from '@/lib/supabase-server';
import { CacheManager } from '@/lib/analytics/cache-manager';

interface StreamUpdate {
  type: 'status' | 'national_data' | 'city_data' | 'vehicle_analysis' | 'complete' | 'error';
  message?: string;
  progress?: number;
  data?: any;
}

interface OpportunityScore {
  score: number;
  factors: {
    demandScore: number;      // Market Opportunity (demand/supply ratio)
    profitScore: number;      // Profit Potential (was scarcityScore)
    velocityScore: number;    // Turnover Speed (days on market)
    trendScore: number;       // Market Momentum (search trend)
  };
}

interface VehicleOpportunity {
  make: string;
  model: string;
  year?: number;
  score: number;
  inventory: number;
  searchVolume: number;
  medianPrice: number;
  avgDaysOnMarket: number;
  medianDaysOnMarket: number;
  trend: 'rising' | 'stable' | 'declining';
  buyingGuidance: {
    targetBuyPrice: number;
    maxBuyPrice: number;
    expectedSellPrice: number;
    estimatedProfit: number;
  };
  scoreBreakdown: OpportunityScore['factors'];
  hasCPO: boolean;
  cpoMedianPrice?: number;
  cpoMedianDOM?: number;
}

function calculateOpportunityScore(
  vehicle: PopularCar,
  searchVolume: number,
  trend: 'rising' | 'stable' | 'declining'
): OpportunityScore {
  // Better scoring logic based on real business value
  const factors = {
    // Market Opportunity Score (demand-to-supply ratio)
    // High demand with reasonable supply is best (not zero inventory!)
    demandScore: calculateDemandScore(searchVolume, vehicle.count),
    
    // Profit Potential Score (price vs market, margins)
    // Using price IQR as a proxy for pricing flexibility
    profitScore: calculateProfitScore(vehicle),
    
    // Turnover Velocity Score (how fast they sell)
    velocityScore: calculateVelocityScore(vehicle.dom_stats.median),
    
    // Market Momentum Score (trend direction and strength)
    trendScore: calculateTrendScore(trend, searchVolume)
  };
  
  // Weighted average with business-focused weights
  const score = (
    factors.demandScore * 0.35 +      // Market opportunity most important
    factors.profitScore * 0.30 +      // Profit potential crucial
    factors.velocityScore * 0.20 +     // Turnover speed matters
    factors.trendScore * 0.15          // Future outlook
  );
  
  return {
    score: Math.round(score * 10) / 10,
    factors
  };
}

// Helper functions for clearer scoring logic
function calculateDemandScore(searchVolume: number, inventory: number): number {
  // Avoid division by zero and reward balanced demand/supply
  const demandSupplyRatio = searchVolume / Math.max(inventory, 1);
  
  // Sweet spot is 50-200 searches per vehicle in inventory
  if (demandSupplyRatio < 10) return 2; // Oversupplied
  if (demandSupplyRatio < 25) return 4; // Low demand
  if (demandSupplyRatio < 50) return 6; // Moderate demand
  if (demandSupplyRatio < 100) return 8; // Good demand
  if (demandSupplyRatio < 200) return 10; // Excellent demand
  return 9; // Very high demand (might be too niche)
}

function calculateProfitScore(vehicle: PopularCar): number {
  // Use price stats to estimate profit potential
  const priceSpread = vehicle.price_stats.max - vehicle.price_stats.min;
  const medianPrice = vehicle.price_stats.median;
  const priceFlexibility = (priceSpread / medianPrice) * 100;
  
  // Higher price flexibility = more profit opportunity
  if (priceFlexibility < 10) return 3;  // Tight margins
  if (priceFlexibility < 20) return 5;  // Normal margins
  if (priceFlexibility < 30) return 7;  // Good margins
  if (priceFlexibility < 40) return 9;  // Excellent margins
  return 10; // Premium opportunity
}

function calculateVelocityScore(medianDOM: number): number {
  // Realistic DOM scoring
  if (medianDOM <= 30) return 10;  // Flies off the lot
  if (medianDOM <= 45) return 8;   // Fast mover
  if (medianDOM <= 60) return 6;   // Average pace
  if (medianDOM <= 90) return 4;   // Slow mover
  if (medianDOM <= 120) return 2;  // Very slow
  return 1; // Stagnant inventory
}

function calculateTrendScore(trend: 'rising' | 'stable' | 'declining', searchVolume: number): number {
  // Consider both trend direction and search volume strength
  const baseScore = trend === 'rising' ? 10 : trend === 'stable' ? 5 : 0;
  
  // Adjust based on search volume (low volume trends less reliable)
  if (searchVolume < 100) return Math.round(baseScore * 0.5); // Low confidence
  if (searchVolume < 500) return Math.round(baseScore * 0.75); // Medium confidence
  return baseScore; // High confidence
}

function calculateTrend(monthlySearches: Array<{ year: number; month: number; search_volume: number }> | undefined): 'rising' | 'stable' | 'declining' {
  if (!monthlySearches || monthlySearches.length < 6) return 'stable';
  
  // Sort by date (most recent first)
  const sorted = monthlySearches.sort((a, b) => {
    const dateA = new Date(a.year, a.month - 1);
    const dateB = new Date(b.year, b.month - 1);
    return dateB.getTime() - dateA.getTime();
  });
  
  const recent = sorted.slice(0, 3).reduce((sum, m) => sum + m.search_volume, 0) / 3;
  const older = sorted.slice(3, 6).reduce((sum, m) => sum + m.search_volume, 0) / 3;
  
  if (older === 0) return 'stable';
  
  const change = ((recent - older) / older) * 100;
  
  if (change > 20) return 'rising';
  if (change < -20) return 'declining';
  return 'stable';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const cacheManager = new CacheManager(24); // 24 hour cache for regional data

  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { locationId, radius = 50, forceRefresh = false } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    // Check if analytics feature is enabled
    const analyticsEnabled = process.env.ENABLE_ADVANCED_ANALYTICS === 'true';
    if (!analyticsEnabled) {
      return NextResponse.json({ 
        error: 'Analytics feature is not enabled' 
      }, { status: 503 });
    }

    // Get location details
    const dealership = await getDealershipLocation(locationId);
    if (!dealership) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
    }

    // Extract city and state from location
    // Assuming location format includes city and state info
    // For now, we'll use a default or parse from the dealership data
    const cityState = parseCityState(dealership);
    if (!cityState) {
      return NextResponse.json({ 
        error: 'Could not determine city/state for this location' 
      }, { status: 400 });
    }

    // Check cache first
    const cacheKey = {
      locationId,
      city: cityState.city,
      state: cityState.state,
      radius
    };

    const cachedResult = await cacheManager.get<any>(
      'regional_trends',
      'combined',
      cacheKey,
      { forceRefresh }
    );

    if (cachedResult) {
      // Stream cached result back for consistency
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Send status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Loading cached data...',
            progress: 50
          })}\n\n`));

          // Send cached data
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete',
            data: {
              ...cachedResult,
              cached: true,
              cacheAge: Math.round((Date.now() - new Date(cachedResult.generated).getTime()) / 1000 / 60) // minutes
            },
            progress: 100
          })}\n\n`));

          // Log cached hit
          await logAnalyticsUsage({
            userId: session.user.id,
            locationId,
            endpoint: '/api/analytics/regional/analyze',
            apiCalls: { marketcheck: 0, dataforseo: 0 },
            responseTime: Date.now() - startTime,
            cacheHit: true,
          });

          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Initialize API clients
    const marketCheckKey = process.env.MARKETCHECK_API_KEY;
    const dataForSEOEmail = process.env.DATAFORSEO_EMAIL;
    const dataForSEOKey = process.env.DATAFORSEO_API_KEY;

    if (!marketCheckKey || !dataForSEOEmail || !dataForSEOKey) {
      return NextResponse.json({ 
        error: 'Analytics APIs not configured' 
      }, { status: 503 });
    }

    const marketCheckClient = new MarketCheckClient({ apiKey: marketCheckKey });
    const dataForSEOClient = new DataForSEOClient({ 
      email: dataForSEOEmail, 
      apiKey: dataForSEOKey 
    });

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (update: StreamUpdate) => {
          const data = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Step 1: Get national popular cars (immediate response)
          sendUpdate({ 
            type: 'status', 
            message: 'Fetching national popular vehicles...',
            progress: 5
          });

          const nationalPopularCars = await marketCheckClient.getPopularCarsNational({
            limit: 50,
            carType: 'used'
          });

          sendUpdate({ 
            type: 'national_data',
            data: {
              nationalVehicles: nationalPopularCars.map(car => ({
                make: car.make,
                model: car.model,
                inventory: car.count,
                medianPrice: car.price_stats.median,
                priceRange: { min: car.price_stats.min, max: car.price_stats.max },
                avgDaysOnMarket: car.dom_stats.mean,
                medianDaysOnMarket: car.dom_stats.median,
                medianMileage: car.miles_stats.median,
                mileageRange: { min: car.miles_stats.min, max: car.miles_stats.max },
                avgMileage: car.miles_stats.mean,
              }))
            },
            progress: 10
          });

          // Step 2: Get city-specific popular cars
          sendUpdate({ 
            type: 'status', 
            message: 'Fetching popular vehicles in your market...',
            progress: 15
          });

          const cityPopularCars = await marketCheckClient.getPopularCarsByCity({
            city: cityState.city,
            state: cityState.state,
            limit: 25,
            carType: 'used'
          });

          sendUpdate({ 
            type: 'city_data',
            data: {
              cityVehicles: cityPopularCars.map(car => ({
                make: car.make,
                model: car.model,
                inventory: car.count,
                medianPrice: car.price_stats.median,
                priceRange: { min: car.price_stats.min, max: car.price_stats.max },
                avgDaysOnMarket: car.dom_stats.mean,
                medianDaysOnMarket: car.dom_stats.median,
                medianMileage: car.miles_stats.median,
                mileageRange: { min: car.miles_stats.min, max: car.miles_stats.max },
                avgMileage: car.miles_stats.mean,
                hasCPO: (car.cpo_price_stats?.listings_count || 0) > 0,
                cpoInventory: car.cpo_price_stats?.listings_count || 0,
                cpoMedianPrice: car.cpo_price_stats?.median,
                cpoMedianDOM: car.cpo_dom_stats?.median,
                cpoMedianMileage: car.cpo_miles_stats?.median,
              }))
            },
            progress: 20
          });

          // Step 3: Process city vehicles with search demand analysis
          const results: VehicleOpportunity[] = [];
          const topVehicles = cityPopularCars;

          for (let i = 0; i < topVehicles.length; i++) {
            const vehicle = topVehicles[i];
            
            sendUpdate({ 
              type: 'status', 
              message: `Analyzing ${vehicle.make} ${vehicle.model} (${i + 1}/${topVehicles.length})`,
              progress: 20 + (i / topVehicles.length * 70)
            });

            try {
              // Get search demand
              const searchData = await dataForSEOClient.getSearchVolumeByCoordinate(
                [`${vehicle.make} ${vehicle.model}`],
                dealership.coordinates?.lat || 39.5296,
                dealership.coordinates?.lng || -119.8138,
                radius,
                ['rental', 'lease', 'parts', 'repair', 'manual']
              );

              const keywords = Array.isArray(searchData) ? searchData : (searchData as any).results || [];
              const totalSearchVolume = keywords
                .slice(0, 10)
                .reduce((sum: number, k: any) => sum + (k.search_volume || 0), 0);

              const trend = calculateTrend(keywords[0]?.monthly_searches);

              // Calculate opportunity score
              const opportunityScore = calculateOpportunityScore(vehicle, totalSearchVolume, trend);

              // Create vehicle opportunity
              const opportunity: VehicleOpportunity = {
                make: vehicle.make,
                model: vehicle.model,
                score: opportunityScore.score,
                inventory: vehicle.count,
                searchVolume: totalSearchVolume,
                medianPrice: vehicle.price_stats.median,
                avgDaysOnMarket: vehicle.dom_stats.mean,
                medianDaysOnMarket: vehicle.dom_stats.median,
                trend,
                buyingGuidance: {
                  targetBuyPrice: Math.round(vehicle.price_stats.median * 0.88), // 12% below median
                  maxBuyPrice: Math.round(vehicle.price_stats.median * 0.92),    // 8% below median
                  expectedSellPrice: vehicle.price_stats.median,
                  estimatedProfit: Math.round(vehicle.price_stats.median * 0.08) // 8% margin
                },
                scoreBreakdown: opportunityScore.factors,
                hasCPO: (vehicle.cpo_price_stats?.listings_count || 0) > 0,
                cpoMedianPrice: vehicle.cpo_price_stats?.median,
                cpoMedianDOM: vehicle.cpo_dom_stats?.median
              };

              results.push(opportunity);

              // Send individual vehicle analysis update
              sendUpdate({
                type: 'vehicle_analysis',
                data: {
                  vehicle: opportunity,
                  completedCount: results.length,
                  totalCount: topVehicles.length
                },
                progress: 20 + (results.length / topVehicles.length * 70)
              });
            } catch (error) {
              console.error(`Failed to analyze ${vehicle.make} ${vehicle.model}:`, error);
              // Continue with other vehicles
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Step 4: Sort by opportunity and send final results
          sendUpdate({ 
            type: 'status', 
            message: 'Finalizing analysis...',
            progress: 95
          });

          const sortedResults = results.sort((a, b) => b.score - a.score);

          const finalData = {
            generated: new Date().toISOString(),
            market: `${cityState.city}, ${cityState.state}`,
            nationalVehicles: nationalPopularCars.slice(0, 50).map(car => ({
              make: car.make,
              model: car.model,
              inventory: car.count,
              medianPrice: car.price_stats.median,
              priceRange: { min: car.price_stats.min, max: car.price_stats.max },
              avgDaysOnMarket: car.dom_stats.mean,
              medianDaysOnMarket: car.dom_stats.median,
              medianMileage: car.miles_stats.median,
              mileageRange: { min: car.miles_stats.min, max: car.miles_stats.max },
              avgMileage: car.miles_stats.mean,
            })),
            cityVehicles: cityPopularCars.map(car => ({
              make: car.make,
              model: car.model,
              inventory: car.count,
              medianPrice: car.price_stats.median,
              priceRange: { min: car.price_stats.min, max: car.price_stats.max },
              avgDaysOnMarket: car.dom_stats.mean,
              medianDaysOnMarket: car.dom_stats.median,
              medianMileage: car.miles_stats.median,
              mileageRange: { min: car.miles_stats.min, max: car.miles_stats.max },
              avgMileage: car.miles_stats.mean,
              hasCPO: (car.cpo_price_stats?.listings_count || 0) > 0,
              cpoInventory: car.cpo_price_stats?.listings_count || 0,
              cpoMedianPrice: car.cpo_price_stats?.median,
              cpoMedianDOM: car.cpo_dom_stats?.median,
              cpoMedianMileage: car.cpo_miles_stats?.median,
            })),
            topOpportunities: sortedResults.slice(0, 10),
            allOpportunities: sortedResults,
            avoidList: sortedResults.filter(v => v.score < 3)
          };

          sendUpdate({ 
            type: 'complete',
            data: finalData,
            progress: 100
          });

          // Cache the result
          await cacheManager.set(
            'regional_trends',
            'combined',
            cacheKey,
            finalData,
            { ttlHours: 24 }
          );

          // Log usage
          const responseTime = Date.now() - startTime;
          await logAnalyticsUsage({
            userId: session.user.id,
            locationId,
            endpoint: '/api/analytics/regional/analyze',
            apiCalls: {
              marketcheck: 1,
              dataforseo: results.length,
            },
            responseTime,
            cacheHit: false,
          });

        } catch (error) {
          sendUpdate({ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'Analysis failed'
          });
        } finally {
          controller.close();
        }
      }
    });

    // Return stream as Server-Sent Events
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Regional analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze regional market',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to parse city/state from dealership data
function parseCityState(dealership: DealershipLocation): { city: string; state: string } | null {
  // First try to use city_state if available
  if (dealership.city_state) {
    const parts = dealership.city_state.split('|');
    if (parts.length === 2) {
      return { city: parts[0], state: parts[1] };
    }
  }
  
  // Fall back to individual city/state fields
  if (dealership.city && dealership.state) {
    return { city: dealership.city, state: dealership.state };
  }
  
  // Default fallback based on coordinates (Phoenix area)
  return { city: 'phoenix', state: 'AZ' };
}

// Helper function to log analytics usage
async function logAnalyticsUsage(data: {
  userId: string;
  locationId?: string;
  endpoint: string;
  apiCalls: Record<string, number>;
  responseTime: number;
  cacheHit: boolean;
}) {
  try {
    await supabaseAdmin
      .from('analytics_usage')
      .insert({
        user_id: data.userId,
        location_id: data.locationId,
        endpoint: data.endpoint,
        api_calls: data.apiCalls,
        response_time_ms: data.responseTime,
        cache_hit: data.cacheHit,
      });
  } catch (error) {
    console.error('Failed to log analytics usage:', error);
  }
}