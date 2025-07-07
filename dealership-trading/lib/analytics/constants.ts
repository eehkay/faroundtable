export const ANALYTICS_CONFIG = {
  // API Configuration
  MARKETCHECK_BASE_URL: 'https://mc-api.marketcheck.com/v2',
  DATAFORSEO_BASE_URL: 'https://api.dataforseo.com',
  
  // Cache Configuration
  DEFAULT_CACHE_TTL_HOURS: 24,
  VEHICLE_ANALYSIS_CACHE_TTL: 24, // hours
  REGIONAL_INSIGHTS_CACHE_TTL: 12, // hours
  
  // Rate Limiting
  MARKETCHECK_RATE_LIMIT: 1000, // requests per hour
  DATAFORSEO_RATE_LIMIT: 2000, // requests per day
  
  // Request Timeouts
  API_TIMEOUT_MS: 30000, // 30 seconds
  
  // Default Values
  DEFAULT_SEARCH_RADIUS: 50, // miles
  DEFAULT_LOCATION: {
    lat: 33.0,
    lng: -117.0,
  }, // San Diego area
  
  // Data Limits
  MAX_COMPETITORS: 10,
  MAX_RELATED_KEYWORDS: 10,
  MAX_POPULAR_VEHICLES: 10,
  MAX_OPPORTUNITIES: 5,
  
  // Thresholds
  HIGH_DEMAND_THRESHOLD: 10000, // monthly searches
  LOW_DEMAND_THRESHOLD: 1000, // monthly searches
  HIGH_DEMAND_SUPPLY_RATIO: 100,
  PRICE_TREND_THRESHOLD: 5, // percentage for significant change
  
  // Chart Configuration
  CHART_COLORS: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
  },
  
  // Error Messages
  ERRORS: {
    INVALID_LOCATION: 'Invalid location ID provided',
    API_ERROR: 'Error fetching data from external API',
    CACHE_ERROR: 'Error accessing cache',
    RATE_LIMIT: 'API rate limit exceeded',
    TIMEOUT: 'Request timeout',
    INVALID_VEHICLE: 'Invalid vehicle parameters',
  },
};

// Google Ads API Location Codes
// These are different from the Labs API codes and work with the Google Ads Keywords endpoint
export const GOOGLE_ADS_LOCATIONS = {
  // Country
  USA: 2840,
  
  // States
  NEVADA: 1022639,
  CALIFORNIA: 1014044,
  
  // Metro Areas
  LAS_VEGAS_METRO: 1022595,
  SAN_DIEGO_METRO: 1014073,
  LOS_ANGELES_METRO: 1013962,
  
  // Note: Smaller cities like Imperial Valley locations may need to use county or state codes
};

// Location presets for analytics
export const LOCATION_PRESETS = [
  { name: 'United States', code: 2840 },
  { name: 'Nevada', code: 1022639 },
  { name: 'California', code: 1014044 },
  { name: 'Las Vegas Metro', code: 1022595 },
  { name: 'San Diego Metro', code: 1014073 },
  { name: 'Los Angeles Metro', code: 1013962 },
];

// Popular vehicle makes and models for regional analysis
export const POPULAR_VEHICLES = {
  makes: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Jeep', 'Ram', 'GMC', 'Hyundai', 'Mazda'],
  models: {
    Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'],
    Honda: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey'],
    Ford: ['F-150', 'Explorer', 'Escape', 'Edge', 'Mustang'],
    Chevrolet: ['Silverado', 'Equinox', 'Tahoe', 'Malibu', 'Traverse'],
    Nissan: ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Frontier'],
    Jeep: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Gladiator'],
    Ram: ['1500', '2500', '3500', 'ProMaster'],
    GMC: ['Sierra', 'Terrain', 'Acadia', 'Yukon', 'Canyon'],
    Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade'],
    Mazda: ['CX-5', 'CX-30', 'Mazda3', 'CX-9', 'MX-5 Miata'],
  },
};

// Vehicle segments for analysis
export const VEHICLE_SEGMENTS = {
  'Compact Cars': ['Civic', 'Corolla', 'Elantra', 'Sentra', 'Mazda3'],
  'Midsize Cars': ['Camry', 'Accord', 'Altima', 'Malibu', 'Sonata'],
  'Compact SUVs': ['CR-V', 'RAV4', 'Rogue', 'Equinox', 'CX-5'],
  'Midsize SUVs': ['Highlander', 'Pilot', 'Explorer', 'Tahoe', 'Grand Cherokee'],
  'Pickup Trucks': ['F-150', 'Silverado', 'Ram 1500', 'Sierra', 'Tacoma'],
  'Minivans': ['Odyssey', 'Pacifica', 'Sienna', 'Carnival'],
};

// API endpoint patterns
export const API_ENDPOINTS = {
  MARKETCHECK: {
    SEARCH: '/search',
    STATS: '/stats',
    DEALERS: '/dealers',
    HISTORY: '/history/car',
  },
  DATAFORSEO: {
    SEARCH_VOLUME: '/v3/keywords_data/google/search_volume/live',
    KEYWORD_SUGGESTIONS: '/v3/dataforseo_labs/google/keyword_suggestions/live',
    SERP_ANALYSIS: '/v3/serp/google/organic/live/advanced',
  },
};