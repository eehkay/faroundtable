# DataForSEO Endpoints for Vehicle Market Analysis

## Overview
This document outlines the specific DataForSEO API endpoints to implement for the Vehicle Market Analysis feature in Round Table.

## Core DataForSEO Endpoints

### 1. Search Volume Data (Primary)
**Endpoint**: `POST /v3/keywords_data/google/search_volume/live`

**Purpose**: Get current search demand for vehicle-related terms  
**Use Case**: "How many people are searching for this vehicle?"

**Example Request**:
```javascript
[{
  "keywords": [
    "2024 Toyota Camry",
    "Toyota Camry for sale", 
    "Toyota Camry Denver",
    "Toyota Camry price",
    "Toyota Camry dealer"
  ],
  "location_code": 2840, // Denver
  "language_code": "en"
}]
```

### 2. Search Volume History (Trends)
**Endpoint**: `POST /v3/keywords_data/google/search_volume_history/live`

**Purpose**: Seasonal patterns and trend analysis  
**Use Case**: "Is demand growing or declining? When do people search most?"

**Example Request**:
```javascript
[{
  "keywords": ["Toyota Camry"],
  "location_code": 2840,
  "language_code": "en"
}]
```

### 3. Keyword Suggestions (Market Intelligence)
**Endpoint**: `POST /v3/dataforseo_labs/google/keyword_suggestions/live`

**Purpose**: Related search terms and consumer intent  
**Use Case**: "What else are people looking for? Hybrid? Reliability?"

**Example Request**:
```javascript
[{
  "keyword": "Toyota Camry",
  "location_code": 2840,
  "language_code": "en", 
  "limit": 50
}]
```

### 4. Location Codes (Setup)
**Endpoint**: `GET /v3/keywords_data/google/locations`

**Purpose**: Get location codes for your dealership regions  
**Use Case**: Map your cities to DataForSEO location codes

## Implementation Priority

### Phase 1: Essential (Start Here)
1. **Search Volume Live** - Core demand data
2. **Location Codes** - Setup for your regions

### Phase 2: Enhanced Intelligence
3. **Search Volume History** - Trend analysis
4. **Keyword Suggestions** - Consumer intent insights

## API Integration Strategy

### Smart Keyword Generation
```javascript
const generateVehicleKeywords = (vehicle, location) => {
  const baseTerms = [
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    `${vehicle.make} ${vehicle.model} for sale`,
    `${vehicle.make} ${vehicle.model} ${location.city}`,
    `${vehicle.make} ${vehicle.model} price`,
    `${vehicle.make} ${vehicle.model} dealer`
  ];
  
  // Add location-specific terms
  const locationTerms = [
    `${vehicle.make} ${vehicle.model} ${location.city}`,
    `${vehicle.make} ${vehicle.model} dealer ${location.city}`
  ];
  
  return [...baseTerms, ...locationTerms];
};
```

### Batch Processing for Efficiency
```javascript
// Single API call for multiple locations
const getMultiLocationData = async (vehicle, locations) => {
  const keywords = generateVehicleKeywords(vehicle);
  
  // Batch request for all locations
  const requests = locations.map(location => ({
    keywords: keywords,
    location_code: location.dataforSEO_code,
    language_code: "en"
  }));
  
  return await dataForSEO.post('/v3/keywords_data/google/search_volume/live', requests);
};
```

## Data Processing for Vehicle Analysis

### Key Metrics to Extract
```javascript
const processSearchData = (dataForSEOResponse) => {
  return {
    totalSearches: calculateTotalVolume(response),
    trendDirection: analyzeTrend(response), 
    demandLevel: categorizeDemand(response),
    seasonalPeaks: identifyPeaks(response),
    relatedInterests: extractRelatedTerms(response),
    geographicDemand: compareLocations(response)
  };
};
```

### Intelligence Generation
```javascript
const generateDemandInsights = (searchData, marketData) => {
  const demandSupplyRatio = searchData.totalSearches / marketData.inventoryCount;
  
  return {
    opportunityScore: calculateOpportunity(demandSupplyRatio),
    marketTiming: assessTiming(searchData.trends),
    pricingPower: assessPricingPower(demandSupplyRatio),
    recommendations: generateRecommendations(searchData, marketData)
  };
};
```

## Cost Optimization

### Smart Caching Strategy
```javascript
const cacheStrategy = {
  searchVolume: '24 hours',    // Monthly volumes are stable
  trends: '7 days',            // Historical data changes slowly  
  suggestions: '30 days',      // Related terms rarely change
  locations: 'permanent'       // Location codes never change
};
```

### Efficient API Usage
- **Batch requests** for multiple locations
- **Cache aggressively** - search volumes don't change hourly
- **Prioritize core endpoints** - start with search volume only
- **Progressive enhancement** - add trends/suggestions later

## Expected API Response Processing

### Search Volume Response
```javascript
// Process search volume data
const processVolume = (response) => ({
  monthlySearches: response.search_volume,
  competitionLevel: response.competition,
  averageCPC: response.cpc,
  trendData: response.monthly_searches // 12 months of data
});
```

### Trend Analysis
```javascript
// Analyze seasonal patterns
const analyzeTrends = (monthlyData) => ({
  direction: calculateTrendDirection(monthlyData),
  seasonalPeaks: identifyPeakMonths(monthlyData),
  volatility: calculateVolatility(monthlyData)
});
```

## Authentication
All endpoints require basic authentication using your DataForSEO credentials:

```javascript
const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');

headers: {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json'
}
```

## Implementation Notes

### Location Code Mapping
First, run the locations endpoint to map your dealership cities:
```javascript
// Find your dealership location codes
const locations = await dataForSEO.get('/v3/keywords_data/google/locations');
const dealershipCodes = {
  'Denver, CO': 2840,
  'Phoenix, AZ': 2841,
  'Reno, NV': 2842,
  // Add your other locations
};
```

### Error Handling
```javascript
const handleDataForSEOError = (error) => {
  if (error.status === 401) {
    // Authentication issue
  } else if (error.status === 429) {
    // Rate limit exceeded
  } else {
    // Other API errors
  }
};
```

## Getting Started

1. **Start with Location Codes**: Get the location codes for your dealership regions
2. **Implement Search Volume**: Basic demand data for vehicle analysis
3. **Add Caching**: Cache responses to minimize API costs
4. **Enhance with Trends**: Add historical trend analysis
5. **Add Suggestions**: Get related search terms for deeper insights

Start with **Search Volume Live** and **Location Codes** to get basic demand intelligence working, then add the other endpoints for richer analysis.