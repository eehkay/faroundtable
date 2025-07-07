# Analytics Feature Implementation Plan

## Executive Summary

### Overview
The Analytics feature will transform Round Table from an inventory management platform into a comprehensive market intelligence system. By integrating Market Check and DataForSEO APIs, dealerships will gain real-time insights into vehicle pricing, regional trends, and competitive positioning.

### Business Value
- **Data-Driven Pricing**: Make informed pricing decisions based on real market data
- **Inventory Optimization**: Identify high-demand vehicles and market gaps
- **Competitive Intelligence**: Understand regional competition and market positioning
- **Transfer Intelligence**: Optimize inter-store transfers based on regional demand

### Technical Approach
- Migrate to Vercel for superior performance and longer function execution times
- Implement edge functions for low-latency API responses
- Use intelligent caching to minimize API costs
- Create intuitive visualizations for complex market data

## Vercel Migration Plan

### Why Vercel?
1. **Function Duration**: 60s (Hobby) / 300s (Pro) vs Netlify's 10s/26s
2. **Edge Functions**: Faster response times for API calls
3. **Native Next.js Support**: Built by the Next.js team
4. **Superior Caching**: Built-in Data Cache and Full Route Cache
5. **Native Cron Jobs**: Replace Netlify scheduled functions

### Migration Steps

#### 1. Create Vercel Configuration
```json
{
  "framework": "nextjs",
  "buildCommand": "cd dealership-trading && npm run build",
  "outputDirectory": "dealership-trading/.next",
  "installCommand": "cd dealership-trading && npm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/analytics/**.ts": {
      "maxDuration": 300
    }
  },
  "crons": [{
    "path": "/api/cron/import-inventory",
    "schedule": "0 2 * * *"
  }]
}
```

#### 2. Convert Scheduled Functions
- Move `netlify/functions/scheduled-import.ts` → `/app/api/cron/import-inventory/route.ts`
- Update to use Vercel cron syntax
- Implement proper authentication for cron endpoints

#### 3. Environment Variables
All existing variables remain the same, plus:
```bash
# Analytics APIs
MARKETCHECK_API_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Caching Configuration
ANALYTICS_CACHE_TTL_HOURS=24
ANALYTICS_RATE_LIMIT_PER_HOUR=100

# Feature Flags
ENABLE_ADVANCED_ANALYTICS=true
```

## Analytics Feature Architecture

### System Design
```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Next.js Frontend  │────▶│  Analytics API      │────▶│  External APIs      │
│   (React + Charts)  │     │  (Edge Functions)   │     │  (Market Check,     │
└─────────────────────┘     └─────────────────────┘     │   DataForSEO)       │
         │                           │                   └─────────────────────┘
         ▼                           ▼                            │
┌─────────────────────┐     ┌─────────────────────┐              │
│  Real-time Updates  │     │  Analytics Cache    │◀─────────────┘
│  (Supabase)         │     │  (Supabase)         │
└─────────────────────┘     └─────────────────────┘
```

### API Integration Architecture

#### Market Check Integration
- **Primary Endpoints**:
  - `/v2/search` - Vehicle inventory search
  - `/v2/search?vin={vin}` - VIN-specific lookup
  - `/v2/stats/car_models` - Regional popularity
  - `/v2/dealers` - Competitor analysis
- **Rate Limits**: 1000 requests/hour
- **Caching Strategy**: 24-hour TTL for inventory data

#### DataForSEO Integration
- **Primary Endpoints**:
  - `/v3/keywords_data/google/search_volume/live` - Search demand
  - `/v3/dataforseo_labs/google/keyword_suggestions/live` - Related keywords
  - `/v3/serp/google/organic/live/advanced` - Local competition
- **Rate Limits**: 2000 requests/day
- **Caching Strategy**: 12-hour TTL for search trends

### Database Schema

```sql
-- Analytics cache table
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'vehicle_analysis', 
    'regional_trends', 
    'market_position',
    'competitor_analysis'
  )),
  api_source TEXT NOT NULL CHECK (api_source IN (
    'marketcheck', 
    'dataforseo', 
    'combined'
  )),
  request_params JSONB NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  hit_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
CREATE INDEX idx_analytics_cache_type ON analytics_cache(data_type);

-- Usage tracking for monitoring and billing
CREATE TABLE analytics_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  location_id UUID REFERENCES dealership_locations(id),
  endpoint TEXT NOT NULL,
  api_calls JSONB DEFAULT '{}', -- {"marketcheck": 5, "dataforseo": 3}
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved reports for quick access
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'vehicle_analysis',
    'market_overview',
    'regional_insights',
    'custom'
  )),
  parameters JSONB NOT NULL,
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron TEXT,
  last_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences for analytics
CREATE TABLE analytics_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  default_radius INTEGER DEFAULT 50, -- miles
  preferred_charts JSONB DEFAULT '["bar", "line", "pie"]',
  email_reports BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Phases

### Phase 1: Navigation & Route Structure (Week 1)

#### Update Navigation Component
Location: `/components/Navigation.tsx`
```typescript
// Add to navItems array after 'Transfers'
{
  href: '/analytics',
  label: 'Analytics',
  icon: BarChart3,
  show: true // Available to all authenticated users
}
```

#### Create Route Structure
```
/app/(authenticated)/analytics/
├── layout.tsx              # Sub-navigation and shared layout
├── page.tsx               # Overview dashboard
├── vehicles/
│   ├── page.tsx           # Vehicle market analysis
│   └── [vin]/page.tsx     # Specific vehicle analysis
├── regional/
│   ├── page.tsx           # Regional market insights
│   └── [locationId]/page.tsx # Location-specific insights
├── reports/
│   ├── page.tsx           # Reports list and creation
│   └── [reportId]/page.tsx # Specific report view
├── loading.tsx            # Shared loading state
└── error.tsx              # Error boundary
```

### Phase 2: Database Setup (Week 1)

1. Create migration file: `/supabase/migrations/[timestamp]_add_analytics_tables.sql`
2. Run migration against Supabase
3. Update TypeScript types in `/types/analytics.ts`
4. Create Supabase client queries in `/lib/queries/analytics.ts`

### Phase 3: API Integration Layer (Week 2)

#### Directory Structure
```
/lib/analytics/
├── clients/
│   ├── marketcheck.ts     # Market Check API client
│   └── dataforseo.ts      # DataForSEO API client
├── cache-manager.ts       # Caching logic
├── rate-limiter.ts        # API rate limiting
├── aggregator.ts          # Combine data from multiple sources
├── types.ts               # TypeScript definitions
└── constants.ts           # API endpoints, limits, etc.
```

#### Market Check Client Example
```typescript
// /lib/analytics/clients/marketcheck.ts
export class MarketCheckClient {
  private apiKey: string;
  private baseUrl = 'https://mc-api.marketcheck.com/v2';
  
  async searchVehicles(params: VehicleSearchParams): Promise<MarketCheckResponse> {
    // Implementation with caching and rate limiting
  }
  
  async getVehicleByVIN(vin: string): Promise<VehicleDetails> {
    // VIN-specific lookup with validation
  }
  
  async getRegionalStats(location: Location, radius: number): Promise<RegionalStats> {
    // Regional popularity and pricing data
  }
}
```

### Phase 4: Core API Routes (Week 2)

#### Vehicle Analysis Endpoint
`/app/api/analytics/vehicle/route.ts`
```typescript
export const runtime = 'edge'; // Use Vercel Edge Runtime

export async function POST(request: Request) {
  // 1. Validate session and permissions
  // 2. Parse request body (VIN/make/model, location, radius)
  // 3. Check cache for existing data
  // 4. If cache miss:
  //    - Call Market Check for inventory/pricing
  //    - Call DataForSEO for search trends
  //    - Combine and analyze data
  // 5. Store in cache with TTL
  // 6. Log usage for monitoring
  // 7. Return comprehensive analysis
}
```

#### Regional Insights Endpoint
`/app/api/analytics/regional/route.ts`
```typescript
export async function GET(request: Request) {
  // 1. Extract location from query params
  // 2. Fetch popular vehicles in region
  // 3. Get search trends for top models
  // 4. Analyze competitor density
  // 5. Calculate market opportunities
  // 6. Return insights with visualizations data
}
```

### Phase 5: UI Components (Week 3)

#### Component Hierarchy
```
/components/analytics/
├── dashboard/
│   ├── OverviewGrid.tsx        # Key metrics cards
│   ├── TrendChart.tsx          # Time series visualization
│   └── QuickInsights.tsx       # AI-generated insights
├── vehicles/
│   ├── VehicleSearchForm.tsx   # Advanced search interface
│   ├── VehicleAnalysisCard.tsx # Detailed analysis display
│   ├── PricingComparison.tsx   # Market vs internal pricing
│   └── DemandIndicator.tsx     # Search volume visualization
├── regional/
│   ├── RegionSelector.tsx      # Map or dropdown selection
│   ├── PopularModels.tsx       # Top vehicles by region
│   ├── CompetitorMap.tsx       # Dealer density visualization
│   └── MarketOpportunities.tsx # Gap analysis
├── shared/
│   ├── AnalyticsCard.tsx       # Consistent card wrapper
│   ├── MetricDisplay.tsx       # Formatted numbers/trends
│   ├── LoadingSkeleton.tsx     # Smooth loading states
│   └── ErrorBoundary.tsx       # Graceful error handling
└── charts/
    ├── BarChart.tsx            # Wrapped Chart.js bar
    ├── LineChart.tsx           # Time series chart
    ├── PieChart.tsx            # Distribution chart
    └── HeatMap.tsx             # Geographic visualization
```

### Phase 6: Vehicle Detail Integration (Week 4)

1. Update `/components/vehicle/VehicleDetail.tsx`:
   - Add "Market Analysis" tab
   - Create `MarketAnalysisSection.tsx` component
   - Show inline pricing comparison
   - Display regional demand

2. Add quick actions:
   - "Analyze Market" button
   - "View Competition" link
   - "Export Analysis" option

### Phase 7: Performance Optimization (Week 4)

#### Caching Strategy
1. **API Response Caching**:
   - Use Vercel Data Cache with revalidation
   - Implement stale-while-revalidate pattern
   - Cache popular queries at edge

2. **Database Query Optimization**:
   - Create materialized views for common aggregations
   - Index frequently queried fields
   - Implement query result caching

3. **Frontend Optimization**:
   - Lazy load chart libraries
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists

### Phase 8: Integration Points (Week 5)

#### Dashboard Widget
```typescript
// /components/dashboard/AnalyticsWidget.tsx
export function AnalyticsWidget() {
  // Display key metrics
  // Link to full analytics
  // Show trending insights
}
```

#### Transfer Enhancement
```typescript
// /components/transfers/MarketDemandIndicator.tsx
export function MarketDemandIndicator({ vehicle, fromLocation, toLocation }) {
  // Show demand comparison between locations
  // Display pricing differences
  // Recommend optimal transfer decision
}
```

### Phase 9: Deployment Configuration (Week 5)

#### Vercel Project Settings
```yaml
Framework Preset: Next.js
Node Version: 20.x
Environment: Production
Build Command: cd dealership-trading && npm run build
Output Directory: dealership-trading/.next
Install Command: cd dealership-trading && npm install
Root Directory: ./

Functions:
  Region: US East (iad1)
  Max Duration: 300s (Pro plan)
  
Environment Variables:
  - All existing variables
  - Analytics API keys
  - Feature flags
```

#### Monitoring Setup
1. Enable Vercel Analytics
2. Configure Sentry error tracking
3. Set up custom alerts for:
   - API rate limit warnings
   - Cache miss rates > 50%
   - Response times > 3s
   - Failed API calls

### Phase 10: Testing & Launch (Week 6)

#### Testing Plan
1. **Unit Tests**:
   - API client functions
   - Data aggregation logic
   - Cache management

2. **Integration Tests**:
   - API endpoint responses
   - External API mocking
   - Database operations

3. **E2E Tests**:
   - User flows
   - Chart rendering
   - Export functionality

4. **Performance Tests**:
   - Load testing with k6
   - API response times
   - Cache effectiveness

## Technical Specifications

### API Endpoints

#### POST /api/analytics/vehicle
**Request**:
```json
{
  "vin": "optional",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "location": {
    "lat": 33.1234,
    "lng": -117.1234
  },
  "radius": 50
}
```

**Response**:
```json
{
  "marketData": {
    "averagePrice": 28500,
    "priceRange": { "min": 25000, "max": 32000 },
    "inventoryCount": 145,
    "averageDaysOnLot": 45
  },
  "demandData": {
    "monthlySearchVolume": 12500,
    "trendDirection": "increasing",
    "relatedKeywords": ["toyota camry 2023", "camry hybrid"],
    "seasonality": { "peak": "March-May", "low": "November-January" }
  },
  "competitiveAnalysis": {
    "dealerCount": 23,
    "averageDistance": 12.5,
    "topCompetitors": [...]
  },
  "recommendations": {
    "pricing": "Your price is 5% below market average",
    "demand": "High demand in your region",
    "action": "Consider raising price by $1,000-$1,500"
  }
}
```

#### GET /api/analytics/regional?locationId={id}
**Response**:
```json
{
  "location": { "name": "Forman Ford", "id": "..." },
  "marketOverview": {
    "totalInventoryValue": 4500000,
    "uniqueModels": 45,
    "averageTurnover": 32
  },
  "popularVehicles": [
    {
      "make": "Ford",
      "model": "F-150",
      "averagePrice": 45000,
      "searchVolume": 8500,
      "inventoryCount": 23
    }
  ],
  "trends": {
    "risingModels": [...],
    "decliningModels": [...],
    "seasonalPatterns": {...}
  }
}
```

### Data Models

```typescript
// /types/analytics.ts

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
  priceHistory: PricePoint[];
}

export interface DemandData {
  monthlySearchVolume: number;
  yearOverYearGrowth: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  relatedKeywords: Keyword[];
  seasonality: SeasonalPattern;
}

export interface RegionalInsights {
  location: DealershipLocation;
  marketOverview: MarketOverview;
  popularVehicles: PopularVehicle[];
  trends: MarketTrends;
  opportunities: MarketOpportunity[];
}
```

### Caching Strategy

#### Cache Layers
1. **Vercel Edge Cache** (CDN):
   - Static assets
   - Public API responses
   - 1-hour TTL

2. **Vercel Data Cache** (Server):
   - Dynamic API responses
   - User-specific data
   - 5-minute to 24-hour TTL

3. **Supabase Cache Table**:
   - Expensive API responses
   - Historical data
   - 24-hour to 7-day TTL

#### Cache Key Generation
```typescript
function generateCacheKey(params: AnalyticsParams): string {
  const normalized = {
    ...params,
    location: params.location ? 
      `${Math.round(params.location.lat * 100)}_${Math.round(params.location.lng * 100)}` : 
      'none'
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}
```

## UI/UX Design

### Navigation Updates
1. Add "Analytics" to main navigation between "Transfers" and "Admin"
2. Create sub-navigation within analytics section:
   ```
   Overview | Vehicles | Regional | Reports
   ```

### Design Principles
- Follow existing dark theme (#000000 backgrounds, #3b82f6 accents)
- Maintain 1px borders (#2a2a2a) on all cards
- Use smooth transitions (200ms ease)
- Implement skeleton loaders for all async content
- Ensure mobile responsiveness

### User Flows

#### Vehicle Analysis Flow
1. User navigates to Analytics → Vehicles
2. Enters VIN or selects make/model/year
3. Specifies location and search radius
4. System displays loading skeleton
5. Results show in organized cards:
   - Market pricing comparison
   - Demand indicators
   - Competitive landscape
   - Actionable recommendations

#### Regional Insights Flow
1. User selects Analytics → Regional
2. Chooses dealership location or custom region
3. System loads regional market data
4. Display includes:
   - Market overview metrics
   - Popular vehicles grid
   - Trend visualizations
   - Opportunity identification

## Integration Points

### Vehicle Details Enhancement
```typescript
// Add to vehicle detail page
<Tabs>
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
    <TabsTrigger value="market">Market Analysis</TabsTrigger> {/* NEW */}
  </TabsList>
  <TabsContent value="market">
    <MarketAnalysisSection vehicleId={vehicle.id} />
  </TabsContent>
</Tabs>
```

### Dashboard Widget
```typescript
// Add to main dashboard
<DashboardGrid>
  <InventoryStats />
  <TransferActivity />
  <AnalyticsHighlights /> {/* NEW */}
</DashboardGrid>
```

### Transfer Decision Support
```typescript
// Add to transfer request modal
<TransferRequestModal>
  <VehicleDetails />
  <MarketDemandComparison 
    fromLocation={fromLocation}
    toLocation={toLocation}
    vehicle={vehicle}
  /> {/* NEW */}
  <TransferForm />
</TransferRequestModal>
```

## Deployment & Operations

### Pre-deployment Checklist
- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied to production
- [ ] API keys tested and rate limits confirmed
- [ ] Caching strategy implemented and tested
- [ ] Error tracking configured (Sentry)
- [ ] Analytics enabled (Vercel Analytics)
- [ ] Performance benchmarks met (<3s response time)
- [ ] Security review completed
- [ ] Documentation updated

### Monitoring & Alerts

#### Key Metrics to Monitor
1. **API Performance**:
   - Response times (p50, p95, p99)
   - Error rates by endpoint
   - Cache hit rates

2. **External API Usage**:
   - Requests per hour/day
   - Rate limit proximity
   - Cost tracking

3. **User Engagement**:
   - Feature adoption rate
   - Most viewed analytics
   - Export frequency

#### Alert Thresholds
- API response time > 3 seconds
- Error rate > 5%
- Cache hit rate < 60%
- External API quota > 80%
- Database query time > 1 second

### Error Handling

#### Client-Side
```typescript
// Graceful degradation with cached data
if (error && cachedData) {
  return (
    <Alert>
      <AlertDescription>
        Showing cached data from {formatDate(cachedData.timestamp)}
      </AlertDescription>
    </Alert>
  );
}
```

#### Server-Side
```typescript
// Fallback to alternative data sources
try {
  data = await marketCheckClient.search(params);
} catch (error) {
  logger.error('MarketCheck API failed', error);
  data = await getHistoricalAverage(params);
}
```

## Success Metrics

### Technical KPIs
- **Response Time**: <2s for cached, <5s for fresh data
- **Uptime**: 99.9% availability
- **Cache Hit Rate**: >70% for popular queries
- **Error Rate**: <1% for all endpoints

### Business KPIs
- **User Adoption**: 80% of users access analytics weekly
- **Decision Impact**: 15% improvement in pricing accuracy
- **Transfer Optimization**: 20% reduction in slow-moving inventory
- **Time Savings**: 2 hours/week per manager on market research

### User Satisfaction
- **Feature NPS**: >40
- **Support Tickets**: <5 per month
- **Feature Requests**: Continuous improvement based on feedback

## Future Enhancements

### Phase 2 Features (Q2 2025)
1. **Predictive Analytics**:
   - ML-based demand forecasting
   - Optimal pricing recommendations
   - Transfer success predictions

2. **Automated Insights**:
   - Daily market alerts
   - Anomaly detection
   - Opportunity notifications

3. **Advanced Visualizations**:
   - Interactive 3D market maps
   - Animated trend visualizations
   - Custom dashboard builder

### Phase 3 Features (Q3 2025)
1. **API Marketplace**:
   - Additional data providers
   - Custom integrations
   - White-label analytics

2. **Mobile App**:
   - Native iOS/Android apps
   - Push notifications
   - Offline analytics

3. **AI Assistant**:
   - Natural language queries
   - Automated report generation
   - Predictive recommendations

## Conclusion

This analytics feature will position Round Table as a comprehensive market intelligence platform, providing dealerships with the data-driven insights needed to optimize inventory, pricing, and transfer decisions. The migration to Vercel ensures the performance and scalability required for complex analytics workloads, while the intuitive UI makes advanced market analysis accessible to all users.

By following this implementation plan, we can deliver a robust analytics solution that drives real business value while maintaining the high standards of user experience and technical excellence that Round Table users expect.