import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Cache for JWT tokens to avoid excessive auth calls
const tokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

async function getAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  try {
    // The API uses API Key ID and API Key for authentication
    const apiID = process.env.AUTODEALERDATA_API_KEY_ID;
    const apiKey = process.env.AUTODEALERDATA_API_KEY;
    
    if (!apiID || !apiKey) {
      throw new Error('Auto Dealer Data API credentials not configured');
    }

    // The API expects query parameters for authentication
    const authUrl = new URL(`${process.env.AUTODEALERDATA_API_URL}/getToken`);
    authUrl.searchParams.append('apiID', apiID);
    authUrl.searchParams.append('apiKey', apiKey);

    
    const response = await fetch(authUrl.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to authenticate with Auto Dealer Data API: ${response.status}`);
    }

    const data = await response.json();
    
    // The API returns the token in the 'token' field
    tokenCache.token = data.token;
    tokenCache.expiresAt = data.expires ? data.expires * 1000 : Date.now() + (55 * 60 * 1000);
    
    if (!tokenCache.token) {
      throw new Error('No token received from Auto Dealer Data API');
    }
    
    
    return tokenCache.token;
  } catch (error) {
    throw error;
  }
}

export async function POST(req: NextRequest) {
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { vin, zipCode } = body;

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required for market insights' }, { status: 400 });
    }

    
    // Get JWT token
    const jwt = await getAuthToken();

    // Prepare API calls
    const apiUrl = process.env.AUTODEALERDATA_API_URL;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    };

    // Call similarSalePrice endpoint for market insights
    const similarPriceRes = await fetch(`${apiUrl}/similarSalePrice?` + new URLSearchParams({
      jwt: jwt,
      vin: vin,
      zipCode: zipCode || '89104',
      regionName: 'REGION_STATE_CA',
    }), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });


    if (!similarPriceRes.ok) {
      const errorText = await similarPriceRes.text();
      return NextResponse.json(
        { error: 'Failed to fetch market insights', details: errorText },
        { status: similarPriceRes.status }
      );
    }

    const data = await similarPriceRes.json();
    
    // Map API response to market insights format
    const similarData = data.data || {};
    const insights = {
      vin: vin,
      zipCode: zipCode || '89104',
      regionName: data.regionName,
      timeframe: {
        daysBack: similarData.daysBack || 45,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      newVehicles: {
        averagePrice: similarData.newSaleAvg,
        standardDeviation: similarData.newSaleStdDev,
        sampleSize: similarData.newCount,
      },
      usedVehicles: {
        averagePrice: similarData.usedSaleAvg,
        standardDeviation: similarData.usedSaleStdDev,
        sampleSize: similarData.usedCount,
      },
      mileage: {
        average: similarData.milesAvg,
        standardDeviation: similarData.milesStdDev,
        sampleSize: similarData.mileCount,
      },
      cacheTimeLimit: data.cacheTimeLimit,
      dataDate: new Date().toISOString(),
    };

    return NextResponse.json(insights);
  } catch (error) {
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch market insights',
        details: errorMessage,
        // Include more context in development
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    );
  }
}