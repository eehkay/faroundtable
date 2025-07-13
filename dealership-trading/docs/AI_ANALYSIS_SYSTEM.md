# AI Analysis System Documentation

## Overview

The AI Analysis System provides intelligent market insights by analyzing vehicle market trend reports through customizable AI models. It processes raw market data from multiple APIs and generates actionable recommendations for pricing, timing, and sales strategies.

## Architecture

### Data Flow

```
1. User generates Market Trend Report
2. User clicks "Analyze with AI"
3. System regenerates report with raw, unbiased data (includeRawData=true)
4. Raw data is formatted with context and sent to OpenAI
5. AI response is displayed with markdown formatting
```

### Key Components

- **Frontend**: `/app/(authenticated)/analytics/market-trend-report/page.tsx`
- **AI Analysis API**: `/app/api/analytics/market-trend-report/analyze/route.ts`
- **Market Report API**: `/app/api/analytics/market-trend-report/route.ts`
- **AI Settings**: Database table `ai_settings` with admin UI

## AI Settings Management

### Admin Interface
Located at `/admin/settings`, allows non-technical users to:
- Create custom AI personalities
- Configure AI models and parameters
- Set system prompts
- Manage temperature and token limits

### Available AI Models

**GPT-4 Models**
- `gpt-4-turbo-preview` (Default, recommended)
- `gpt-4-turbo`
- `gpt-4`
- `gpt-4-32k`

**GPT-4o Models** (Optimized for speed)
- `gpt-4o`
- `gpt-4o-mini`

**GPT-3.5 Models** (Budget-friendly)
- `gpt-3.5-turbo`
- `gpt-3.5-turbo-16k`

**Specialized Models**
- `o1-preview` (Advanced reasoning)
- `o1-mini` (Lightweight reasoning)

### Pre-configured AI Personalities

1. **Market Analyst** (Default)
   - Balanced analysis with comprehensive recommendations
   - Temperature: 0.7
   - Max tokens: 2000

2. **Aggressive Sales Strategist**
   - Focus on quick turnover and promotional strategies
   - Temperature: 0.8
   - Max tokens: 1500

3. **Premium Price Optimizer**
   - Maximizes profit margins for luxury positioning
   - Temperature: 0.6
   - Max tokens: 2000

4. **Speed Optimized Analyst**
   - Quick insights using GPT-4o
   - Temperature: 0.7
   - Max tokens: 1500

5. **Deep Reasoning Specialist**
   - Complex analysis using O1 models
   - Temperature: 0.5
   - Max tokens: 3000

## Data Structure

### Raw vs Processed Data

When `includeRawData=true`, the system provides:
- **Raw**: Unfiltered API responses for unbiased analysis
- **Processed**: Pre-calculated values for reference only

### Market Data Sections

1. **VEHICLE INFORMATION**
   ```json
   {
     "vin": "string",
     "year": number,
     "make": "string",
     "model": "string",
     "trim": "string",
     "mileage": number,
     "currentPrice": number
   }
   ```

2. **MARKET POSITION** (Price Analysis)
   - Price predictions with confidence levels
   - Market price ranges (upper/lower bounds)
   - Current price positioning

3. **INVENTORY ANALYSIS** (Supply & Demand)
   - Market Day Supply (MDS) - key metric
   - Inventory count and sales velocity
   - Interpretation:
     - MDS < 30: High demand/seller's market
     - MDS 30-60: Balanced market
     - MDS > 60: Oversupply/buyer's market

4. **REGIONAL PERFORMANCE**
   - Historical sales data for the region
   - Average prices, mileage, days on market
   - Sales volume and trends

5. **COMPETITIVE LANDSCAPE**
   - Top 20 similar vehicles (limited for token efficiency)
   - Pricing, distance, dealer information
   - Total inventory count

6. **DEMAND ANALYSIS**
   - Search volume data from DataForSEO
   - Vehicle-specific vs generic keywords
   - Consumer interest metrics

## Context System

### How Context is Provided

The context for each data section is **hard-coded** in the analyze API route:

```typescript
MARKET POSITION (Price Analysis):
- This section contains price prediction data...
- 'raw' contains unprocessed API responses...
- Key metrics: predicted_price, confidence level...
${JSON.stringify(reportData.marketPosition, null, 2)}
```

### Why Hard-Coded Context?

- **Consistency**: All analyses receive identical context
- **Reliability**: No database dependencies
- **Clarity**: AI always understands data structure

### Token Optimization

To manage token limits (128k max):
- Competitive vehicles limited to top 20
- Search keywords limited to top 5 vehicle-specific, top 3 generic
- Only essential fields extracted from raw API responses
- Data structured for clarity and brevity

## Debug Mode

### Features
- Token usage estimation
- Exact LLM payload preview
- Copy LLM payload to clipboard
- Download report data as JSON
- Visual indicators for data availability

### Token Estimation
- Rough calculation: 1 token ≈ 4 characters
- Shows breakdown by section
- Warns if approaching 120k limit

### How to Use Debug Mode
1. Enable debug toggle in AI Analysis section
2. Run analysis
3. View token breakdown and payload structure
4. Use "Copy LLM Payload" for exact data sent

## Best Practices

### For Users
1. Always review the Market Trend Report before AI analysis
2. Choose appropriate AI personality for your goals
3. Use custom prompts for specific questions
4. Enable debug mode to understand token usage

### For Developers
1. Keep context descriptions concise but clear
2. Monitor token usage when adding new data
3. Test with different AI models for performance
4. Update system prompts when data structure changes

## Common Issues

### Token Limit Exceeded
- **Symptom**: 400 error "maximum context length is 128000 tokens"
- **Solution**: Data is already optimized; consider using summarization

### Missing Data Sections
- **Symptom**: AI mentions missing data
- **Solution**: Check API availability (especially DataForSEO)

### Biased Recommendations
- **Symptom**: AI relies too heavily on pre-calculated scores
- **Solution**: System now uses `includeRawData=true` by default

## API Endpoints

### Generate Market Report
```
POST /api/analytics/market-trend-report
{
  "vin": "string",
  "currentPrice": number,
  "locationId": "string",
  "includeRawData": boolean,
  "overrides": {...}
}
```

### Analyze with AI
```
POST /api/analytics/market-trend-report/analyze
{
  "reportData": {...},
  "userPrompt": "string",
  "aiSettingId": "string" (optional),
  "systemPrompt": "string" (optional)
}
```

### Manage AI Settings
```
GET /api/admin/ai-settings
POST /api/admin/ai-settings
PUT /api/admin/ai-settings/[id]
DELETE /api/admin/ai-settings/[id]
```

## Future Enhancements

1. **Configurable Context**: Move context to database for admin control
2. **Streaming Responses**: Show AI analysis as it's generated
3. **History Tracking**: Store and compare AI analyses over time
4. **Multi-Vehicle Analysis**: Analyze multiple vehicles simultaneously
5. **Export Options**: PDF reports with AI insights

## Environment Variables

Required for AI functionality:
```
OPENAI_API_KEY=your-api-key-here
```

Optional for enhanced features:
```
ENABLE_ADVANCED_ANALYTICS=true
MARKETCHECK_API_KEY=your-key
DATAFORSEO_EMAIL=your-email
DATAFORSEO_API_KEY=your-key
```