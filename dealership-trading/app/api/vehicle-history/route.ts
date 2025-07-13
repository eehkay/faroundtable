import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface ListingRecord {
  id: string;
  price: number;
  miles: number;
  data_source: string;
  vdp_url?: string;
  seller_type: string;
  inventory_type: string;
  last_seen_at: number;
  last_seen_at_date: string;
  scraped_at: number;
  scraped_at_date: string;
  first_seen_at: number;
  first_seen_at_date: string;
  source: string;
  seller_name: string;
  city: string;
  state: string;
  zip: string;
  status_date: number;
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
    const { vin } = body;

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required' }, { status: 400 });
    }

    // Get MarketCheck API key
    const apiKey = process.env.MARKETCHECK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MarketCheck API key not configured' }, { status: 500 });
    }

    // Call MarketCheck vehicle history API
    const apiUrl = `https://mc-api.marketcheck.com/v2/history/car/${vin}`;
    const queryParams = new URLSearchParams({
      api_key: apiKey,
      sort_order: 'desc' // Most recent first
    });

    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch vehicle history', details: errorText },
        { status: response.status }
      );
    }

    const listings: ListingRecord[] = await response.json();

    // Process and analyze the listing history
    const processedData = processListingHistory(listings);

    return NextResponse.json({
      listings: processedData.listings,
      summary: processedData.summary,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch vehicle history',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

function processListingHistory(listings: ListingRecord[]) {
  if (!listings || listings.length === 0) {
    return {
      listings: [],
      summary: {
        totalListings: 0,
        uniqueDealers: 0,
        priceRange: { min: 0, max: 0, current: 0 },
        mileageRange: { min: 0, max: 0, current: 0 },
        totalDaysListed: 0,
        averageDaysPerListing: 0,
        priceHistory: [],
        hasMultipleDealers: false,
        currentListing: null
      }
    };
  }

  // Sort by last_seen_at descending (most recent first)
  const sortedListings = [...listings].sort((a, b) => b.last_seen_at - a.last_seen_at);
  
  // Get unique dealers
  const uniqueDealers = new Set(listings.map(l => l.seller_name));
  
  // Calculate price range
  const prices = listings.map(l => l.price).filter(p => p > 0);
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices),
    current: sortedListings[0]?.price || 0
  };
  
  // Calculate mileage range
  const mileages = listings.map(l => l.miles).filter(m => m > 0);
  const mileageRange = {
    min: Math.min(...mileages),
    max: Math.max(...mileages),
    current: sortedListings[0]?.miles || 0
  };
  
  // Calculate total days listed and average days per listing
  let totalDaysListed = 0;
  const processedListings = sortedListings.map(listing => {
    const firstSeen = new Date(listing.first_seen_at_date);
    const lastSeen = new Date(listing.last_seen_at_date);
    const daysOnMarket = Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
    
    totalDaysListed += daysOnMarket;
    
    return {
      ...listing,
      daysOnMarket,
      isCurrentListing: listing === sortedListings[0] && 
        (new Date().getTime() - new Date(listing.last_seen_at_date).getTime()) < 7 * 24 * 60 * 60 * 1000 // Active within last 7 days
    };
  });
  
  // Create price history for visualization
  const priceHistory = processedListings.map(listing => ({
    date: listing.first_seen_at_date,
    price: listing.price,
    dealer: listing.seller_name,
    miles: listing.miles
  }));
  
  // Identify the current/most recent listing
  const currentListing = processedListings[0]?.isCurrentListing ? processedListings[0] : null;
  
  return {
    listings: processedListings,
    summary: {
      totalListings: listings.length,
      uniqueDealers: uniqueDealers.size,
      priceRange,
      mileageRange,
      totalDaysListed,
      averageDaysPerListing: Math.round(totalDaysListed / listings.length),
      priceHistory,
      hasMultipleDealers: uniqueDealers.size > 1,
      currentListing,
      oldestListingDate: sortedListings[sortedListings.length - 1]?.first_seen_at_date,
      newestListingDate: sortedListings[0]?.last_seen_at_date
    }
  };
}