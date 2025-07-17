# Regional Market Insights API Implementation Guide

## Overview
This guide provides the complete API implementation for building a Regional Market Insights report that combines MarketCheck inventory data with DataForSEO search demand to identify the best vehicles for acquisition.

## Prerequisites
- MarketCheck API Key
- DataForSEO API Credentials
- Location coordinates (e.g., Reno: 39.5296, -119.8138)

## API Endpoints Reference

### MarketCheck API (https://apidocs.marketcheck.com)
- Base URL: `https://mc-api.marketcheck.com/v2`
- Authentication: API key in query parameter

### DataForSEO API
- Base URL: `https://api.dataforseo.com/v3`
- Authentication: Basic Auth (base64 encoded credentials)

## Step-by-Step Implementation

### Step 1: Get Regional Top 50 Popular Cars (Optional - for market context)

```bash
# Get top 50 most popular used cars across the US
curl -X GET \
  "https://mc-api.marketcheck.com/v2/popular/cars/used?api_key=YOUR_API_KEY&limit=50" \
  -H "Accept: application/json"
```

**Sample Response:**
```json
[
  {
    "country": "us",
    "count": 166142,
    "make": "Ford",
    "model": "F-150",
    "price_stats": {
      "median": 26588,
      "mean": 28856,
      "min": 827,
      "max": 999999,
      "iqr": 18988
    },
    "miles_stats": {
      "median": 90655,
      "mean": 95789,
      "min": 1,
      "max": 2107805
    },
    "dom_stats": {
      "median": 112,
      "mean": 158,
      "min": 1,
      "max": 3971
    },
    "cpo_price_stats": {
      "median": 38500,
      "mean": 39753,
      "listings_count": 10129
    },
    "cpo_miles_stats": {
      "median": 42996,
      "mean": 49594
    },
    "cpo_dom_stats": {
      "median": 101,
      "mean": 136
    }
  },
  // ... 49 more vehicles
]
```

This gives you national context:
- **Ford F-150**: 166,142 units nationally, 112-day median DOM
- Compare to local: If Reno has 94-day DOM, F-150s move faster locally

### Step 2: Get City-Level Popular Cars with Complete Stats

```bash
# Get popular cars with price, mileage, and DOM statistics
curl -X GET \
  "https://mc-api.marketcheck.com/v2/popular/cars/city?api_key=YOUR_API_KEY&city_state=reno|NV&car_type=used&limit=50" \
  -H "Accept: application/json"
```

**Expected Response Structure:**
```json
[
  {
    "country": "us",
    "city": "Reno",
    "count": 197,
    "make": "Ford",
    "model": "F-150",
    "price_stats": {
      "median": 27393,
      "mean": 30004,
      "min": 3750,
      "max": 79989,
      "iqr": 18378
    },
    "miles_stats": {
      "median": 93558,
      "mean": 94023,
      "min": 2160,
      "max": 263789
    },
    "dom_stats": {
      "median": 94,
      "mean": 137,
      "min": 1,
      "max": 1125,
      "iqr": 128
    },
    "cpo_price_stats": { /* CPO specific stats */ },
    "cpo_miles_stats": { /* CPO specific stats */ },
    "cpo_dom_stats": { /* CPO specific stats */ }
  },
  // ... more vehicles
]
```

This single endpoint provides:
- **Inventory count** - How many units available
- **Price statistics** - Median, mean, IQR for pricing strategy
- **Mileage statistics** - Understand inventory condition
- **DOM statistics** - Market velocity (how fast they sell)
- **CPO statistics** - Certified pre-owned dynamics

### Step 3: Get Search Demand from DataForSEO

First, create your base64 credentials:
```bash
echo -n "your_login:your_password" | base64
```

Then get keyword data for each vehicle:

```bash
# Get search volume and related keywords
curl --request POST \
  --url https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live \
  --header 'Authorization: Basic YOUR_BASE64_CREDENTIALS' \
  --header 'Content-Type: application/json' \
  --data '[{
    "keywords": ["2022 Honda CR-V"],
    "location_coordinate": "39.5296,-119.8138,50",
    "language_code": "en",
    "sort_by": "search_volume",
    "keywords_negative": ["rental", "lease", "parts", "repair"]
  }]'
```

## Complete Implementation Flow

### 1. Data Collection Function (Simplified)

```javascript
async function collectMarketData(location, apiKeys) {
  const { marketcheck, dataforseo } = apiKeys;

  // Step 1: Get popular cars with all statistics
  const popularCarsUrl = `https://mc-api.marketcheck.com/v2/popular/cars/city?` +
    `api_key=${marketcheck}&city_state=reno|NV&car_type=used&limit=50`;
  
  const popularCars = await fetch(popularCarsUrl)
    .then(r => r.json());

  return popularCars;
}
```

### 2. Process Vehicles with Demand Data

```javascript
async function processVehiclesWithDemand(popularCars, location, apiKeys) {
  const enrichedVehicles = [];
  
  // Take top 25 vehicles by count
  const topVehicles = popularCars
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
  
  for (const vehicle of topVehicles) {
    // Get search demand from DataForSEO
    const searchData = await getSearchDemand(
      { make: vehicle.make, model: vehicle.model }, 
      location, 
      apiKeys.dataforseo
    );
    
    enrichedVehicles.push({
      make: vehicle.make,
      model: vehicle.model,
      inventory: vehicle.count,
      medianPrice: vehicle.price_stats.median,
      avgDOM: vehicle.dom_stats.mean,
      medianDOM: vehicle.dom_stats.median,
      priceRange: {
        min: vehicle.price_stats.min,
        max: vehicle.price_stats.max,
        iqr: vehicle.price_stats.iqr
      },
      searchVolume: searchData.totalVolume,
      searchTrend: searchData.trend,
      topKeywords: searchData.topKeywords,
      // Include CPO data if relevant
      hasCPO: vehicle.cpo_price_stats?.listings_count > 0,
      cpoMedianPrice: vehicle.cpo_price_stats?.median,
      cpoMedianDOM: vehicle.cpo_dom_stats?.median
    });
  }
  
  return enrichedVehicles;
}
```

### 3. Get Search Demand Function

```javascript
async function getSearchDemand(vehicle, location, dataforseoAuth) {
  const { year, make, model } = vehicle;
  
  const response = await fetch(
    'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + dataforseoAuth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keywords: [`${year} ${make} ${model}`],
        location_coordinate: `${location.lat},${location.lng},50`,
        language_code: "en",
        sort_by: "search_volume",
        keywords_negative: ["rental", "lease", "parts", "repair", "manual"]
      }])
    }
  );
  
  const data = await response.json();
  const keywords = data.tasks?.[0]?.result || [];
  
  // Calculate total search volume and trends
  const totalVolume = keywords
    .slice(0, 10)
    .reduce((sum, k) => sum + (k.search_volume || 0), 0);
  
  return {
    totalVolume,
    trend: calculateTrend(keywords[0]?.monthly_searches || []),
    topKeywords: keywords.slice(0, 5).map(k => ({
      keyword: k.keyword,
      volume: k.search_volume,
      competition: k.competition
    }))
  };
}

function calculateTrend(monthlySearches) {
  if (monthlySearches.length < 6) return 'stable';
  
  const recent = monthlySearches.slice(0, 3).reduce((sum, m) => sum + m.search_volume, 0) / 3;
  const older = monthlySearches.slice(3, 6).reduce((sum, m) => sum + m.search_volume, 0) / 3;
  
  const change = ((recent - older) / older) * 100;
  
  if (change > 20) return 'rising';
  if (change < -20) return 'declining';
  return 'stable';
}
```

### 4. Calculate Opportunity Score

```javascript
function calculateOpportunityScore(vehicle) {
  // Scoring factors (each out of 10)
  const factors = {
    // High search volume is good
    demandScore: Math.min(vehicle.searchVolume / 500, 10),
    
    // Low inventory is good (scarcity)
    scarcityScore: Math.max(10 - (vehicle.inventory / 5), 0),
    
    // Fast turnover is good (liquidity)
    velocityScore: Math.max(10 - (vehicle.avgDOM / 10), 0),
    
    // Rising trend is good
    trendScore: vehicle.searchTrend === 'rising' ? 10 : 
                vehicle.searchTrend === 'stable' ? 5 : 0
  };
  
  // Weighted average
  const score = (
    factors.demandScore * 0.35 +
    factors.scarcityScore * 0.25 +
    factors.velocityScore * 0.25 +
    factors.trendScore * 0.15
  );
  
  return {
    score: Math.round(score * 10) / 10,
    factors
  };
}
```

### 5. Generate Final Report

```javascript
function generateAcquisitionReport(vehicles) {
  // Add opportunity scores
  const scoredVehicles = vehicles.map(v => ({
    ...v,
    opportunity: calculateOpportunityScore(v)
  }));
  
  // Sort by opportunity score
  const sorted = scoredVehicles.sort((a, b) => 
    b.opportunity.score - a.opportunity.score
  );
  
  // Format report
  const report = {
    generated: new Date().toISOString(),
    market: "Reno, NV",
    topOpportunities: sorted.slice(0, 10).map(v => ({
      vehicle: `${v.year} ${v.make} ${v.model}`,
      score: v.opportunity.score,
      inventory: v.inventory,
      searchVolume: v.searchVolume,
      medianPrice: v.medianPrice,
      avgDaysOnMarket: v.avgDOM,
      trend: v.searchTrend,
      buyingGuidance: {
        targetBuyPrice: Math.round(v.medianPrice * 0.88), // 12% below median
        maxBuyPrice: Math.round(v.medianPrice * 0.92),    // 8% below median
        expectedSellPrice: v.medianPrice,
        estimatedProfit: Math.round(v.medianPrice * 0.08) // 8% margin
      },
      scoreBreakdown: v.opportunity.factors
    })),
    avoidList: sorted.slice(-5).filter(v => v.opportunity.score < 3)
  };
  
  return report;
}
```

## Example Output Format

```json
{
  "generated": "2024-12-13T10:30:00Z",
  "market": "Reno, NV",
  "topOpportunities": [
    {
      "vehicle": "2022 Toyota RAV4",
      "score": 8.5,
      "inventory": 3,
      "searchVolume": 2800,
      "medianPrice": 28500,
      "avgDaysOnMarket": 22,
      "trend": "rising",
      "buyingGuidance": {
        "targetBuyPrice": 25080,
        "maxBuyPrice": 26220,
        "expectedSellPrice": 28500,
        "estimatedProfit": 2280
      },
      "scoreBreakdown": {
        "demandScore": 10,
        "scarcityScore": 8,
        "velocityScore": 7.8,
        "trendScore": 10
      }
    }
    // ... more vehicles
  ]
}
```

## Testing the Complete Flow

```bash
# 1. Test MarketCheck Popular Cars endpoint
curl -X GET \
  "https://mc-api.marketcheck.com/v2/popular/cars/city?api_key=YOUR_KEY&city_state=reno|NV&car_type=used&limit=5" \
  -H "Accept: application/json"

# 2. Test DataForSEO connection
curl --request POST \
  --url https://api.dataforseo.com/v3/keywords_data/google_ads/languages \
  --header 'Authorization: Basic YOUR_CREDENTIALS'

# 3. Run complete flow
node regional-insights.js
```

## Key Benefits of Simplified Flow

1. **One MarketCheck API call** gives you all supply-side data
2. **Rich statistics included** - price, mileage, DOM all in one response
3. **CPO insights** - See if certified pre-owned moves faster
4. **Faster execution** - From ~60 API calls down to ~26 (1 MarketCheck + 25 DataForSEO)

## Example Insights from the Data

Looking at the sample data:
- **Ford F-150**: 197 units, 94-day median DOM (slow mover)
- **Toyota RAV4**: 176 units, 68-day median DOM (faster)
- **RAV4 CPO**: 53-day median DOM (even faster with certification)

## Error Handling

```javascript
async function safeApiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed API call to ${url}:`, error);
    return null;
  }
}
```

## Rate Limiting Considerations

- **MarketCheck**: 100 requests per minute
- **DataForSEO**: 2000 requests per minute

For 25 vehicles, you'll make approximately:
- 4 MarketCheck calls for market data
- 25 MarketCheck calls for individual stats
- 25 DataForSEO calls for search volume
- **Total time**: ~60-90 seconds with sequential processing

## Vercel Function Implementation

### Why Use a Vercel Function?

1. **API Key Security** - Keep credentials server-side
2. **CORS Handling** - APIs may block browser requests
3. **Progress Updates** - Stream real-time updates to users
4. **Data Processing** - Transform data before sending to frontend

### Streaming Vercel Function

```javascript
// /api/regional-insights/stream/route.js
export async function POST(request) {
  const { city, state } = await request.json();
  
  // Get API keys from environment
  const MARKETCHECK_KEY = process.env.MARKETCHECK_API_KEY;
  const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH;
  
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendUpdate = async (data) => {
    await writer.write(
      encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
    );
  };

  // Background processing
  (async () => {
    try {
      // Step 1: Get popular cars (2-3 seconds)
      await sendUpdate({ 
        type: 'status', 
        message: 'Analyzing popular vehicles in your market...',
        progress: 5
      });
      
      const popularCarsUrl = `https://mc-api.marketcheck.com/v2/popular/cars/city?` +
        `api_key=${MARKETCHECK_KEY}&city_state=${city}|${state}&car_type=used&limit=50`;
      
      const popularCars = await fetch(popularCarsUrl).then(r => r.json());
      
      await sendUpdate({ 
        type: 'status', 
        message: `Found ${popularCars.length} popular vehicles`,
        progress: 10
      });

      // Step 2: Process each vehicle with search demand
      const results = [];
      const topVehicles = popularCars.slice(0, 25); // Top 25
      
      for (let i = 0; i < topVehicles.length; i++) {
        const vehicle = topVehicles[i];
        
        await sendUpdate({ 
          type: 'status', 
          message: `Analyzing ${vehicle.make} ${vehicle.model} (${i + 1}/${topVehicles.length})`,
          progress: 10 + (i / topVehicles.length * 80)
        });
        
        // Get search demand
        const searchResponse = await fetch(
          'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live',
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + DATAFORSEO_AUTH,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
              keywords: [`${vehicle.make} ${vehicle.model}`],
              location_coordinate: `${request.location.lat},${request.location.lng},50`,
              language_code: "en",
              sort_by: "search_volume",
              keywords_negative: ["rental", "lease", "parts", "repair"]
            }])
          }
        );
        
        const searchData = await searchResponse.json();
        const keywords = searchData.tasks?.[0]?.result || [];
        
        // Calculate opportunity score
        const totalSearchVolume = keywords
          .slice(0, 10)
          .reduce((sum, k) => sum + (k.search_volume || 0), 0);
        
        results.push({
          ...vehicle,
          searchVolume: totalSearchVolume,
          topKeywords: keywords.slice(0, 5),
          opportunityScore: calculateOpportunityScore({
            ...vehicle,
            searchVolume: totalSearchVolume
          })
        });
      }
      
      // Step 3: Sort by opportunity and send final results
      await sendUpdate({ 
        type: 'status', 
        message: 'Calculating best opportunities...',
        progress: 95
      });
      
      const sortedResults = results.sort((a, b) => 
        b.opportunityScore.score - a.opportunityScore.score
      );
      
      await sendUpdate({ 
        type: 'complete',
        data: {
          generated: new Date().toISOString(),
          market: `${city}, ${state}`,
          topOpportunities: sortedResults.slice(0, 10),
          avoidList: sortedResults.filter(v => v.opportunityScore.score < 3)
        },
        progress: 100
      });
      
    } catch (error) {
      await sendUpdate({ 
        type: 'error', 
        message: error.message 
      });
    } finally {
      await writer.close();
    }
  })();

  // Return stream immediately
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function calculateOpportunityScore(vehicle) {
  const demandScore = Math.min(vehicle.searchVolume / 500, 10);
  const scarcityScore = Math.max(10 - (vehicle.count / 5), 0);
  const velocityScore = Math.max(10 - (vehicle.dom_stats.median / 10), 0);
  
  const score = (demandScore * 0.4 + scarcityScore * 0.3 + velocityScore * 0.3);
  
  return {
    score: Math.round(score * 10) / 10,
    factors: { demandScore, scarcityScore, velocityScore }
  };
}
```

### Frontend Implementation

```javascript
// components/RegionalInsightsReport.jsx
import { useState } from 'react';

function RegionalInsightsReport() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setStatus('generating');
    setProgress(0);
    
    const response = await fetch('/api/regional-insights/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        city: 'reno',
        state: 'NV'
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'status') {
            setProgress(data.progress);
          } else if (data.type === 'complete') {
            setReport(data.data);
            setStatus('complete');
          } else if (data.type === 'error') {
            setStatus('error');
          }
        }
      }
    }
  };

  return (
    <div>
      {status === 'idle' && (
        <button onClick={generateReport}>
          Generate Regional Insights Report
        </button>
      )}
      
      {status === 'generating' && (
        <div>
          <div>Generating report... {progress}%</div>
          <progress value={progress} max="100" />
        </div>
      )}
      
      {status === 'complete' && report && (
        <div>
          <h2>Top Acquisition Opportunities</h2>
          {report.topOpportunities.map((vehicle, i) => (
            <div key={i}>
              <h3>{vehicle.make} {vehicle.model}</h3>
              <p>Score: {vehicle.opportunityScore.score}/10</p>
              <p>Inventory: {vehicle.count} units</p>
              <p>Median DOM: {vehicle.dom_stats.median} days</p>
              <p>Search Volume: {vehicle.searchVolume}/mo</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Environment Variables

```bash
# .env.local
MARKETCHECK_API_KEY=your_marketcheck_key
DATAFORSEO_AUTH=your_base64_credentials
```

### Estimated Execution Time

- MarketCheck popular cars: 2-3 seconds
- DataForSEO searches (25 vehicles × 3 seconds): 75 seconds
- Total time: ~80-90 seconds

This implementation provides real-time progress updates while processing, making the wait time feel shorter for users.