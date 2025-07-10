import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DataForSEODebugClient } from '@/lib/analytics/clients/dataforseo-debug';

interface TestRequest {
  keywords: string[];
  locationCodes: number[];
}

const LOCATION_NAMES: Record<number, string> = {
  2840: 'United States',
  1022639: 'Nevada',
  1014044: 'California',
  1022595: 'Las Vegas Metro',
  1014073: 'San Diego Metro',
  1013962: 'Los Angeles Metro',
};

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: TestRequest = await request.json();
    
    if (!body.keywords || body.keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords are required' }, { status: 400 });
    }
    
    if (!body.locationCodes || body.locationCodes.length === 0) {
      return NextResponse.json({ error: 'At least one location is required' }, { status: 400 });
    }

    // Initialize DataForSEO debug client
    const client = new DataForSEODebugClient({
      email: process.env.DATAFORSEO_EMAIL || '',
      apiKey: process.env.DATAFORSEO_API_KEY || '',
    });

    // Get search volume for each location
    const results = [];
    const debugInfo: any = {};
    
    for (const locationCode of body.locationCodes) {
      try {
        const debugData = await client.getSearchVolumeWithDebug(body.keywords, locationCode);
        
        results.push({
          locationName: LOCATION_NAMES[locationCode] || `Location ${locationCode}`,
          locationCode,
          results: debugData.results,
          totalVolume: debugData.results.reduce((sum, kw) => sum + kw.search_volume, 0),
        });

        // Store debug info for the first location only to avoid too much data
        if (Object.keys(debugInfo).length === 0) {
          debugInfo.curlCommand = debugData.debug.curlCommand;
          debugInfo.rawResponse = debugData.debug.rawResponse;
          debugInfo.requestData = debugData.debug.requestBody;
          debugInfo.endpoint = debugData.debug.apiUrl;
        }
      } catch (error) {
        console.error(`Error getting data for location ${locationCode}:`, error);
        results.push({
          locationName: LOCATION_NAMES[locationCode] || `Location ${locationCode}`,
          locationCode,
          results: [],
          totalVolume: 0,
        });
      }
    }

    return NextResponse.json({ 
      results,
      debug: debugInfo,
    });
  } catch (error) {
    console.error('Test search volume error:', error);
    return NextResponse.json({ 
      error: 'Failed to get search volume data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}