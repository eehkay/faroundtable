export interface VehicleAnalysisRequest {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  location?: {
    lat: number;
    lng: number;
  };
  locationId?: string;
  radius?: number;
}

export interface VehicleAnalysis {
  id: string;
  vehicle: {
    vin?: string;
    make: string;
    model: string;
    year: number;
  };
  marketData: MarketData;
  demandData: DemandData;
  competitiveAnalysis: CompetitiveAnalysis;
  recommendations: Recommendations;
  analyzedAt: Date;
  cacheExpiry: Date;
}

export interface MarketData {
  averagePrice: number;
  medianPrice: number;
  priceRange: PriceRange;
  inventoryCount: number;
  averageDaysOnLot: number;
  priceHistory?: PricePoint[];
  marketTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface PricePoint {
  date: string;
  price: number;
  count: number;
}

export interface DemandData {
  monthlySearchVolume: number;
  yearOverYearGrowth?: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  relatedKeywords: Keyword[];
  seasonality?: SeasonalPattern;
}

export interface Keyword {
  term: string;
  volume: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SeasonalPattern {
  peak: string;
  low: string;
  currentSeason: 'peak' | 'normal' | 'low';
}

export interface CompetitiveAnalysis {
  dealerCount: number;
  averageDistance: number;
  topCompetitors: Competitor[];
  marketShare?: number;
  competitivePricing: 'above' | 'at' | 'below';
}

export interface Competitor {
  name: string;
  distance: number;
  inventoryCount: number;
  averagePrice?: number;
}

export interface Recommendations {
  pricing?: string;
  demand?: string;
  action: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RegionalInsightsRequest {
  locationId: string;
  radius?: number;
  includeCompetitors?: boolean;
}

export interface RegionalInsights {
  location: {
    id: string;
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  marketOverview: MarketOverview;
  popularVehicles: PopularVehicle[];
  trends: MarketTrends;
  opportunities: MarketOpportunity[];
}

export interface MarketOverview {
  totalInventoryValue: number;
  uniqueModels: number;
  averageTurnover: number;
  marketGrowth?: number;
  competitorDensity: 'high' | 'medium' | 'low';
}

export interface PopularVehicle {
  make: string;
  model: string;
  averagePrice: number;
  searchVolume: number;
  inventoryCount: number;
  demandSupplyRatio: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface MarketTrends {
  risingModels: TrendingModel[];
  decliningModels: TrendingModel[];
  seasonalPatterns: Record<string, SeasonalPattern>;
  priceMovements: PriceMovement[];
}

export interface TrendingModel {
  make: string;
  model: string;
  changePercent: number;
  currentVolume: number;
}

export interface PriceMovement {
  segment: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  averagePrice: number;
}

export interface MarketOpportunity {
  type: 'high-demand' | 'low-supply' | 'price-gap' | 'emerging-trend';
  description: string;
  potential: 'high' | 'medium' | 'low';
  vehicles: string[];
  estimatedValue?: number;
}

// Cache types
export interface AnalyticsCacheEntry {
  id: string;
  cache_key: string;
  data_type: 'vehicle_analysis' | 'regional_trends' | 'market_position' | 'competitor_analysis';
  api_source: 'marketcheck' | 'dataforseo' | 'combined';
  request_params: Record<string, any>;
  response_data: any;
  created_at: string;
  expires_at: string;
  hit_count: number;
}

// Usage tracking types
export interface AnalyticsUsage {
  id: string;
  user_id: string;
  location_id?: string;
  endpoint: string;
  api_calls: Record<string, number>;
  response_time_ms?: number;
  cache_hit: boolean;
  created_at: string;
}

// Report types
export interface AnalyticsReport {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  report_type: 'vehicle_analysis' | 'market_overview' | 'regional_insights' | 'custom';
  parameters: Record<string, any>;
  is_scheduled: boolean;
  schedule_cron?: string;
  last_run?: string;
  created_at: string;
  updated_at: string;
}

// User preferences
export interface AnalyticsPreferences {
  user_id: string;
  default_radius: number;
  preferred_charts: string[];
  email_reports: boolean;
  created_at: string;
  updated_at: string;
}

// API response types
export interface AnalyticsApiResponse<T> {
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp: string;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}