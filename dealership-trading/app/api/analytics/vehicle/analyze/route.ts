import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aggregator } from '@/lib/analytics';
import { VehicleAnalysisRequest, AnalyticsApiResponse, VehicleAnalysis } from '@/types/analytics';
import { supabaseAdmin } from '@/lib/supabase-server';

// Validation function for the request
function validateVehicleAnalysisRequest(data: any): { valid: boolean; error?: string; data?: VehicleAnalysisRequest } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  // Check for either VIN or make/model/year
  const hasVin = data.vin && typeof data.vin === 'string' && data.vin.length === 17;
  const hasMakeModelYear = data.make && data.model && data.year &&
    typeof data.make === 'string' && data.make.length > 0 &&
    typeof data.model === 'string' && data.model.length > 0 &&
    typeof data.year === 'number' && data.year >= 1900 && data.year <= new Date().getFullYear() + 2;

  if (!hasVin && !hasMakeModelYear) {
    return { valid: false, error: 'Either VIN or make/model/year must be provided' };
  }

  // Validate optional fields
  if (data.location) {
    if (!data.location.lat || !data.location.lng ||
        typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number' ||
        data.location.lat < -90 || data.location.lat > 90 ||
        data.location.lng < -180 || data.location.lng > 180) {
      return { valid: false, error: 'Invalid location coordinates' };
    }
  }

  if (data.radius !== undefined) {
    if (typeof data.radius !== 'number' || data.radius < 1 || data.radius > 500) {
      return { valid: false, error: 'Radius must be between 1 and 500 miles' };
    }
  }

  return { valid: true, data: data as VehicleAnalysisRequest };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = validateVehicleAnalysisRequest(body);
    
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: validationResult.error || 'Invalid request'
      }, { status: 400 });
    }

    const analysisRequest: VehicleAnalysisRequest = validationResult.data!;

    // Check if analytics feature is enabled
    const analyticsEnabled = process.env.ENABLE_ADVANCED_ANALYTICS === 'true';
    if (!analyticsEnabled) {
      return NextResponse.json({ 
        error: 'Analytics feature is not enabled' 
      }, { status: 503 });
    }

    // Perform the analysis
    const analysis = await aggregator.analyzeVehicle(analysisRequest);

    // Log usage for tracking
    const responseTime = Date.now() - startTime;
    await logAnalyticsUsage({
      userId: session.user.id,
      locationId: analysisRequest.locationId,
      endpoint: '/api/analytics/vehicle/analyze',
      apiCalls: {
        marketcheck: 1,
        dataforseo: 1,
      },
      responseTime,
      cacheHit: false, // Will be true if data came from cache
    });

    // Return the analysis
    const response: AnalyticsApiResponse<VehicleAnalysis> = {
      data: analysis,
      cached: false, // TODO: Get this from aggregator
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Vehicle analysis error:', error);
    
    // Log error for monitoring
    const responseTime = Date.now() - startTime;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await logAnalyticsUsage({
        userId: session.user.id,
        endpoint: '/api/analytics/vehicle/analyze',
        apiCalls: {},
        responseTime,
        cacheHit: false,
      });
    }

    return NextResponse.json({ 
      error: 'Failed to analyze vehicle',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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