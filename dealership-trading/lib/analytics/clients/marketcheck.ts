import { 
  MarketData, 
  CompetitiveAnalysis, 
  Competitor,
  PricePoint,
  VehicleAnalysisRequest 
} from '@/types/analytics';

export interface MarketCheckConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface MarketCheckVehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  miles: number;
  dealer: {
    name: string;
    distance: number;
    city: string;
    state: string;
  };
  dom: number; // days on market
  last_seen_at: string;
}

export interface MarketCheckSearchResponse {
  listings: MarketCheckVehicle[];
  stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    count: number;
  };
}

export class MarketCheckClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: MarketCheckConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://mc-api.marketcheck.com/v2';
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MarketCheck API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('MarketCheck API request timeout');
      }
      
      throw error;
    }
  }

  async searchVehicles(params: VehicleAnalysisRequest): Promise<MarketCheckSearchResponse> {
    const searchParams: Record<string, any> = {
      api_key: this.apiKey,
      year: params.year,
      make: params.make,
      model: params.model,
      radius: params.radius || 50,
      car_type: 'used',
      include_stats: true,
      rows: 100,
    };

    if (params.vin) {
      searchParams.vin = params.vin;
    }

    if (params.location) {
      searchParams.latitude = params.location.lat;
      searchParams.longitude = params.location.lng;
    }

    return this.request<MarketCheckSearchResponse>('/search', searchParams);
  }

  async getVehicleByVIN(vin: string): Promise<MarketCheckVehicle | null> {
    try {
      const response = await this.searchVehicles({ vin });
      return response.listings?.[0] || null;
    } catch (error) {
      console.error('Error fetching vehicle by VIN:', error);
      return null;
    }
  }

  async getRegionalStats(
    make: string, 
    model: string, 
    location: { lat: number; lng: number }, 
    radius: number = 50
  ): Promise<MarketData> {
    try {
      const response = await this.searchVehicles({
        make,
        model,
        location,
        radius,
      });

      const { stats, listings } = response;

      // Calculate price history from recent listings
      const priceHistory: PricePoint[] = [];
      const now = new Date();
      
      // Group listings by month for last 6 months
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthKey = monthDate.toISOString().slice(0, 7);
        
        const monthListings = listings.filter(listing => {
          const listingDate = new Date(listing.last_seen_at);
          return listingDate.toISOString().slice(0, 7) === monthKey;
        });

        if (monthListings.length > 0) {
          const avgPrice = monthListings.reduce((sum, l) => sum + l.price, 0) / monthListings.length;
          priceHistory.push({
            date: monthKey,
            price: avgPrice,
            count: monthListings.length,
          });
        }
      }

      // Determine market trend
      let marketTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (priceHistory.length >= 2) {
        const recentPrice = priceHistory[0].price;
        const olderPrice = priceHistory[priceHistory.length - 1].price;
        const changePercent = ((recentPrice - olderPrice) / olderPrice) * 100;
        
        if (changePercent > 5) marketTrend = 'increasing';
        else if (changePercent < -5) marketTrend = 'decreasing';
      }

      return {
        averagePrice: stats.mean,
        medianPrice: stats.median,
        priceRange: {
          min: stats.min,
          max: stats.max,
        },
        inventoryCount: stats.count,
        averageDaysOnLot: listings.reduce((sum, l) => sum + l.dom, 0) / listings.length || 0,
        priceHistory: priceHistory.reverse(),
        marketTrend,
      };
    } catch (error) {
      console.error('Error getting regional stats:', error);
      throw error;
    }
  }

  async getCompetitors(
    location: { lat: number; lng: number }, 
    radius: number = 50
  ): Promise<CompetitiveAnalysis> {
    try {
      // Search for all vehicles in the area to identify dealers
      const response = await this.request<MarketCheckSearchResponse>('/search', {
        latitude: location.lat,
        longitude: location.lng,
        radius,
        rows: 200,
        car_type: 'used',
      });

      // Group by dealer
      const dealerMap = new Map<string, { listings: MarketCheckVehicle[], totalPrice: number }>();
      
      response.listings.forEach(listing => {
        const dealerKey = listing.dealer.name;
        if (!dealerMap.has(dealerKey)) {
          dealerMap.set(dealerKey, { listings: [], totalPrice: 0 });
        }
        const dealer = dealerMap.get(dealerKey)!;
        dealer.listings.push(listing);
        dealer.totalPrice += listing.price;
      });

      // Convert to competitors array
      const competitors: Competitor[] = Array.from(dealerMap.entries())
        .map(([name, data]) => ({
          name,
          distance: data.listings[0].dealer.distance,
          inventoryCount: data.listings.length,
          averagePrice: data.totalPrice / data.listings.length,
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10); // Top 10 closest competitors

      return {
        dealerCount: dealerMap.size,
        averageDistance: competitors.reduce((sum, c) => sum + c.distance, 0) / competitors.length || 0,
        topCompetitors: competitors,
        competitivePricing: 'at', // This would need more complex calculation
      };
    } catch (error) {
      console.error('Error getting competitors:', error);
      throw error;
    }
  }
}