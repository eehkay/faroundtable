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

export interface PricePredictionRequest {
  vin: string;
  miles?: number;
  zip?: string;
  car_type?: 'used' | 'new';
  base_exterior_color?: string;
  base_interior_color?: string;
}

export interface PricePredictionResponse {
  predicted_price: number;
  confidence: number;
  price_range: {
    low: number;
    high: number;
  };
  market_data?: {
    average_price: number;
    listings_count: number;
  };
}

export interface MarketDaySupplyRequest {
  vin: string;
  latitude: number;
  longitude: number;
  radius?: number;
  exact?: boolean;
  debug?: boolean;
}

export interface MarketDaySupplyResponse {
  mds: number;
  inventory_count: number;
  sales_count: number;
  sales_period_days: number;
  market_radius: number;
  similar_vehicles?: {
    make: string;
    model: string;
    year: number;
    count: number;
  }[];
}

export interface CitywiseSalesRequest {
  ymmt?: string; // year|make|model|trim format
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  city_state: string; // format: city|STATE
}

export interface CitywiseSalesResponse {
  count: number;
  cpo: number;
  non_cpo: number;
  inventory_type: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  state: string;
  city: string;
  dom_stats: {
    geometric_mean: number;
    min: number;
    median: number;
    population_standard_deviation: number;
    variance: number;
    max: number;
    mean: number;
    trimmed_mean: number;
    standard_deviation: number;
    iqr: number;
  };
  price_stats: {
    geometric_mean: number;
    min: number;
    median: number;
    population_standard_deviation: number;
    variance: number;
    max: number;
    mean: number;
    trimmed_mean: number;
    standard_deviation: number;
    iqr: number;
  };
  miles_stats: {
    geometric_mean: number;
    min: number;
    median: number;
    population_standard_deviation: number;
    variance: number;
    max: number;
    mean: number;
    trimmed_mean: number;
    standard_deviation: number;
    iqr: number;
  };
  // Legacy properties for backward compatibility
  sales_count?: number;
  average_price?: number;
  average_miles?: number;
  average_dom?: number;
  top_colors?: string[];
  sales_trend?: 'increasing' | 'stable' | 'decreasing';
}

export interface SimilarVehiclesRequest {
  vin: string;
  latitude: number;
  longitude: number;
  radius?: number;
  rows?: number;
}

export interface SimilarVehiclesResponse {
  listings: Array<{
    id: string;
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    price: number;
    miles: number;
    distance: number;
    dealer: {
      name: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      phone?: string;
    };
    exterior_color?: string;
    interior_color?: string;
    dom: number;
    media?: {
      photo_links: string[];
    };
  }>;
  stats?: {
    mean: number;
    median: number;
    min: number;
    max: number;
    count: number;
  };
}

export interface VinDecodeRequest {
  vin: string;
}

export interface PopularCar {
  country: string;
  city?: string;
  count: number;
  make: string;
  model: string;
  price_stats: {
    median: number;
    mean: number;
    min: number;
    max: number;
    iqr: number;
  };
  miles_stats: {
    median: number;
    mean: number;
    min: number;
    max: number;
  };
  dom_stats: {
    median: number;
    mean: number;
    min: number;
    max: number;
    iqr?: number;
  };
  cpo_price_stats?: {
    median: number;
    mean: number;
    listings_count: number;
  };
  cpo_miles_stats?: {
    median: number;
    mean: number;
  };
  cpo_dom_stats?: {
    median: number;
    mean: number;
  };
}

export type PopularCarsResponse = PopularCar[];

export interface VinDecodeResponse {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  body_type?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  vehicle_type?: string;
  series?: string;
  style?: string;
  // MarketCheck may return additional fields
  [key: string]: any;
}

export interface VinDecodeResult {
  success: boolean;
  data?: VinDecodeResponse;
  error?: string;
}

export class MarketCheckClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  // VIN decoder cache to avoid repeated API calls
  private vinDecodeCache: Map<string, VinDecodeResult> = new Map();

  constructor(config: MarketCheckConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://mc-api.marketcheck.com/v2';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Decode VIN using MarketCheck API to get standardized vehicle information
   */
  async decodeVin(vin: string): Promise<VinDecodeResult> {
    // Check cache first
    if (this.vinDecodeCache.has(vin)) {
      const cached = this.vinDecodeCache.get(vin)!;
      return cached;
    }

    try {
      const response = await this.request<VinDecodeResponse>(`/decode/car/${vin}/specs`);

      const result: VinDecodeResult = {
        success: true,
        data: response
      };

      // Cache the result
      this.vinDecodeCache.set(vin, result);
      return result;
    } catch (error) {
      const result: VinDecodeResult = {
        success: false,
        error: error instanceof Error ? error.message : 'VIN decode failed'
      };
      
      // Cache failed results for a short time to avoid repeated failures
      this.vinDecodeCache.set(vin, result);
      return result;
    }
  }

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // MarketCheck API expects api_key as a query parameter, not a header
    const allParams = {
      api_key: this.apiKey,
      ...params
    };
    
    Object.entries(allParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log('[MarketCheck] Request URL:', url.toString());
      console.log('[MarketCheck] Request params:', allParams);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails = '';
        try {
          const errorBody = await response.text();
          errorDetails = errorBody ? ` - Details: ${errorBody}` : '';
        } catch {
          // Ignore errors reading response body
        }
        
        const errorMessage = `MarketCheck API error: ${response.status} ${response.statusText}${errorDetails}`;
        console.error('[MarketCheck] Error:', errorMessage);
        console.error('[MarketCheck] Failed endpoint:', endpoint);
        console.error('[MarketCheck] Failed URL:', url.toString());
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[MarketCheck] Request timeout for:', url.toString());
        throw new Error('MarketCheck API request timeout');
      }
      
      console.error('[MarketCheck] Request failed:', error);
      throw error;
    }
  }

  async searchVehicles(params: VehicleAnalysisRequest): Promise<MarketCheckSearchResponse> {
    const searchParams: Record<string, any> = {
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
      throw error;
    }
  }

  /**
   * Get price prediction for a vehicle
   * Uses the /v2/predict/car/price endpoint
   */
  async getPricePrediction(params: PricePredictionRequest): Promise<PricePredictionResponse> {
    try {
      return await this.request<PricePredictionResponse>('/predict/car/price', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Market Day Supply (MDS) for a vehicle
   * Uses the /v2/mds/car endpoint
   */
  async getMarketDaySupply(params: MarketDaySupplyRequest): Promise<MarketDaySupplyResponse> {
    try {
      return await this.request<MarketDaySupplyResponse>('/mds/car', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get citywise sales statistics
   * Uses the /v2/sales/car endpoint
   */
  async getCitywiseSales(params: CitywiseSalesRequest & { vin?: string }): Promise<CitywiseSalesResponse> {
    try {
      let ymmt = params.ymmt;
      let vinDecodeResult: VinDecodeResult | null = null;
      let dataSource = 'provided'; // Track data source for debugging

      // Priority 1: Use provided YMMT if available
      if (ymmt) {
        dataSource = 'provided';
      }
      // Priority 2: If we have a VIN, ALWAYS try to decode it first for accurate YMMT
      else if (params.vin) {
        vinDecodeResult = await this.decodeVin(params.vin);
        
        if (vinDecodeResult.success && vinDecodeResult.data) {
          const decoded = vinDecodeResult.data;
          ymmt = `${decoded.year}|${decoded.make.toLowerCase()}|${decoded.model.toLowerCase()}`;
          if (decoded.trim) {
            ymmt += `|${decoded.trim.toLowerCase()}`;
          }
          dataSource = 'vin-decode';
        } else {
          // VIN decode failed, fall through to database values
        }
      }

      // Priority 3: Fallback to database values if VIN decode failed or no VIN provided
      if (!ymmt && params.year && params.make && params.model) {
        ymmt = `${params.year}|${params.make.toLowerCase()}|${params.model.toLowerCase()}`;
        if (params.trim) {
          ymmt += `|${params.trim.toLowerCase()}`;
        }
        dataSource = 'database-fallback';
      }

      const requestParams = {
        ymmt,
        city_state: params.city_state
      };

      return await this.request<CitywiseSalesResponse>('/sales/car', requestParams);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search inventory with enhanced filtering
   * Uses the /inventory/search endpoint for more detailed inventory data
   */
  async searchInventory(params: {
    vin?: string;
    make?: string;
    model?: string;
    year?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
    price_min?: number;
    price_max?: number;
    miles_min?: number;
    miles_max?: number;
    rows?: number;
  }): Promise<MarketCheckSearchResponse> {
    try {
      return await this.request<MarketCheckSearchResponse>('/inventory/search', {
        car_type: 'used',
        ...params
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get dealer information
   * Uses the /dealers/search endpoint
   */
  async searchDealers(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    dealer_type?: string;
  }): Promise<{
    dealers: Array<{
      id: string;
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      latitude: number;
      longitude: number;
      distance: number;
      inventory_count?: number;
    }>;
    total_count: number;
  }> {
    try {
      return await this.request('/dealers/search', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get market trends for a specific make/model
   * Uses the /trends endpoint
   */
  async getTrends(params: {
    make: string;
    model: string;
    year?: number;
    city_state?: string;
    period?: 'monthly' | 'weekly' | 'daily';
  }): Promise<{
    trends: Array<{
      period: string;
      average_price: number;
      listing_count: number;
      average_miles: number;
      average_dom: number;
    }>;
    summary: {
      price_trend: 'increasing' | 'stable' | 'decreasing';
      inventory_trend: 'increasing' | 'stable' | 'decreasing';
      demand_level: 'high' | 'medium' | 'low';
    };
  }> {
    try {
      return await this.request('/trends', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get price history for a specific VIN
   * Uses the /history endpoint
   */
  async getHistory(vin: string): Promise<{
    history: Array<{
      date: string;
      price: number;
      miles: number;
      dealer: string;
      city: string;
      state: string;
    }>;
    price_changes: number;
    total_days_listed: number;
  }> {
    try {
      return await this.request('/history', {
        vin,
        car_type: 'used'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for similar vehicles in a radius
   * Uses the /search/car/active endpoint
   */
  async searchSimilarVehicles(params: SimilarVehiclesRequest): Promise<SimilarVehiclesResponse> {
    try {
      const response = await this.request<any>('/search/car/active', {
        car_type: 'used',
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius || 100,
        vins: params.vin,
        start: 0,
        rows: params.rows || 50,
        sort_by: 'dist',
        sort_order: 'desc',
        include_relevant_links: true
      });

      // Transform the response to our format
      return {
        listings: response.listings?.map((listing: any) => ({
          id: listing.id,
          vin: listing.vin,
          year: listing.build.year,
          make: listing.build.make,
          model: listing.build.model,
          trim: listing.build.trim,
          price: listing.price,
          miles: listing.miles,
          distance: listing.dist,
          dealer: {
            name: listing.dealer.name,
            address: listing.dealer.street,
            city: listing.dealer.city,
            state: listing.dealer.state,
            zip: listing.dealer.zip,
            phone: listing.dealer.phone
          },
          exterior_color: listing.exterior_color,
          interior_color: listing.interior_color,
          dom: listing.dom,
          media: listing.media,
          vdp_url: listing.vdp_url || listing.source_url || listing.url
        })) || [],
        stats: response.stats
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get popular cars in a specific city with complete statistics
   * This endpoint provides inventory counts, price stats, mileage stats, and DOM stats
   */
  async getPopularCarsByCity(params: {
    city: string;
    state: string;
    limit?: number;
    carType?: 'used' | 'new' | 'both';
  }): Promise<PopularCarsResponse> {
    try {
      const response = await this.request<PopularCarsResponse>('/popular/cars', {
        city_state: `${params.city}|${params.state}`,
        car_type: params.carType || 'used',
        limit: params.limit || 50
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get popular cars nationally (without city/state filter)
   * Returns the most popular cars across the entire country
   */
  async getPopularCarsNational(params: {
    limit?: number;
    carType?: 'used' | 'new' | 'both';
  } = {}): Promise<PopularCarsResponse> {
    try {
      const response = await this.request<PopularCarsResponse>('/popular/cars', {
        car_type: params.carType || 'used',
        limit: params.limit || 50
      });

      return response;
    } catch (error) {
      throw error;
    }
  }
}