# Dealership Analytics Feature - Development Brief

## Project Overview
Add market intelligence capabilities to the existing **Round Table** dealership inventory management platform. This feature will integrate Market Check and DataForSEO APIs to provide on-demand analytics for vehicle pricing, regional trends, and competitive intelligence.

## Integration Requirements

### Existing Platform Context
- **Tech Stack**: Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS
- **Design System**: True black backgrounds (#000000-#0a0a0a), bright blue accents (#3b82f6), 1px borders (#2a2a2a)
- **Authentication**: NextAuth.js with Google SSO (already configured)
- **Database**: Supabase PostgreSQL with existing dealership/vehicle schema

### Navigation Integration
Add new "Analytics" section to existing primary navigation:
```
[Dashboard] [Inventory] [Transfers] [Analytics] [Users/Admin]
```

Analytics sub-navigation:
- Market Overview (dashboard)
- Vehicle Intelligence 
- Regional Insights
- Reports & Exports

## Core Features to Build

### 1. Vehicle Analysis
**Trigger**: User searches VIN/make/model + location
**APIs**: Market Check vehicle search + DataForSEO search volume
**Display**: Pricing data, inventory levels, search demand, competitive analysis

### 2. Regional Market Intelligence  
**Trigger**: User selects region from dropdown
**APIs**: Market Check popular cars + DataForSEO regional keywords
**Display**: Top selling vehicles, search trends, dealer density

### 3. Enhanced Vehicle Details
**Integration**: Add analytics section to existing vehicle detail pages
**Trigger**: "Analyze Market" button on vehicle cards
**Display**: Market positioning, demand forecast, pricing recommendations

## API Endpoints to Create

### Core Analytics Routes
```
/app/api/analytics/
├── vehicle/analyze/route.ts     -- Single vehicle market analysis
├── regional/trends/route.ts     -- Regional market intelligence  
└── reports/generate/route.ts    -- Combined analysis reports
```

### Market Check API Integration
```javascript
// Primary endpoints to use:
GET /v2/search                    // Vehicle inventory search
GET /v2/search?vin={vin}         // VIN-specific lookup
GET /v2/listing/{id}             // Detailed listing info
GET /v2/stats/car_models         // Regional popularity
GET /v2/dealers                  // Competitor analysis
```

### DataForSEO API Integration
```javascript
// Primary endpoints to use:
POST /v3/keywords_data/google/search_volume/live           // Search demand
POST /v3/dataforseo_labs/google/keyword_suggestions/live   // Related keywords  
POST /v3/keywords_data/google/search_volume_history/live   // Trends over time
POST /v3/serp/google/organic/live/advanced                 // Local competition
```

## Database Extensions

### New Tables
```sql
-- Simple caching to avoid duplicate API calls
analytics_cache (
  id uuid primary key,
  cache_key text unique,        -- hash of request parameters
  data_type text,               -- 'vehicle_analysis' | 'regional_trends' 
  response_data jsonb,
  created_at timestamp,
  expires_at timestamp          -- 24 hour TTL
);

-- Optional: Track usage for monitoring
analytics_requests (
  id uuid primary key,
  user_id uuid references users(id),
  request_type text,
  vehicle_vin text,
  location text,
  created_at timestamp
);
```

## UI Components to Build

### Primary Components
```
/components/analytics/
├── AnalyticsDashboard.tsx       -- Main analytics overview
├── VehicleSearch.tsx            -- Search form for vehicle analysis
├── VehicleAnalyticsCard.tsx     -- Results display for vehicle data
├── RegionalTrends.tsx           -- Regional market insights
├── MarketComparison.tsx         -- Competitive analysis display
└── AnalyticsLoadingState.tsx    -- Loading states for API calls
```

### Integration Components
```
/components/vehicles/
├── VehicleCard.tsx              -- Add "Analyze Market" button
└── VehicleDetail.tsx            -- Add analytics section/tab
```

## User Experience Flow

### Vehicle Analysis Flow
1. User enters VIN/make/model + location in search form
2. Loading state displays "Fetching market data..."
3. Results show:
   - Market pricing comparison
   - Local inventory levels  
   - Search volume trends
   - Competitive positioning

### Regional Analysis Flow
1. User selects region from dropdown (your 5 dealership locations)
2. System fetches popular vehicles + search trends for that region
3. Display regional preferences, seasonal trends, opportunity insights

### Enhanced Vehicle Detail Flow
1. On existing vehicle detail pages, add "Market Analytics" section
2. "Analyze Market" button triggers API calls for that specific vehicle
3. Display market positioning relative to inventory

## Technical Implementation Notes

### Caching Strategy
- Cache API responses for 24 hours using `analytics_cache` table
- Check cache first before making expensive API calls
- Use request parameter hash as cache key

### Error Handling
- Graceful degradation if APIs are unavailable
- Clear user messaging for API failures
- Fallback to cached data when possible

### Performance
- User-triggered analytics only (no auto-refresh)
- Batch API calls when possible (multiple keywords in single DataForSEO request)
- Loading states for better UX during API calls

### Permissions
- Leverage existing role system (admin/manager/sales)
- All authenticated users can access basic analytics
- Advanced features based on role if needed

## Environment Variables to Add
```bash
MARKETCHECK_API_KEY=your_marketcheck_key
DATAFORSEO_LOGIN=your_dataforseo_login  
DATAFORSEO_PASSWORD=your_dataforseo_password
```

## Success Metrics
- Vehicle analysis provides actionable pricing insights
- Regional trends help with inventory planning decisions
- Enhanced vehicle details improve transfer decision-making
- Fast user experience with smart caching

## Development Priority
1. **Phase 1**: Basic vehicle analysis (VIN lookup + search volume)
2. **Phase 2**: Regional market intelligence dashboard
3. **Phase 3**: Integration with existing vehicle detail pages
4. **Phase 4**: Advanced reporting and export features

Start with Phase 1 to validate the API integrations and user experience, then build incrementally from there.