import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aggregator } from '@/lib/analytics';
import { RegionalInsightsRequest, AnalyticsApiResponse, RegionalInsights } from '@/types/analytics';
import { supabaseAdmin } from '@/lib/supabase-server';

// Validation function for the request
function validateRegionalInsightsRequest(data: any): { valid: boolean; error?: string; data?: RegionalInsightsRequest } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request data' };
  }

  // Validate locationId (required UUID)
  if (!data.locationId || typeof data.locationId !== 'string') {
    return { valid: false, error: 'locationId is required' };
  }

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(data.locationId)) {
    return { valid: false, error: 'Invalid locationId format' };
  }

  // Validate radius (optional)
  if (data.radius !== undefined && data.radius !== null) {
    if (typeof data.radius !== 'number' || data.radius < 1 || data.radius > 500) {
      return { valid: false, error: 'Radius must be between 1 and 500 miles' };
    }
  }

  // Set defaults
  const result: RegionalInsightsRequest = {
    locationId: data.locationId,
    radius: data.radius || 50,
    includeCompetitors: data.includeCompetitors !== false,
  };

  return { valid: true, data: result };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : undefined;
    const includeCompetitors = searchParams.get('includeCompetitors') !== 'false';

    // Validate parameters
    const validationResult = validateRegionalInsightsRequest({
      locationId,
      radius,
      includeCompetitors,
    });
    
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: validationResult.error || 'Invalid request'
      }, { status: 400 });
    }

    const insightsRequest: RegionalInsightsRequest = validationResult.data!;

    // Check if user has access to this location (for non-admin users)
    if (session.user.role !== 'admin') {
      const userLocation = session.user.location?.id;
      if (userLocation && userLocation !== insightsRequest.locationId) {
        return NextResponse.json({ 
          error: 'Access denied to this location' 
        }, { status: 403 });
      }
    }

    // Check if analytics feature is enabled
    const analyticsEnabled = process.env.ENABLE_ADVANCED_ANALYTICS === 'true';
    if (!analyticsEnabled) {
      return NextResponse.json({ 
        error: 'Analytics feature is not enabled' 
      }, { status: 503 });
    }

    // Get the regional insights
    const insights = await aggregator.getRegionalInsights(insightsRequest);

    // Log usage for tracking
    const responseTime = Date.now() - startTime;
    await logAnalyticsUsage({
      userId: session.user.id,
      locationId: insightsRequest.locationId,
      endpoint: '/api/analytics/regional/trends',
      apiCalls: {
        marketcheck: 3, // Multiple calls for different vehicles
        dataforseo: 3,
      },
      responseTime,
      cacheHit: false,
    });

    // Return the insights
    const response: AnalyticsApiResponse<RegionalInsights> = {
      data: insights,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Regional insights error:', error);
    
    // Log error for monitoring
    const responseTime = Date.now() - startTime;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await logAnalyticsUsage({
        userId: session.user.id,
        endpoint: '/api/analytics/regional/trends',
        apiCalls: {},
        responseTime,
        cacheHit: false,
      });
    }

    return NextResponse.json({ 
      error: 'Failed to get regional insights',
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