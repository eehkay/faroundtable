import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MarketCheckClient } from '@/lib/analytics/clients/marketcheck';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if analytics feature is enabled
    const analyticsEnabled = process.env.ENABLE_ADVANCED_ANALYTICS === 'true';
    if (!analyticsEnabled) {
      return NextResponse.json({ 
        error: 'Analytics feature is not enabled' 
      }, { status: 503 });
    }

    const apiKey = process.env.MARKETCHECK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'MarketCheck API key not configured' 
      }, { status: 503 });
    }

    const client = new MarketCheckClient({ apiKey });

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: VIN Decode (should always work if API key is valid)
    try {
      console.log('[Test] Testing VIN decode...');
      const vinResult = await client.decodeVin('1HGBH41JXMN109186');
      results.tests.push({
        name: 'VIN Decode',
        endpoint: '/v2/decode/car/{vin}/specs',
        status: 'success',
        result: vinResult
      });
    } catch (error) {
      results.tests.push({
        name: 'VIN Decode',
        endpoint: '/v2/decode/car/{vin}/specs',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Search vehicles (basic search)
    try {
      console.log('[Test] Testing vehicle search...');
      const searchResult = await client.searchVehicles({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        location: { lat: 33.0, lng: -117.0 },
        radius: 50
      });
      results.tests.push({
        name: 'Vehicle Search',
        endpoint: '/v2/search',
        status: 'success',
        result: {
          listingsCount: searchResult.listings?.length || 0,
          stats: searchResult.stats
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Vehicle Search',
        endpoint: '/v2/search',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Popular cars by city
    try {
      console.log('[Test] Testing popular cars by city...');
      const popularResult = await client.getPopularCarsByCity({
        city: 'Phoenix',
        state: 'AZ',
        limit: 10
      });
      results.tests.push({
        name: 'Popular Cars by City',
        endpoint: '/v2/popular/cars/city',
        status: 'success',
        result: {
          count: popularResult.length,
          firstItem: popularResult[0]
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Popular Cars by City',
        endpoint: '/v2/popular/cars/city',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Price prediction
    try {
      console.log('[Test] Testing price prediction...');
      const predictionResult = await client.getPricePrediction({
        vin: '1HGBH41JXMN109186'
      });
      results.tests.push({
        name: 'Price Prediction',
        endpoint: '/v2/predict/car/price',
        status: 'success',
        result: predictionResult
      });
    } catch (error) {
      results.tests.push({
        name: 'Price Prediction',
        endpoint: '/v2/predict/car/price',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Regional stats (the one that's failing)
    try {
      console.log('[Test] Testing regional stats...');
      const regionalResult = await client.getRegionalStats(
        'Toyota',
        'Camry',
        { lat: 33.0, lng: -117.0 },
        50
      );
      results.tests.push({
        name: 'Regional Stats',
        endpoint: '/v2/search (via getRegionalStats)',
        status: 'success',
        result: regionalResult
      });
    } catch (error) {
      results.tests.push({
        name: 'Regional Stats',
        endpoint: '/v2/search (via getRegionalStats)',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      });
    }

    // Summary
    const successCount = results.tests.filter((t: any) => t.status === 'success').length;
    const failureCount = results.tests.filter((t: any) => t.status === 'failed').length;

    results.summary = {
      total: results.tests.length,
      success: successCount,
      failed: failureCount,
      allPassed: failureCount === 0
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('[MarketCheck Test] Error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}