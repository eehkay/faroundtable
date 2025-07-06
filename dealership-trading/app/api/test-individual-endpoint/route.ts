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

    console.log('Authenticating with Auto Dealer Data API for individual endpoint test...');
    
    const response = await fetch(authUrl.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth response:', response.status, errorText);
      throw new Error(`Failed to authenticate with Auto Dealer Data API: ${response.status}`);
    }

    const data = await response.json();
    
    // The API returns the token in the 'token' field
    tokenCache.token = data.token;
    tokenCache.expiresAt = data.expires ? data.expires * 1000 : Date.now() + (55 * 60 * 1000);
    
    if (!tokenCache.token) {
      throw new Error('No token received from Auto Dealer Data API');
    }
    
    console.log('Auth successful, token cached for individual endpoint test');
    
    return tokenCache.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  console.log('Individual endpoint test API called');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'authenticated' : 'not authenticated');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { endpoint, params } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    console.log('Testing individual endpoint:', endpoint, 'with params:', params);
    
    // Get JWT token
    const jwt = await getAuthToken();
    console.log('JWT token obtained for individual endpoint test');

    // Build API URL based on endpoint
    const apiUrl = process.env.AUTODEALERDATA_API_URL;
    let endpointUrl: string;

    switch (endpoint) {
      case 'salePrice':
        endpointUrl = `${apiUrl}/salePrice?` + new URLSearchParams({
          jwt: jwt,
          brandName: params.brandName || '',
          regionName: params.regionName || 'REGION_STATE_CA',
        });
        break;
      
      case 'valuation':
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - 45); // 45 days back
        
        endpointUrl = `${apiUrl}/valuation?` + new URLSearchParams({
          jwt: jwt,
          vin: params.vin || '',
          dealerID: '0',
          zipCode: params.zipCode || '89104',
          latitude: '0',
          longitude: '0',
          radius: '0',
          regionName: params.regionName || 'REGION_STATE_CA',
          mileageLow: '0',
          mileageHigh: '999999',
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          daysBack: '45',
          newCars: 'false',
          extendedSearch: 'false',
          sameYear: 'false',
        });
        break;
      
      case 'similarSalePrice':
        endpointUrl = `${apiUrl}/similarSalePrice?` + new URLSearchParams({
          jwt: jwt,
          vin: params.vin || '',
          zipCode: params.zipCode || '89104',
          regionName: params.regionName || 'REGION_STATE_CA',
        });
        break;
      
      default:
        return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });
    }

    console.log(`Calling ${endpoint} API:`, endpointUrl);
    
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log(`${endpoint} API response status:`, response.status);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    // Return response with metadata for debugging
    const result = {
      endpoint: endpoint,
      params: params,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
      },
      timestamp: new Date().toISOString(),
    };

    if (!response.ok) {
      console.error(`${endpoint} API error:`, response.status, responseText);
      return NextResponse.json({
        ...result,
        error: `API returned status ${response.status}`,
      }, { status: response.status });
    }

    console.log(`${endpoint} API test successful`);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Individual endpoint test error:', error);
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to test individual endpoint',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}